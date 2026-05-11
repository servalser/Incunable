<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Configuration;
use App\Models\Lettre;
use App\Models\Office;
use App\Models\Produit;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $config = Configuration::get();
        $today  = now()->toDateString();
        $in30   = now()->addDays(30)->toDateString();
        $in7    = now()->addDays(7)->toDateString();

        // ── KPIs ──────────────────────────────────────────────
        $duCeMois = Lettre::actif()
            ->whereIn('statut', ['en_attente', 'en_retard'])
            ->whereMonth('date_echeance', now()->month)
            ->whereYear('date_echeance', now()->year)
            ->sum('montant_ttc');

        $du30j = Lettre::actif()
            ->whereIn('statut', ['en_attente', 'en_retard'])
            ->where('date_echeance', '<=', $in30)
            ->sum('montant_ttc');

        $enRetard = Lettre::actif()
            ->where('statut', 'en_retard')
            ->sum('montant_ttc');

        $officesAlerte = Office::actif()
            ->whereNotIn('statut', ['paye', 'retourne'])
            ->where('date_retour_limite', '<=', $in30)
            ->count();

        // ── Prochaines échéances (7 jours) ────────────────────
        $prochaines = Lettre::with('distributeur')
            ->actif()
            ->where('statut', 'en_attente')
            ->where('date_echeance', '<=', $in7)
            ->orderBy('date_echeance')
            ->limit(5)
            ->get()
            ->map(fn($l) => [
                'id'              => $l->id,
                'reference'       => $l->reference,
                'distributeur'    => $l->distributeur->nom,
                'montant_ttc'     => $l->montant_ttc,
                'date_echeance'   => $l->date_echeance->format('Y-m-d'),
                'jours_restants'  => $l->jours_restants,
            ]);

        // ── Alertes ───────────────────────────────────────────
        $alertesRetard = Lettre::with('distributeur')
            ->actif()
            ->where('statut', 'en_retard')
            ->orderBy('date_echeance')
            ->get()
            ->map(fn($l) => [
                'id' => $l->id, 'reference' => $l->reference,
                'distributeur' => $l->distributeur->nom,
                'montant_ttc' => $l->montant_ttc,
                'date_echeance' => $l->date_echeance->format('Y-m-d'),
            ]);

        $alertesProches = Lettre::with('distributeur')
            ->actif()
            ->where('statut', 'en_attente')
            ->where('date_echeance', '<=', $in7)
            ->where('date_echeance', '>=', $today)
            ->orderBy('date_echeance')
            ->get()
            ->map(fn($l) => [
                'id' => $l->id, 'reference' => $l->reference,
                'distributeur' => $l->distributeur->nom,
                'montant_ttc' => $l->montant_ttc,
                'date_echeance' => $l->date_echeance->format('Y-m-d'),
                'jours_restants' => $l->jours_restants,
            ]);

        $alertesOffices = Office::with('distributeur')
            ->actif()
            ->whereNotIn('statut', ['paye', 'retourne'])
            ->where('date_retour_limite', '<=', $in30)
            ->orderBy('date_retour_limite')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id, 'reference' => $o->reference,
                'distributeur' => $o->distributeur->nom,
                'date_retour_limite' => $o->date_retour_limite->format('Y-m-d'),
                'jours_restants' => $o->jours_retour_restants,
            ]);

        // ── KPIs Stock ────────────────────────────────────────────────────────
        // Ces KPIs ne s'affichent que si des produits existent en base.
        $stockKpis        = null;
        $produitsDormants = collect();
        $top5Produits     = collect();

        if (Produit::actif()->exists()) {
            // Récupère le seuil global depuis la config (défaut : 2 si non défini)
            $seuilGlobal    = $config->seuil_alerte_stock_global ?? 2;
            // Nb de semaines pour considérer un produit comme "nouveau"
            $delaiNouveautes = $config->delai_nouveautes_semaines ?? 8;

            // Nb produits en alerte stock (stock <= seuil, mais pas en rupture totale)
            $nbAlerte = Produit::actif()
                ->whereRaw('stock_physique <= COALESCE(seuil_alerte, (SELECT seuil_alerte_stock_global FROM configuration WHERE id = 1))')
                ->where('stock_physique', '>', 0)
                ->count();

            // Nb ruptures (stock à 0 ou négatif)
            $nbRupture = Produit::actif()
                ->where('stock_physique', '<=', 0)
                ->count();

            // Nb nouveautés (date_parution dans les N dernières semaines)
            $nbNouveautes = Produit::actif()
                ->whereNotNull('date_parution')
                ->whereRaw('date_parution >= DATE_SUB(NOW(), INTERVAL ? WEEK)', [$delaiNouveautes])
                ->count();

            // Valeur totale du stock (somme : stock_physique × prix_ttc)
            $valeurStock = Produit::actif()
                ->whereNotNull('prix_ttc')
                ->where('prix_ttc', '>', 0)
                ->selectRaw('SUM(stock_physique * prix_ttc) as valeur')
                ->value('valeur') ?? 0;

            $stockKpis = [
                'nb_alerte'     => $nbAlerte,
                'nb_rupture'    => $nbRupture,
                'nb_nouveautes' => $nbNouveautes,
                'valeur_stock'  => round((float) $valeurStock, 2),
                'nb_total'      => Produit::actif()->count(),
            ];

            // Top 5 produits par valeur en stock (prix × quantité), décroissant
            $top5Produits = Produit::actif()
                ->whereNotNull('prix_ttc')
                ->where('stock_physique', '>', 0)
                ->selectRaw('*, (stock_physique * prix_ttc) as valeur_totale')
                ->orderByRaw('stock_physique * prix_ttc DESC')
                ->limit(5)
                ->get()
                ->map(fn($p) => [
                    'id'            => $p->id,
                    'titre'         => $p->titre,
                    'auteur'        => $p->auteur,
                    'type'          => $p->type,
                    'stock'         => $p->stock_physique,
                    'prix_ttc'      => $p->prix_ttc,
                    'valeur_totale' => round((float) $p->valeur_totale, 2),
                    'en_alerte'     => $p->en_alerte,
                ]);

            // Produits dormants : en stock, sans mouvement depuis 8 semaines
            $produitsDormants = Produit::actif()
                ->where('stock_physique', '>', 0)
                ->whereDoesntHave('mouvements', function ($q) {
                    $q->where('created_at', '>=', now()->subWeeks(8));
                })
                ->orderBy('date_parution')
                ->limit(5)
                ->get()
                ->map(fn($p) => [
                    'id'            => $p->id,
                    'titre'         => $p->titre,
                    'auteur'        => $p->auteur,
                    'stock'         => $p->stock_physique,
                    'prix_ttc'      => $p->prix_ttc,
                    'date_parution' => $p->date_parution?->format('Y-m-d'),
                ]);
        }

        // ── Budget du mois en cours ──────────────────────────────
        $budgetMois = $this->getBudgetMois();

        // ── Données graphiques (12 mois) ──────────────────────
        $lookback = max($config->delai_commandes_mois, $config->delai_offices_mois);
        $chartData = $this->getChargeParMois(12, $lookback);

        // ── Répartition par distributeur ──────────────────────
        $distribStats = DB::table('distributeurs as d')
            ->leftJoin('lettres_de_change as l', function($j) {
                $j->on('l.distributeur_id', 'd.id')
                  ->where('l.statut', '!=', 'paye')
                  ->whereNull('l.supprime_le');
            })
            ->select('d.nom', DB::raw('COALESCE(SUM(l.montant_ttc),0) as total'))
            ->groupBy('d.id', 'd.nom')
            ->orderByDesc('total')
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'du_ce_mois'     => round($duCeMois, 2),
                'du_30j'         => round($du30j, 2),
                'en_retard'      => round($enRetard, 2),
                'offices_alerte' => $officesAlerte,
            ],
            'budget_mois'    => $budgetMois,
            'prochaines'     => $prochaines,
            'alertes_retard' => $alertesRetard,
            'alertes_proches'=> $alertesProches,
            'alertes_offices'=> $alertesOffices,
            'chart_data'        => $chartData,
            'distrib_stats'     => $distribStats,
            'lookback'          => $lookback,
            'config'            => $config,
            'stock_kpis'        => $stockKpis,
            'top5_produits'     => $top5Produits,
            'produits_dormants' => $produitsDormants,
        ]);
    }

    /**
     * Calcule le résumé budgétaire du mois en cours.
     * Retourne null si aucun budget n'est défini ce mois.
     */
    private function getBudgetMois(): ?array
    {
        $lignes = Budget::periode(now()->year, now()->month)->get();

        if ($lignes->isEmpty()) {
            return null;
        }

        $totalPrevu = $lignes->sum('montant_prevu');
        $totalReel  = $lignes->sum('montant_reel');  // null = non renseigné
        $restant    = $totalPrevu - $totalReel;

        // Progression du mois (quel % du mois est passé ?)
        $joursMois    = now()->daysInMonth;
        $joursEcoules = now()->day;
        $progressionMois = round($joursEcoules / $joursMois * 100);

        // Progression budget consommé
        $progressionBudget = $totalPrevu > 0
            ? round($totalReel / $totalPrevu * 100, 1)
            : 0;

        // Détail par catégorie
        $categories = $lignes->map(fn($b) => [
            'categorie'    => $b->categorie,
            'prevu'        => $b->montant_prevu,
            'reel'         => $b->montant_reel,
            'restant'      => $b->montant_prevu - ($b->montant_reel ?? 0),
            'pourcent'     => $b->montant_prevu > 0
                ? round(($b->montant_reel ?? 0) / $b->montant_prevu * 100, 1)
                : 0,
        ])->toArray();

        return [
            'total_prevu'        => round($totalPrevu, 2),
            'total_reel'         => round($totalReel, 2),
            'restant'            => round($restant, 2),
            'progression_mois'   => $progressionMois,
            'progression_budget' => $progressionBudget,
            'categories'         => $categories,
            'mois_label'         => now()->locale('fr')->isoFormat('MMMM YYYY'),
        ];
    }

    private function getChargeParMois(int $nbMois, int $lookback): array
    {
        $result = [];
        // Affiche les 12 derniers mois (passé → mois courant)
        for ($i = -($nbMois - 1); $i <= 0; $i++) {
            $date  = now()->addMonths($i);
            $annee = $date->year;
            $mois  = $date->month;

            $lc = Lettre::actif()
                ->whereYear('date_emission', $annee)
                ->whereMonth('date_emission', $mois)
                ->sum('montant_ttc');

            $of = Office::actif()
                ->whereYear('date_reception', $annee)
                ->whereMonth('date_reception', $mois)
                ->sum('montant_ttc');

            $result[] = [
                'label'   => $date->locale('fr')->isoFormat('MMM YY'),
                'lettres' => round((float) $lc, 2),
                'offices' => round((float) $of, 2),
            ];
        }
        return $result;
    }
}
