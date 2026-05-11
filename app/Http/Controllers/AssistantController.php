<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use App\Models\Distributeur;
use App\Models\FicheMission;
use App\Models\Lettre;
use App\Models\Office;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class AssistantController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Assistant', [
            /* On expose le nom lisible du provider + modèle pour l'affichage dans l'UI */
            'aiProvider' => config('services.ai.provider', 'ollama'),
            'aiModel'    => $this->aiModelName(),
            /* Résumé financier affiché dans la carte de contexte */
            'contexte'   => $this->contexteFinancier(),
        ]);
    }

    public function message(Request $request): JsonResponse
    {
        $messages = $request->validate([
            'messages'           => ['required', 'array', 'min:1', 'max:50'],
            'messages.*.role'    => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:4000'],
        ])['messages'];

        $systemPrompt = $this->buildSystemPrompt();

        try {
            $reply = match (config('services.ai.provider', 'ollama')) {
                'groq'  => $this->callGroq($messages, $systemPrompt),
                default => $this->callOllama($messages, $systemPrompt),
            };
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 503);
        }

        return response()->json(['message' => $reply]);
    }

    // ── Appel Groq (OpenAI-compatible) ───────────────────────────────────────
    // Groq expose le même format qu'OpenAI : POST /chat/completions
    // Réponse : { choices: [{ message: { content: "..." } }] }

    private function callGroq(array $messages, string $systemPrompt): string
    {
        $key = config('services.groq.key');
        if (! $key) {
            throw new \Exception(
                'Clé GROQ_API_KEY manquante dans le .env. '
                . 'Crée un compte sur console.groq.com → API Keys.'
            );
        }

        $response = Http::timeout(60)
            ->withToken($key)       // header : Authorization: Bearer <key>
            ->post(config('services.groq.url') . '/chat/completions', [
                'model'    => config('services.groq.model'),
                'messages' => $this->buildMessages($messages, $systemPrompt),
            ]);

        if ($response->failed()) {
            $detail = $response->json('error.message', $response->body());
            throw new \Exception("Erreur Groq : {$detail}");
        }

        return $response->json('choices.0.message.content', '…');
    }

    // ── Appel Ollama (local) ─────────────────────────────────────────────────
    // Ollama expose POST /api/chat
    // Réponse : { message: { content: "..." } }

    private function callOllama(array $messages, string $systemPrompt): string
    {
        $response = Http::timeout(120)
            ->post(config('services.ollama.url') . '/api/chat', [
                'model'    => config('services.ollama.model'),
                'messages' => $this->buildMessages($messages, $systemPrompt),
                'stream'   => false,
            ]);

        if ($response->failed()) {
            $detail = $response->json('error', $response->body());
            throw new \Exception(
                "Impossible de joindre Ollama. "
                . "Vérifie qu'il est bien lancé (ollama serve). Détail : {$detail}"
            );
        }

        return $response->json('message.content', '…');
    }

    // ── Construction du tableau de messages ──────────────────────────────────
    // Les deux APIs (Groq et Ollama) acceptent le même format :
    // [{ role: "system"|"user"|"assistant", content: "..." }, ...]

    private function buildMessages(array $userMessages, string $systemPrompt): array
    {
        return [
            ['role' => 'system', 'content' => $systemPrompt],
            ...$userMessages,
        ];
    }

    // ── Nom lisible du modèle actif (affiché dans l'UI) ──────────────────────

    private function aiModelName(): string
    {
        return match (config('services.ai.provider', 'ollama')) {
            'groq'  => config('services.groq.model', 'llama-3.3-70b-versatile') . ' (Groq)',
            default => config('services.ollama.model', 'qwen2.5:7b') . ' (local)',
        };
    }

    // ── Résumé rapide pour la carte contexte (affiché dans l'UI) ─────────────

    private function contexteFinancier(): array
    {
        return [
            'lcr_en_retard'  => round((float) Lettre::actif()->where('statut', 'en_retard')->sum('montant_ttc'), 2),
            'lcr_en_attente' => round((float) Lettre::actif()->where('statut', 'en_attente')->sum('montant_ttc'), 2),
            'offices_alerte' => Office::actif()
                ->whereNotIn('statut', ['paye', 'retourne'])
                ->where('date_retour_limite', '<=', now()->addDays(30))
                ->count(),
            'total_impaye'   => round((float) Lettre::actif()
                ->whereIn('statut', ['en_attente', 'en_retard'])
                ->sum('montant_ttc'), 2),
        ];
    }

    // ── Section benchmark réseau (injectée dans le prompt si disponible) ─────

    private function buildBenchmarkSection(Configuration $config): string
    {
        // Pas de données → section vide, pas de texte inutile dans le prompt
        if (! $config->benchmark_actif || ! $config->benchmark_donnees) {
            return '';
        }

        $b            = $config->benchmark_donnees;
        $meta         = $b['meta']     ?? [];
        $stockReseau  = $b['stock']    ?? [];
        $finReseau    = $b['financier'] ?? [];

        $participants = $meta['participants'] ?? 1;
        $majDate      = $meta['mis_a_jour']   ?? 'inconnue';
        $sourceLabel  = ($meta['source'] ?? 'réseau') === 'local'
            ? 'données locales uniquement'
            : "{$participants} librairie(s) participante(s)";

        // ── Statistiques locales pour comparaison ─────────────────────────────
        $produits    = Produit::actif()->get();
        $totalLocal  = $produits->count();

        $stockMoyenLocal  = $totalLocal > 0 ? round($produits->avg('stock_physique'), 2) : 0;
        $enRuptureLocal   = $totalLocal > 0 ? $produits->where('stock_physique', '<=', 0)->count() : 0;
        $tauxRuptureLocal = $totalLocal > 0 ? round($enRuptureLocal / $totalLocal * 100, 1) : 0;

        // ── Réseau ────────────────────────────────────────────────────────────
        $stockMoyenReseau  = $stockReseau['stock_moyen_reseau']  ?? null;
        $tauxRuptureReseau = $stockReseau['taux_rupture_moyen']  ?? null;

        // ── Comparaisons (delta en %) ─────────────────────────────────────────
        $deltaStock   = $stockMoyenReseau  ? $stockMoyenLocal  - $stockMoyenReseau  : null;
        $deltaRupture = $tauxRuptureReseau ? $tauxRuptureLocal - $tauxRuptureReseau : null;

        $stockCompa   = $this->signeCompa($deltaStock);
        $ruptureCompa = $this->signeCompa($deltaRupture, inverse: true); // élevé = mauvais

        // ── Genres réseau ─────────────────────────────────────────────────────
        $genresReseau = $stockReseau['genres'] ?? [];
        $genresLocaux = $produits->whereNotNull('genre')
            ->groupBy('genre')
            ->map(fn($g) => round($g->count() / max($totalLocal, 1) * 100))
            ->sortDesc();

        $genresLines = '';
        foreach ($genresReseau as $genre => $data) {
            $partReseau = $data['part_pourcent'] ?? 0;
            $partLocal  = $genresLocaux[$genre] ?? 0;
            $diff       = $partLocal - $partReseau;
            $flag       = abs($diff) >= 10 ? ($diff > 0 ? ' ↑' : ' ↓') : '';
            $genresLines .= "  - {$genre} : réseau {$partReseau}% | vous {$partLocal}%{$flag}\n";
        }

        // ── EANs populaires manquants dans le catalogue local ─────────────────
        $eansPopulaires  = $stockReseau['eans_populaires'] ?? [];
        $eansLocaux      = Produit::actif()->whereNotNull('ean')->pluck('ean')->toArray();

        $manquants = array_filter($eansPopulaires, function ($item) use ($eansLocaux) {
            return ! in_array($item['ean'] ?? '', $eansLocaux, true)
                && ($item['present_chez_pourcent'] ?? 0) >= 70;
        });

        $manquantsLines = '';
        foreach (array_slice($manquants, 0, 5) as $item) {
            $titre     = $item['titre']                   ?? $item['ean'];
            $presence  = $item['present_chez_pourcent']   ?? '?';
            $stockMoy  = isset($item['stock_moyen']) ? " (stock moyen réseau : {$item['stock_moyen']} ex.)" : '';
            $manquantsLines .= "  - {$titre} ({$item['ean']}) — présent chez {$presence}% du réseau{$stockMoy}\n";
        }

        // ── Construction de la section texte ──────────────────────────────────
        $section  = "\n=== BENCHMARK RÉSEAU INCUNABLE ({$sourceLabel}, màj : {$majDate}) ===\n";

        if ($stockMoyenReseau !== null) {
            $section .= "Stock moyen par titre : réseau {$stockMoyenReseau} ex. | vous {$stockMoyenLocal} ex. {$stockCompa}\n";
        }
        if ($tauxRuptureReseau !== null) {
            $section .= "Taux de rupture : réseau {$tauxRuptureReseau}% | vous {$tauxRuptureLocal}% {$ruptureCompa}\n";
        }

        if ($genresLines) {
            $section .= "Répartition genres (réseau vs vous) :\n{$genresLines}";
        }

        if ($manquantsLines) {
            $section .= "Titres populaires du réseau absents de votre catalogue (≥70% des librairies) :\n{$manquantsLines}";
        }

        return $section;
    }

    /**
     * Retourne un indicateur textuel selon le signe du delta.
     * Si $inverse = true, un delta positif est une mauvaise nouvelle (ex: taux de rupture).
     */
    private function signeCompa(?float $delta, bool $inverse = false): string
    {
        if ($delta === null) return '';
        if (abs($delta) < 0.3) return '≈ dans la moyenne';

        $positif = $delta > 0;
        if ($inverse) $positif = ! $positif;

        return $positif
            ? sprintf('✓ (+%.1f)', abs($delta))
            : sprintf('⚠ (%.1f)', -abs($delta));
    }

    // ── System prompt complet avec toutes les données de la BDD ──────────────

    private function buildSystemPrompt(): string
    {
        $mois   = now()->locale('fr')->isoFormat('dddd D MMMM YYYY');
        $config = Configuration::get();

        // ── Distributeurs ────────────────────────────────────────────────────
        $distributeurs = Distributeur::orderBy('nom')->get();
        $distribLines = $distributeurs->map(fn($d) =>
            "  - {$d->nom} | LCR: {$d->delai_commandes_mois} mois | Offices: {$d->delai_offices_mois} mois"
            . ($d->email ? " | {$d->email}" : '')
        )->join("\n");

        // ── LCR actives ──────────────────────────────────────────────────────
        $lcrs = Lettre::with('distributeur')->actif()->orderBy('date_echeance')->get();

        $lcrParStatut = [
            'en_retard' => $lcrs->where('statut', 'en_retard'),
            'en_attente' => $lcrs->where('statut', 'en_attente'),
            'paye'       => $lcrs->where('statut', 'paye'),
        ];

        $lcrSection = $lcrs->map(fn($l) =>
            "  [{$l->statut}] {$l->reference} — {$l->distributeur->nom}"
            . " — {$l->montant_ttc} € — émis: {$l->date_emission->format('d/m/Y')}"
            . " — échéance: {$l->date_echeance->format('d/m/Y')}"
            . ($l->statut === 'en_retard' ? " — RETARD: {$l->jours_restants} j" : '')
            . ($l->statut === 'en_attente' ? " — dans {$l->jours_restants} j" : '')
            . ($l->notes ? " — note: {$l->notes}" : '')
        )->join("\n");

        $lcrKpis = sprintf(
            "Total LCR actives: %d | En retard: %s € (%d) | En attente: %s € (%d) | Payées: %d",
            $lcrs->count(),
            number_format($lcrParStatut['en_retard']->sum('montant_ttc'), 2, ',', ' '),
            $lcrParStatut['en_retard']->count(),
            number_format($lcrParStatut['en_attente']->sum('montant_ttc'), 2, ',', ' '),
            $lcrParStatut['en_attente']->count(),
            $lcrParStatut['paye']->count(),
        );

        // ── Offices actifs ───────────────────────────────────────────────────
        $offices = Office::with('distributeur')->actif()->orderBy('date_retour_limite')->get();

        $officeSection = $offices->map(fn($o) =>
            "  [{$o->statut}] {$o->reference} — {$o->distributeur->nom}"
            . " — type: {$o->type} — {$o->montant_ttc} € (retourné: {$o->montant_retourne} €)"
            . " — reçu: {$o->date_reception->format('d/m/Y')}"
            . " — retour limite: {$o->date_retour_limite->format('d/m/Y')}"
            . ($o->jours_retour_restants < 0 ? " — EN RETARD: {$o->jours_retour_restants} j" : " — dans {$o->jours_retour_restants} j")
            . ($o->notes ? " — note: {$o->notes}" : '')
        )->join("\n");

        $officeKpis = sprintf(
            "Total offices actifs: %d | Valeur totale: %s € | Net après retours: %s €",
            $offices->count(),
            number_format($offices->sum('montant_ttc'), 2, ',', ' '),
            number_format($offices->sum(fn($o) => $o->montant_net), 2, ',', ' '),
        );

        // ── Fiches missions ──────────────────────────────────────────────────
        $fiches = FicheMission::orderBy('priorite')->get();
        $fichesSection = $fiches->isEmpty() ? '  Aucune fiche.' : $fiches->map(fn($f) =>
            "  [{$f->priorite}] [{$f->statut}] {$f->titre}"
            . ($f->auteur ? " — {$f->auteur}" : '')
            . ($f->editeur ? " ({$f->editeur})" : '')
            . ($f->prix_ttc ? " — {$f->prix_ttc} €" : '')
            . ($f->notes ? " — {$f->notes}" : '')
        )->join("\n");

        // ── Benchmark réseau (si disponible) ─────────────────────────────────
        $benchmarkSection = $this->buildBenchmarkSection($config);

        return <<<PROMPT
Tu es un conseiller expert en gestion de librairie manga et culture japonaise (BD japonaise, light novels, figurines, goodies).
Tu connais les spécificités du marché du manga en France : rythme de parution soutenu, forte saisonnalité (rentrée, Noël, Japan Expo), importance du suivi des séries en cours, gestion des tomes manquants, et sensibilité des lecteurs aux ruptures.
Tu as accès à l'intégralité de la base de données de la librairie en temps réel.
Date du jour : {$mois}
Librairie : {$config->nom_librairie}

=== DISTRIBUTEURS ({$distributeurs->count()}) ===
{$distribLines}

=== LETTRES DE CHANGE (LCR) ===
{$lcrKpis}
Détail :
{$lcrSection}

=== OFFICES ===
{$officeKpis}
Détail :
{$officeSection}

=== FICHES MISSIONS ({$fiches->count()}) ===
{$fichesSection}
{$benchmarkSection}
=== RÈGLES DE RÉPONSE ===
- Réponds toujours en français, de façon concise et professionnelle.
- Utilise les données ci-dessus pour personnaliser précisément tes conseils (cite les références, les montants, les distributeurs).
- Si une info manque, demande une précision.
- Priorités de conseil : LCR en retard > offices en retard > LCR à venir proche > ruptures sur séries populaires.
- Quand le benchmark réseau est disponible, compare les indicateurs de cette librairie au réseau et mentionne les écarts significatifs (> 20%).
- Pour le manga : signale les tomes manquants dans une série, alerte sur les parutions à venir de séries à fort tirage, et recommande les réassorts sur les shonen populaires.
PROMPT;
    }
}
