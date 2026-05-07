<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use App\Models\Distributeur;
use App\Models\Lettre;
use App\Models\Office;
use Illuminate\Http\Request;

/**
 * DocumentController génère des pages HTML standalone (sans layout React)
 * destinées à l'impression navigateur.
 * Ces routes renvoient des vues Blade classiques, pas des pages Inertia.
 */
class DocumentController extends Controller
{
    private function config(): Configuration
    {
        return Configuration::get();
    }

    /** Lettre de charge — liste des offices d'un distributeur sur une période */
    public function lettreCharge(Office $office)
    {
        $office->load('distributeur', 'lignes');

        return view('documents.lettre_charge', [
            'config' => $this->config(),
            'office' => $office,
        ]);
    }

    /** Bon de retour — liste des lignes à retourner pour un office */
    public function bonRetour(Office $office)
    {
        $office->load('distributeur', 'lignes');

        return view('documents.bon_retour', [
            'config' => $this->config(),
            'office' => $office,
        ]);
    }

    /** Relevé distributeur — toutes les LCR actives pour un distributeur */
    public function releve(Distributeur $distributeur)
    {
        $lettres = Lettre::actif()
            ->where('distributeur_id', $distributeur->id)
            ->whereIn('statut', ['en_attente', 'en_retard'])
            ->orderBy('date_echeance')
            ->get();

        return view('documents.releve_distributeur', [
            'config'       => $this->config(),
            'distributeur' => $distributeur,
            'lettres'      => $lettres,
            'total'        => $lettres->sum('montant_ttc'),
        ]);
    }

    /** Récapitulatif mensuel — toutes les échéances du mois courant */
    public function recapMensuel(Request $request)
    {
        $mois  = $request->input('mois', now()->format('Y-m'));
        [$year, $month] = explode('-', $mois);

        $lettres = Lettre::actif()
            ->with('distributeur')
            ->whereIn('statut', ['en_attente', 'en_retard'])
            ->whereYear('date_echeance', $year)
            ->whereMonth('date_echeance', $month)
            ->orderBy('date_echeance')
            ->get();

        $offices = Office::actif()
            ->with('distributeur')
            ->whereNotIn('statut', ['paye', 'retourne'])
            ->whereYear('date_retour_limite', $year)
            ->whereMonth('date_retour_limite', $month)
            ->orderBy('date_retour_limite')
            ->get();

        return view('documents.recap_mensuel', [
            'config'  => $this->config(),
            'lettres' => $lettres,
            'offices' => $offices,
            'mois'    => $mois,
            'total_lettres' => $lettres->sum('montant_ttc'),
            'total_offices' => $offices->sum(fn($o) => $o->montant_net),
        ]);
    }
}
