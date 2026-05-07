<?php

namespace App\Http\Controllers;

use App\Models\MouvementStock;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * WebhookController — reçoit les données de Librisoft via ETL4hub.
 *
 * Architecture des sources de données :
 *   1. Webhook (temps réel)   → POST /webhooks/librisoft  (cette classe)
 *   2. Export CSV programmé   → php artisan import:librisoft {fichier}
 *   3. Import CSV manuel      → upload depuis l'interface (à venir)
 *
 * Sécurité :
 *   ETL4hub signe chaque requête avec un HMAC-SHA256 du corps (body).
 *   La clé secrète est dans le .env : WEBHOOK_SECRET_LIBRISOFT
 *   Si la signature ne correspond pas → on rejette avec 401.
 *
 * Format attendu (à confirmer avec ETL4hub) :
 *   Le format exact dépend du connecteur Librisoft d'ETL4hub.
 *   Une fois connu, ajouter le mapping dans processerVentes() / processerStock().
 */
class WebhookController extends Controller
{
    // ── Point d'entrée principal ─────────────────────────────────────────────

    public function librisoft(Request $request): JsonResponse
    {
        // 1. Vérification de la signature (sécurité)
        if (! $this->signatureValide($request)) {
            Log::warning('Webhook Librisoft : signature invalide', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Signature invalide.'], 401);
        }

        $payload = $request->json()->all();

        // 2. Log de réception (utile pour déboguer pendant l'intégration)
        Log::info('Webhook Librisoft reçu', [
            'event'        => $payload['event'] ?? 'inconnu',
            'nb_lignes'    => count($payload['data'] ?? []),
            'source_ip'    => $request->ip(),
        ]);

        // 3. Dispatch selon le type d'événement envoyé par ETL4hub
        // Les noms d'événements seront confirmés avec ETL4hub.
        $event = $payload['event'] ?? null;

        match ($event) {
            'ventes'  => $this->processerVentes($payload['data'] ?? []),
            'stock'   => $this->processerStock($payload['data'] ?? []),
            'produits'=> $this->processerProduits($payload['data'] ?? []),
            default   => Log::warning("Webhook Librisoft : événement inconnu [{$event}]"),
        };

        // IMPORTANT : toujours retourner 200.
        // Si on retourne une erreur, ETL4hub retentera l'envoi en boucle.
        return response()->json(['status' => 'ok']);
    }

    // ── Vérification HMAC-SHA256 ─────────────────────────────────────────────

    /**
     * ETL4hub envoie l'en-tête X-Webhook-Signature avec la valeur :
     *   sha256=<HMAC_SHA256(corps_brut, WEBHOOK_SECRET_LIBRISOFT)>
     *
     * On recalcule le HMAC et on compare.
     * hash_equals() évite les attaques par timing.
     */
    private function signatureValide(Request $request): bool
    {
        $secret = config('services.webhook.librisoft_secret');

        // Si aucune clé configurée, on accepte tout (mode développement).
        // En production : WEBHOOK_SECRET_LIBRISOFT doit être renseigné.
        if (! $secret) {
            Log::warning('Webhook : WEBHOOK_SECRET_LIBRISOFT non configuré — signature non vérifiée.');
            return true;
        }

        $signatureRecue = $request->header('X-Webhook-Signature', '');
        $attendue = 'sha256=' . hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($attendue, $signatureRecue);
    }

    // ── Handlers par type d'événement ────────────────────────────────────────
    // Ces méthodes seront complétées une fois le format ETL4hub connu.

    /**
     * Synchronise le catalogue produits depuis Librisoft.
     *
     * Format JSON attendu (payload['data']) :
     *   [ { "ean":"9782070360024", "titre":"...", "auteur":"...",
     *       "editeur":"...", "prix_ttc":8.50, "type":"livre", "genre":"Roman" }, … ]
     *
     * Stratégie : upsert sur EAN — crée si absent, met à jour si présent.
     * Les champs null dans le payload sont ignorés (on ne remplace pas
     * une valeur existante par null).
     */
    private function processerProduits(array $lignes): void
    {
        $nb = 0;
        $erreurs = 0;

        foreach ($lignes as $ligne) {
            // Normalisation des clés (le format ETL4hub peut varier en casse)
            $d = array_change_key_case($ligne, CASE_LOWER);

            $ean = trim($d['ean'] ?? '');
            if (! $ean) continue;

            try {
                // array_filter retire les valeurs null pour ne pas écraser les données existantes
                Produit::updateOrCreate(
                    ['ean' => $ean],
                    array_filter([
                        'titre'    => $d['titre']   ?? null,
                        'auteur'   => $d['auteur']  ?? null,
                        'editeur'  => $d['editeur'] ?? null,
                        'prix_ttc' => isset($d['prix_ttc'])
                            ? (float) str_replace(',', '.', $d['prix_ttc'])
                            : null,
                        'type'     => isset($d['type'])
                            ? (in_array(strtolower($d['type']), ['livre', 'goodie']) ? strtolower($d['type']) : 'livre')
                            : null,
                        'genre'    => $d['genre'] ?? $d['rayon'] ?? null,
                    ], fn($v) => $v !== null)
                );
                $nb++;
            } catch (\Exception $e) {
                $erreurs++;
                Log::error("Webhook Librisoft — produit EAN {$ean} : {$e->getMessage()}");
            }
        }

        Log::info("Webhook Librisoft : {$nb} produits synchronisés, {$erreurs} erreurs.");
    }

    /**
     * Met à jour les niveaux de stock depuis Librisoft.
     *
     * Format JSON attendu :
     *   [ { "ean":"9782070360024", "stock_physique":12 }, … ]
     *
     * Pour chaque ligne, si le stock change, on crée un MouvementStock
     * pour conserver l'historique (type = entree ou sortie).
     */
    private function processerStock(array $lignes): void
    {
        $nb = 0;

        foreach ($lignes as $ligne) {
            $d   = array_change_key_case($ligne, CASE_LOWER);
            $ean = trim($d['ean'] ?? '');

            // stock_physique ou stock selon ce qu'ETL4hub envoie
            $stockBrut = $d['stock_physique'] ?? $d['stock'] ?? null;

            if (! $ean || $stockBrut === null) continue;

            $produit = Produit::where('ean', $ean)->first();
            if (! $produit) continue;   // EAN inconnu → on ignore

            $nouveauStock = (int) $stockBrut;
            $delta        = $nouveauStock - $produit->stock_physique;

            if ($delta === 0) continue; // Pas de changement → rien à faire

            $produit->update(['stock_physique' => $nouveauStock]);

            // Traçabilité : enregistrement du mouvement de stock
            MouvementStock::create([
                'produit_id'  => $produit->id,
                'user_id'     => null,          // source automatique (pas d'utilisateur)
                'type'        => $delta > 0 ? 'entree' : 'sortie',
                'quantite'    => abs($delta),
                'stock_apres' => $nouveauStock,
                'motif'       => 'Synchronisation stock Librisoft (webhook)',
                'source'      => 'webhook_librisoft',
            ]);

            $nb++;
        }

        Log::info("Webhook Librisoft : {$nb} niveau(x) de stock mis à jour.");
    }

    /**
     * Enregistre les ventes de la journée depuis Librisoft.
     *
     * Format JSON attendu :
     *   [ { "ean":"9782070360024", "qte_vendue":2, "date_vente":"2026-05-05",
     *       "prix_unitaire":8.50 }, … ]
     *
     * Chaque vente décrémente le stock et crée un mouvement de type 'sortie'.
     * Si le produit n'existe pas encore, il est créé avec stock = 0.
     */
    private function processerVentes(array $lignes): void
    {
        $nb = 0;

        foreach ($lignes as $ligne) {
            $d   = array_change_key_case($ligne, CASE_LOWER);
            $ean = trim($d['ean'] ?? '');
            $qte = (int) ($d['qte_vendue'] ?? $d['quantite'] ?? 0);

            if (! $ean || $qte <= 0) continue;

            $produit = Produit::where('ean', $ean)->first();
            if (! $produit) continue;   // produit inconnu → ignore

            // Décrémente le stock (plancher à 0)
            $stockApres = max(0, $produit->stock_physique - $qte);
            $produit->update(['stock_physique' => $stockApres]);

            $dateVente = $d['date_vente'] ?? now()->format('Y-m-d');

            MouvementStock::create([
                'produit_id'  => $produit->id,
                'user_id'     => null,
                'type'        => 'sortie',
                'quantite'    => $qte,
                'stock_apres' => $stockApres,
                'motif'       => "Vente Librisoft du {$dateVente}",
                'source'      => 'vente_librisoft',
            ]);

            $nb++;
        }

        Log::info("Webhook Librisoft : {$nb} vente(s) traitée(s), stocks décrémentés.");
    }
}
