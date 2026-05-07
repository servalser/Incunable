<?php

namespace App\Http\Controllers;

use App\Models\Distributeur;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DistributeurController extends Controller
{
    public function index(): Response
    {
        // On charge aussi le comptage des LCR actives et offices actifs pour les cartes
        $distributeurs = Distributeur::actif()
            ->withCount([
                'lettres as nb_lettres_actives' => fn($q) => $q->actif()->whereIn('statut', ['en_attente', 'en_retard']),
                'offices as nb_offices_actifs'  => fn($q) => $q->actif()->whereNotIn('statut', ['paye', 'retourne']),
            ])
            ->orderBy('nom')
            ->get();

        return Inertia::render('Distributeurs/Index', [
            'distributeurs' => $distributeurs,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom'                    => ['required', 'string', 'max:100', 'unique:distributeurs,nom'],
            'email'                  => ['nullable', 'email', 'max:150'],
            'telephone'              => ['nullable', 'string', 'max:30'],
            'delai_commandes_mois'   => ['nullable', 'integer', 'min:1', 'max:24'],
            'delai_offices_mois'     => ['nullable', 'integer', 'min:1', 'max:24'],
            'iban'                   => ['nullable', 'string', 'max:34'],
        ]);

        Distributeur::create($data);

        return redirect()->route('distributeurs.index')
            ->with('success', "Distributeur {$data['nom']} créé.");
    }

    public function update(Request $request, Distributeur $distributeur)
    {
        $data = $request->validate([
            'nom'                    => ['required', 'string', 'max:100', 'unique:distributeurs,nom,' . $distributeur->id],
            'email'                  => ['nullable', 'email', 'max:150'],
            'telephone'              => ['nullable', 'string', 'max:30'],
            'delai_commandes_mois'   => ['nullable', 'integer', 'min:1', 'max:24'],
            'delai_offices_mois'     => ['nullable', 'integer', 'min:1', 'max:24'],
            'iban'                   => ['nullable', 'string', 'max:34'],
        ]);

        $distributeur->update($data);

        return redirect()->route('distributeurs.index')
            ->with('success', "Distributeur {$distributeur->nom} mis à jour.");
    }

    public function destroy(Distributeur $distributeur)
    {
        // Vérifie qu'il n'a plus de LCR/Offices actifs avant de désactiver
        $hasActifs = $distributeur->lettres()->actif()->exists()
                  || $distributeur->offices()->actif()->exists();

        if ($hasActifs) {
            return back()->with('error', "Ce distributeur a encore des éléments actifs. Soldez-les d'abord.");
        }

        $distributeur->update(['actif' => false]);

        return redirect()->route('distributeurs.index')
            ->with('success', "Distributeur {$distributeur->nom} désactivé.");
    }
}
