<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use App\Models\Distributeur;
use App\Models\FicheMission;
use App\Models\Lettre;
use App\Models\Office;
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

        return <<<PROMPT
Tu es un conseiller financier expert en gestion de librairie indépendante française.
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

=== RÈGLES DE RÉPONSE ===
- Réponds toujours en français, de façon concise et professionnelle.
- Utilise les données ci-dessus pour personnaliser précisément tes conseils (cite les références, les montants, les distributeurs).
- Si une info manque, demande une précision.
- Priorités de conseil : LCR en retard > offices en retard > LCR à venir proche.
PROMPT;
    }
}
