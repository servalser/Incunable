<?php

namespace App\Http\Controllers;

use App\Models\Lettre;
use App\Models\Office;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RapportController extends Controller
{
    public function index(Request $request): Response
    {
        $annee = $request->integer('annee', now()->year);
        $mois  = $request->integer('mois',  now()->month);

        // ── LCR émises ce mois ─────────────────────────────────────────────────
        $lcrEmises = Lettre::actif()
            ->whereYear('date_emission', $annee)
            ->whereMonth('date_emission', $mois)
            ->with('distributeur:id,nom')
            ->orderBy('date_emission')
            ->get()
            ->map(fn($l) => [
                'id'            => $l->id,
                'reference'     => $l->reference,
                'distributeur'  => $l->distributeur?->nom,
                'montant_ttc'   => (float) $l->montant_ttc,
                'date_emission' => $l->date_emission?->format('Y-m-d'),
                'date_echeance' => $l->date_echeance?->format('Y-m-d'),
                'statut'        => $l->statut,
            ]);

        // ── LCR dues (échéance) ce mois ────────────────────────────────────────
        $lcrDues = Lettre::actif()
            ->whereYear('date_echeance', $annee)
            ->whereMonth('date_echeance', $mois)
            ->with('distributeur:id,nom')
            ->orderBy('date_echeance')
            ->get()
            ->map(fn($l) => [
                'id'            => $l->id,
                'reference'     => $l->reference,
                'distributeur'  => $l->distributeur?->nom,
                'montant_ttc'   => (float) $l->montant_ttc,
                'date_echeance' => $l->date_echeance?->format('Y-m-d'),
                'statut'        => $l->statut,
            ]);

        // ── Offices reçus ce mois ──────────────────────────────────────────────
        $officesRecus = Office::actif()
            ->whereYear('date_reception', $annee)
            ->whereMonth('date_reception', $mois)
            ->with('distributeur:id,nom')
            ->orderBy('date_reception')
            ->get()
            ->map(fn($o) => [
                'id'                 => $o->id,
                'reference'          => $o->reference,
                'distributeur'       => $o->distributeur?->nom,
                'montant_ttc'        => (float) $o->montant_ttc,
                'montant_retourne'   => (float) $o->montant_retourne,
                'date_reception'     => $o->date_reception?->format('Y-m-d'),
                'date_retour_limite' => $o->date_retour_limite?->format('Y-m-d'),
                'statut'             => $o->statut,
                'type'               => $o->type,
            ]);

        // ── KPIs synthèse ──────────────────────────────────────────────────────
        $kpis = [
            'lcr_emises_count'   => $lcrEmises->count(),
            'lcr_emises_total'   => round($lcrEmises->sum('montant_ttc'), 2),
            'lcr_dues_total'     => round($lcrDues->sum('montant_ttc'), 2),
            'lcr_en_retard'      => round(
                $lcrDues->where('statut', 'en_retard')->sum('montant_ttc'), 2
            ),
            'offices_count'      => $officesRecus->count(),
            'offices_total'      => round($officesRecus->sum('montant_ttc'), 2),
            'offices_net'        => round(
                $officesRecus->sum('montant_ttc') - $officesRecus->sum('montant_retourne'), 2
            ),
        ];

        // ── Répartition par distributeur (LCR émises) ─────────────────────────
        $parDistrib = DB::table('lettres_de_change as l')
            ->join('distributeurs as d', 'd.id', '=', 'l.distributeur_id')
            ->whereNull('l.supprime_le')
            ->whereYear('l.date_emission', $annee)
            ->whereMonth('l.date_emission', $mois)
            ->select('d.nom', DB::raw('SUM(l.montant_ttc) as total'), DB::raw('COUNT(*) as nb'))
            ->groupBy('d.id', 'd.nom')
            ->orderByDesc('total')
            ->get();

        // ── Tendance 12 mois ───────────────────────────────────────────────────
        $chartData = $this->getTendance12Mois();

        return Inertia::render('Rapports/Index', [
            'annee'          => $annee,
            'mois'           => $mois,
            'kpis'           => $kpis,
            'lcr_emises'     => $lcrEmises,
            'lcr_dues'       => $lcrDues,
            'offices_recus'  => $officesRecus,
            'par_distributeur' => $parDistrib,
            'chart_data'     => $chartData,
        ]);
    }

    private function getTendance12Mois(): array
    {
        $result = [];
        for ($i = -11; $i <= 0; $i++) {
            $date  = now()->addMonths($i);
            $annee = $date->year;
            $mois  = $date->month;

            $lcr = Lettre::actif()
                ->whereYear('date_emission', $annee)
                ->whereMonth('date_emission', $mois)
                ->sum('montant_ttc');

            $off = Office::actif()
                ->whereYear('date_reception', $annee)
                ->whereMonth('date_reception', $mois)
                ->sum('montant_ttc');

            $result[] = [
                'label'   => $date->locale('fr')->isoFormat('MMM YY'),
                'lettres' => round((float) $lcr, 2),
                'offices' => round((float) $off, 2),
            ];
        }
        return $result;
    }
}
