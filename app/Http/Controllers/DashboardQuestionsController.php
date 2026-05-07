<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Configuration;
use App\Models\Lettre;
use App\Models\Office;
use App\Models\Produit;
use App\Models\QuestionIgnoree;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * DashboardQuestionsController — Questions contextuelles pour le widget Dashboard.
 *
 * Ce controller génère 3 questions "intelligentes" pour le libraire en analysant
 * les données actuelles (LCR, offices, stock, budgets) via un modèle d'IA.
 *
 * L'utilisateur peut ignorer une question : elle ne réapparaîtra plus pour lui.
 * En cas d'erreur IA, le widget reste simplement vide — pas d'erreur affichée.
 */
class DashboardQuestionsController extends Controller
{
    // =========================================================================
    // GÉNÉRATION DES QUESTIONS
    // =========================================================================

    /**
     * Génère et retourne les questions contextuelles du Dashboard.
     *
     * Étapes :
     * 1. Construire un résumé court de la situation financière (≈200 mots)
     * 2. Récupérer les questions déjà ignorées par cet utilisateur
     * 3. Appeler l'IA pour obtenir 3 questions en JSON
     * 4. Filtrer celles déjà ignorées
     * 5. Retourner le tableau JSON final
     *
     * @param  Request      $request  Requête HTTP entrante
     * @return JsonResponse           { questions: [...] } — tableau vide si erreur IA
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        // --- Étape 1 : résumé compact de la situation actuelle ---
        $resume = $this->buildResume();

        // --- Étape 2 : questions déjà ignorées par cet utilisateur ---
        // On récupère les question_id ignorés pour les filtrer ensuite
        $idsIgnores = QuestionIgnoree::where('user_id', $user->id)
            ->pluck('question_id')  // retourne une Collection de strings
            ->toArray();

        // --- Étape 3 : appel IA ---
        // Le prompt demande un tableau JSON de 3 questions percutantes
        $systemPrompt = <<<PROMPT
Tu es un assistant pour libraire. Analyse ces données et génère EXACTEMENT 3 questions
pertinentes et percutantes (max 15 mots chacune) que le libraire devrait se poser.
Format JSON STRICT : [{"id":"question_type_entiteid","question":"...","entite_type":"produit|distributeur|budget|general","entite_id":42,"contexte":"1 phrase max expliquant pourquoi cette question"}]
N'inclus PAS de question si l'entité n'est pas dans les données.
PROMPT;

        try {
            // L'IA reçoit le résumé en tant que message utilisateur
            $reponseTexte = $this->callIA($resume, $systemPrompt);

            // --- Étape 4 : parse du JSON retourné par l'IA ---
            // On tente d'extraire un tableau JSON valide depuis la réponse
            $questions = $this->parseQuestionsIA($reponseTexte);

            // --- Étape 5 : filtrage des questions ignorées ---
            $questions = array_filter(
                $questions,
                fn($q) => ! in_array($q['id'] ?? '', $idsIgnores)
            );

            // array_values() réindexe le tableau (array_filter conserve les clés)
            return response()->json(['questions' => array_values($questions)]);

        } catch (\Exception $e) {
            // En cas d'erreur IA (timeout, format invalide, etc.),
            // on logue discrètement et on retourne un tableau vide.
            // Le widget Dashboard affiche simplement "aucune suggestion".
            Log::warning('DashboardQuestionsController: erreur IA', [
                'message' => $e->getMessage(),
            ]);

            return response()->json(['questions' => []]);
        }
    }

    // =========================================================================
    // IGNORER UNE QUESTION
    // =========================================================================

    /**
     * Enregistre qu'un utilisateur a choisi d'ignorer une question.
     *
     * firstOrCreate() évite les doublons : si l'enregistrement existe déjà,
     * il n'est pas recréé (idempotent).
     *
     * @param  Request      $request  Corps JSON : question_id, entite_type?, entite_id?
     * @return JsonResponse           { success: true }
     */
    public function ignorer(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            // Identifiant textuel unique de la question (ex: "question_budget_3")
            'question_id'  => ['required', 'string', 'max:60'],
            // Type d'entité concernée (optionnel)
            'entite_type'  => ['nullable', 'string', 'max:30'],
            // ID de l'entité concernée (optionnel)
            'entite_id'    => ['nullable', 'integer'],
        ]);

        // Crée l'enregistrement si la combinaison n'existe pas encore
        QuestionIgnoree::firstOrCreate([
            'user_id'     => auth()->id(),
            'question_id' => $donnees['question_id'],
            'entite_type' => $donnees['entite_type'] ?? null,
            'entite_id'   => $donnees['entite_id']   ?? null,
        ]);

        return response()->json(['success' => true]);
    }

    // =========================================================================
    // MÉTHODES PRIVÉES
    // =========================================================================

    /**
     * Construit un résumé textuel court (≈200 mots) de la situation actuelle.
     *
     * Ce résumé est envoyé à l'IA pour qu'elle génère des questions pertinentes.
     * On évite d'envoyer trop de données pour limiter les tokens et le délai.
     *
     * @return string  Texte résumant LCR, offices, stock et budget du mois
     */
    private function buildResume(): string
    {
        $lignes = [];

        // ── LCR en retard ────────────────────────────────────────────────────
        // Nombre et montant total des lettres de change dépassées
        $lcrEnRetard       = Lettre::actif()->where('statut', 'en_retard');
        $nbLcrRetard       = $lcrEnRetard->count();
        $montantLcrRetard  = round((float) $lcrEnRetard->sum('montant_ttc'), 2);

        $lignes[] = "LCR en retard : {$nbLcrRetard} lettre(s) pour {$montantLcrRetard} € au total.";

        // ── Offices en alerte de retour ──────────────────────────────────────
        // Offices dont la date limite de retour approche (30 jours) ou est dépassée
        $nbOfficesAlerte = Office::actif()
            ->whereNotIn('statut', ['paye', 'retourne'])
            ->where('date_retour_limite', '<=', now()->addDays(30))
            ->count();

        $lignes[] = "Offices en alerte retour (30 j) : {$nbOfficesAlerte}.";

        // ── Stock ────────────────────────────────────────────────────────────
        // Produits sous le seuil d'alerte et en rupture complète
        $tousProduitsActifs = Produit::actif()->get();

        // On utilise les accesseurs du modèle pour cohérence avec l'affichage UI
        $nbAlerte  = $tousProduitsActifs->filter(fn($p) => $p->en_alerte && ! $p->en_rupture)->count();
        $nbRupture = $tousProduitsActifs->filter(fn($p) => $p->en_rupture)->count();

        $lignes[] = "Stock : {$nbAlerte} produit(s) en alerte, {$nbRupture} en rupture.";

        // Produits dormants : stock > 0, pas de mouvement depuis 8 semaines,
        // triés par date de parution croissante (les plus vieux en premier)
        $dormants = Produit::actif()
            ->where('stock_physique', '>', 0)
            ->whereDoesntHave(
                'mouvements',
                fn($q) => $q->where('created_at', '>=', now()->subWeeks(8))
            )
            ->orderBy('date_parution')  // les plus anciens en priorité
            ->limit(3)
            ->get();

        if ($dormants->isNotEmpty()) {
            $listeDormants = $dormants->map(
                fn($p) => "\"{$p->titre}\" (stock: {$p->stock_physique}, paru: "
                        . ($p->date_parution ? $p->date_parution->format('d/m/Y') : '?') . ')'
            )->join(', ');

            $lignes[] = "Produits dormants (stock sans mouvement depuis 8 semaines) : {$listeDormants}.";
        }

        // ── Budget du mois courant ───────────────────────────────────────────
        // Comparaison prévu vs réel si des données existent pour ce mois
        $budgetsMoisCourant = Budget::periode(now()->year, now()->month)->get();

        if ($budgetsMoisCourant->isNotEmpty()) {
            $totalPrevu = round($budgetsMoisCourant->sum('montant_prevu'), 2);
            $totalReel  = round($budgetsMoisCourant->whereNotNull('montant_reel')->sum('montant_reel'), 2);
            $aDesReels  = $budgetsMoisCourant->whereNotNull('montant_reel')->isNotEmpty();

            $moisLabel = now()->locale('fr')->isoFormat('MMMM YYYY');

            if ($aDesReels) {
                $ecart     = round($totalReel - $totalPrevu, 2);
                $signe     = $ecart >= 0 ? '+' : '';
                $lignes[]  = "Budget {$moisLabel} : prévu {$totalPrevu} €, réel {$totalReel} € (écart {$signe}{$ecart} €).";
            } else {
                $lignes[] = "Budget {$moisLabel} : prévu {$totalPrevu} € (montants réels non encore renseignés).";
            }
        }

        // On joint toutes les lignes en un seul texte à envoyer à l'IA
        return implode("\n", $lignes);
    }

    /**
     * Appelle le modèle d'IA configuré (Groq ou Ollama) et retourne la réponse.
     *
     * Le provider est choisi via la variable d'environnement AI_PROVIDER.
     * - 'groq'  : API cloud Groq (rapide, nécessite une clé GROQ_API_KEY)
     * - default : Ollama local (aucune clé, mais doit être lancé localement)
     *
     * Timeout volontairement court (30 s) car ce widget est affiché en arrière-plan.
     *
     * @param  string  $userMessage   Le contenu à analyser (le résumé)
     * @param  string  $systemPrompt  Les instructions données à l'IA
     * @return string                 La réponse textuelle brute de l'IA
     * @throws \Exception             Si l'appel HTTP échoue ou si la clé est manquante
     */
    private function callIA(string $userMessage, string $systemPrompt): string
    {
        // On construit le tableau de messages au format standard (Groq + Ollama)
        $messages = [
            ['role' => 'system',  'content' => $systemPrompt],
            ['role' => 'user',    'content' => $userMessage],
        ];

        return match (config('services.ai.provider', 'ollama')) {
            'groq'  => $this->callGroq($messages),
            default => $this->callOllama($messages),
        };
    }

    /**
     * Appel à l'API Groq (format compatible OpenAI).
     *
     * @param  array   $messages  Tableau de messages [role, content]
     * @return string             Contenu texte de la réponse
     * @throws \Exception         Si la clé est absente ou si la requête échoue
     */
    private function callGroq(array $messages): string
    {
        $key = config('services.groq.key');

        if (! $key) {
            throw new \Exception(
                'Clé GROQ_API_KEY manquante dans le .env.'
            );
        }

        $response = Http::timeout(30)
            ->withToken($key)   // Header : Authorization: Bearer <key>
            ->post(config('services.groq.url') . '/chat/completions', [
                'model'    => config('services.groq.model'),
                'messages' => $messages,
            ]);

        if ($response->failed()) {
            $detail = $response->json('error.message', $response->body());
            throw new \Exception("Erreur Groq : {$detail}");
        }

        // Groq retourne : { choices: [{ message: { content: "..." } }] }
        return $response->json('choices.0.message.content', '');
    }

    /**
     * Appel à Ollama (modèle local).
     *
     * @param  array   $messages  Tableau de messages [role, content]
     * @return string             Contenu texte de la réponse
     * @throws \Exception         Si Ollama n'est pas lancé ou si la requête échoue
     */
    private function callOllama(array $messages): string
    {
        $response = Http::timeout(30)
            ->post(config('services.ollama.url') . '/api/chat', [
                'model'    => config('services.ollama.model'),
                'messages' => $messages,
                'stream'   => false,   // On attend la réponse complète en une fois
            ]);

        if ($response->failed()) {
            $detail = $response->json('error', $response->body());
            throw new \Exception(
                "Impossible de joindre Ollama. "
                . "Vérifie qu'il est bien lancé (ollama serve). Détail : {$detail}"
            );
        }

        // Ollama retourne : { message: { content: "..." } }
        return $response->json('message.content', '');
    }

    /**
     * Parse la réponse textuelle de l'IA pour en extraire un tableau de questions.
     *
     * L'IA peut parfois entourer le JSON de texte parasite (```json ... ```).
     * On tente donc d'isoler le premier tableau JSON valide dans la réponse.
     *
     * @param  string  $texte  Réponse brute de l'IA
     * @return array           Tableau de questions (peut être vide si parse échoue)
     */
    private function parseQuestionsIA(string $texte): array
    {
        // Tentative 1 : parse direct du texte brut
        $decoded = json_decode($texte, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        // Tentative 2 : extraction par regex du bloc JSON entre [ et ]
        // L'IA entoure parfois sa réponse de ``` ou de texte explicatif
        if (preg_match('/\[.*?\]/s', $texte, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        // Si le JSON n'est pas parseable, on retourne un tableau vide.
        // Le widget affichera simplement "aucune suggestion" sans crash.
        Log::warning('DashboardQuestionsController: JSON IA non parseable', [
            'reponse' => substr($texte, 0, 300),  // on logue les 300 premiers caractères
        ]);

        return [];
    }
}
