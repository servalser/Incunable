<?php

namespace App\Console\Commands;

use App\Models\Configuration;
use App\Models\Produit;
use App\Models\Lettre;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Commande : benchmark:synchroniser
 *
 * Ce que fait cette commande :
 *   1. Collecte des statistiques anonymisées sur le catalogue local
 *      (genres, EANs, niveaux de stock — AUCUNE donnée personnelle ni financière exacte)
 *   2. Les envoie au hub central Incunable via HTTP POST
 *   3. Reçoit en retour l'agrégat de toutes les librairies participantes
 *   4. Stocke cet agrégat en base (configuration.benchmark_donnees)
 *
 * Le hub agrège les données de toutes les instances opt-in et retourne
 * des statistiques réseau (moyennes, fréquences) utiles pour le Conseiller IA.
 *
 * Utilisation :
 *   php artisan benchmark:synchroniser
 *   php artisan benchmark:synchroniser --dry-run    # affiche les stats sans envoyer
 */
class SynchroniserBenchmark extends Command
{
    protected $signature = 'benchmark:synchroniser {--dry-run : Afficher les stats sans envoyer}';
    protected $description = 'Synchronise les statistiques anonymisées avec le réseau Incunable';

    /** URL du hub central Incunable (hébergé par l'éditeur du logiciel). */
    const HUB_URL = 'https://benchmark.incunable.fr/api/sync';

    public function handle(): int
    {
        $config = Configuration::get();

        if (! $config->benchmark_actif) {
            $this->info('Benchmark désactivé — activez-le dans Configuration > Intégrations.');
            return self::SUCCESS;
        }

        // ── Génère un token anonyme si l'instance n'en a pas encore ──────────
        // Ce token identifie cette instance de façon persistante et anonyme.
        // Il ne contient pas le nom de la librairie ni aucune donnée personnelle.
        if (! $config->benchmark_token) {
            $config->update(['benchmark_token' => (string) Str::uuid()]);
            $this->info('Token anonyme généré : ' . $config->benchmark_token);
        }

        // ── Collecte des statistiques locales (anonymisées) ───────────────────
        $stats = $this->collecterStats($config);

        if ($this->option('dry-run')) {
            $this->info('=== Statistiques qui seraient envoyées ===');
            $this->line(json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return self::SUCCESS;
        }

        // ── Envoi au hub et réception de l'agrégat réseau ─────────────────────
        $this->info('Envoi au hub réseau Incunable…');

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-Benchmark-Token' => $config->benchmark_token,
                    'Accept'            => 'application/json',
                ])
                ->post(self::HUB_URL, $stats);

            if ($response->successful()) {
                $donnees = $response->json();

                $config->update([
                    'benchmark_donnees'      => $donnees,
                    'benchmark_derniere_sync' => now(),
                ]);

                $participants = $donnees['meta']['participants'] ?? '?';
                $this->info("Benchmark synchronisé — {$participants} librairie(s) dans le réseau.");
                Log::info('benchmark:synchroniser — succès', ['participants' => $participants]);
            } else {
                $this->warn('Le hub a retourné une erreur : ' . $response->status());
                Log::warning('benchmark:synchroniser — erreur hub', ['status' => $response->status()]);
            }
        } catch (\Exception $e) {
            // Le hub n'est pas joignable (normal si non déployé) — on stocke
            // une estimation locale à la place pour que l'IA ait quand même du contexte.
            $this->warn('Hub non joignable (' . $e->getMessage() . ') — estimation locale utilisée.');
            $this->stockerEstimationLocale($config, $stats);
        }

        return self::SUCCESS;
    }

    /**
     * Collecte des métriques anonymisées depuis la base locale.
     *
     * Aucune donnée personnelle :
     *   - Pas de nom de librairie, pas d'adresse, pas de SIRET
     *   - Les montants financiers sont arrondis à la centaine (pas le chiffre exact)
     *   - Les EAN sont des codes normalisés publics (ISBN-13)
     */
    private function collecterStats(Configuration $config): array
    {
        $produits = Produit::actif()->get();
        $total    = $produits->count();

        if ($total === 0) {
            return [
                'version'    => '1',
                'token'      => $config->benchmark_token,
                'catalogue'  => ['nb_produits' => 0],
                'stock'      => [],
                'financier'  => [],
            ];
        }

        // ── Distribution par genre ────────────────────────────────────────────
        $parGenre = $produits
            ->whereNotNull('genre')
            ->groupBy('genre')
            ->map(fn($groupe) => [
                // Pourcentage arrondi à l'entier (pas de données exactes)
                'part_pourcent' => round($groupe->count() / $total * 100),
                // Stock moyen arrondi à 1 décimale
                'stock_moyen'   => round($groupe->avg('stock_physique'), 1),
            ])
            ->sortByDesc(fn($v) => $v['part_pourcent'])
            ->toArray();

        // ── Top EAN populaires (livres uniquement, EAN non nul) ───────────────
        // On partage les EAN (codes publics normalisés), pas les titres.
        // Le hub sait le titre depuis son propre catalogue.
        $topEans = $produits
            ->whereNotNull('ean')
            ->where('type', 'livre')
            ->sortByDesc('stock_physique')
            ->take(50)
            ->pluck('ean')
            ->values()
            ->toArray();

        // ── Métriques de stock ────────────────────────────────────────────────
        $seuil         = (int) ($config->seuil_alerte_stock_global ?? 2);
        $enRupture     = $produits->where('stock_physique', '<=', 0)->count();
        $enAlerte      = $produits->where('stock_physique', '>', 0)
                                  ->where('stock_physique', '<=', $seuil)->count();
        $stockMoyen    = round($produits->avg('stock_physique'), 2);
        $tauxRupture   = $total > 0 ? round($enRupture / $total * 100, 1) : 0;

        // ── Métriques financières (arrondies à la centaine) ───────────────────
        $lcrMoyenne = Lettre::actif()
            ->whereIn('statut', ['en_attente', 'en_retard'])
            ->avg('montant_ttc');
        // On arrondit à la centaine la plus proche pour ne pas exposer le montant exact
        $lcrMoyenneArrondie = $lcrMoyenne ? (int) (round($lcrMoyenne / 100) * 100) : 0;

        return [
            'version'   => '1',
            'token'     => $config->benchmark_token,
            'catalogue' => [
                'nb_produits'      => $total,
                'nb_distributeurs' => \App\Models\Distributeur::where('actif', true)->count(),
                'genres'           => $parGenre,
                'top_eans'         => $topEans,
            ],
            'stock' => [
                'stock_moyen'    => $stockMoyen,
                'taux_rupture'   => $tauxRupture,
                'nb_en_rupture'  => $enRupture,
                'nb_en_alerte'   => $enAlerte,
            ],
            'financier' => [
                // Arrondi à la centaine — on ne partage pas le montant exact
                'lcr_moyenne_arrondie' => $lcrMoyenneArrondie,
            ],
        ];
    }

    /**
     * Si le hub n'est pas joignable, on stocke une estimation basée sur les
     * données locales uniquement, avec un indicateur "source: local".
     * Cela permet au Conseiller IA d'avoir quand même du contexte structuré.
     */
    private function stockerEstimationLocale(Configuration $config, array $stats): void
    {
        $donnees = [
            'meta' => [
                'participants'  => 1,
                'mis_a_jour'    => now()->toDateString(),
                'source'        => 'local',
                'note'          => 'Données locales uniquement — rejoignez le réseau pour comparer avec d\'autres librairies.',
            ],
            'stock' => [
                'stock_moyen_reseau'  => $stats['stock']['stock_moyen'] ?? 0,
                'taux_rupture_moyen'  => $stats['stock']['taux_rupture'] ?? 0,
                'genres'              => $stats['catalogue']['genres'] ?? [],
                'eans_populaires'     => [],
            ],
            'financier' => [
                'lcr_montant_moyen' => $stats['financier']['lcr_moyenne_arrondie'] ?? 0,
            ],
        ];

        $config->update([
            'benchmark_donnees'      => $donnees,
            'benchmark_derniere_sync' => now(),
        ]);

        $this->info('Estimation locale stockée — le Conseiller IA peut utiliser vos propres données comme référence.');
    }
}
