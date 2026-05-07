<?php

namespace App\Http\Controllers;

use App\Models\FicheMission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FicheMissionController extends Controller
{
    public function index(Request $request): Response
    {
        $fiches = FicheMission::with('createur:id,nom')
            ->recherche($request->q)
            ->statut($request->statut)
            ->priorite($request->priorite)
            ->orderByRaw("FIELD(priorite, 'haute', 'normale', 'faible')")
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($f) => [
                'id'        => $f->id,
                'titre'     => $f->titre,
                'auteur'    => $f->auteur,
                'isbn'      => $f->isbn,
                'editeur'   => $f->editeur,
                'prix_ttc'  => (float) $f->prix_ttc,
                'categorie' => $f->categorie,
                'priorite'  => $f->priorite,
                'statut'    => $f->statut,
                'notes'     => $f->notes,
                'cree_par'  => $f->createur?->nom,
                'created_at'=> $f->created_at?->format('Y-m-d'),
            ]);

        return Inertia::render('FichesMissions/Index', [
            'fiches'   => $fiches,
            'filtres'  => $request->only('q', 'statut', 'priorite'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'titre'     => ['required', 'string', 'max:255'],
            'auteur'    => ['nullable', 'string', 'max:255'],
            'isbn'      => ['nullable', 'string', 'max:13'],
            'editeur'   => ['nullable', 'string', 'max:255'],
            'prix_ttc'  => ['nullable', 'numeric', 'min:0'],
            'categorie' => ['nullable', 'string', 'max:100'],
            'priorite'  => ['required', 'in:faible,normale,haute'],
            'statut'    => ['required', 'in:a_evaluer,lu,recommande,refuse'],
            'notes'     => ['nullable', 'string'],
        ]);

        $data['cree_par'] = Auth::id();
        FicheMission::create($data);

        return redirect()->route('fiches_missions.index')
            ->with('success', "Fiche « {$data['titre']} » créée.");
    }

    public function update(Request $request, FicheMission $ficheMission)
    {
        $data = $request->validate([
            'titre'     => ['required', 'string', 'max:255'],
            'auteur'    => ['nullable', 'string', 'max:255'],
            'isbn'      => ['nullable', 'string', 'max:13'],
            'editeur'   => ['nullable', 'string', 'max:255'],
            'prix_ttc'  => ['nullable', 'numeric', 'min:0'],
            'categorie' => ['nullable', 'string', 'max:100'],
            'priorite'  => ['required', 'in:faible,normale,haute'],
            'statut'    => ['required', 'in:a_evaluer,lu,recommande,refuse'],
            'notes'     => ['nullable', 'string'],
        ]);

        $ficheMission->update($data);

        return redirect()->route('fiches_missions.index')
            ->with('success', "Fiche « {$ficheMission->titre} » mise à jour.");
    }

    public function destroy(FicheMission $ficheMission)
    {
        $titre = $ficheMission->titre;
        $ficheMission->delete();

        return redirect()->route('fiches_missions.index')
            ->with('success', "Fiche « {$titre} » supprimée.");
    }
}
