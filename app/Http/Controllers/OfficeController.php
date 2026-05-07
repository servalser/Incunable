<?php

namespace App\Http\Controllers;

use App\Models\Distributeur;
use App\Models\Office;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    // ── Liste ─────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'statut', 'type', 'distributeur_id']);

        $offices = Office::with('distributeur')
            ->actif()
            ->when($filters['q'] ?? null, fn($query, $q) =>
                $query->where(function ($sub) use ($q) {
                    $sub->where('reference', 'like', "%$q%")
                        ->orWhereHas('distributeur', fn($d) => $d->where('nom', 'like', "%$q%"));
                })
            )
            ->when($filters['statut'] ?? null, fn($q, $s) => $q->where('statut', $s))
            ->when($filters['type'] ?? null, fn($q, $t) => $q->where('type', $t))
            ->when($filters['distributeur_id'] ?? null, fn($q, $id) => $q->where('distributeur_id', $id))
            ->orderBy('date_retour_limite')
            ->paginate(30)
            ->withQueryString();

        $distributeurs = Distributeur::actif()->orderBy('nom')->get(['id', 'nom']);

        return Inertia::render('Offices/Index', [
            'offices'       => $offices,
            'distributeurs' => $distributeurs,
            'filters'       => $filters,
        ]);
    }

    // ── Formulaire de création ────────────────────────────────────────────────

    public function create(): Response
    {
        return Inertia::render('Offices/Form', [
            'office'        => null,
            'distributeurs' => Distributeur::actif()->orderBy('nom')->get(['id', 'nom']),
        ]);
    }

    // ── Enregistrement création ───────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'distributeur_id'   => ['required', 'exists:distributeurs,id'],
            'type'              => ['required', 'in:facon,grille,exceptionnel'],
            'montant_ttc'       => ['required', 'numeric', 'min:0.01'],
            'date_reception'    => ['required', 'date'],
            'notes'             => ['nullable', 'string', 'max:2000'],
        ]);

        $office = Office::create([
            ...$data,
            'reference'       => Office::genererReference(),
            'statut'          => 'en_attente',
            'montant_retourne' => 0,
            'cree_par'        => auth()->id(),
        ]);

        $office->calculerEtSauvegarderRetourLimite();

        return redirect()->route('offices.show', $office)
            ->with('success', "Office {$office->reference} créé.");
    }

    // ── Détail ────────────────────────────────────────────────────────────────

    public function show(Office $office): Response
    {
        $office->load('distributeur', 'lignes', 'createurUser');

        return Inertia::render('Offices/Detail', [
            'office' => [
                'id'                  => $office->id,
                'reference'           => $office->reference,
                'statut'              => $office->statut,
                'type'                => $office->type,
                'montant_ttc'         => $office->montant_ttc,
                'montant_retourne'    => $office->montant_retourne,
                'montant_net'         => $office->montant_net,
                'date_reception'      => $office->date_reception?->format('Y-m-d'),
                'date_retour_limite'  => $office->date_retour_limite?->format('Y-m-d'),
                'jours_retour_restants' => $office->jours_retour_restants,
                'notes'               => $office->notes,
                'distributeur'        => $office->distributeur,
                'lignes'              => $office->lignes,
                'cree_par'            => $office->createurUser?->nom,
                'cree_le'             => $office->cree_le?->format('d/m/Y H:i'),
            ],
        ]);
    }

    // ── Formulaire de modification ────────────────────────────────────────────

    public function edit(Office $office): Response
    {
        return Inertia::render('Offices/Form', [
            'office'        => $office->load('distributeur'),
            'distributeurs' => Distributeur::actif()->orderBy('nom')->get(['id', 'nom']),
        ]);
    }

    // ── Enregistrement modification ───────────────────────────────────────────

    public function update(Request $request, Office $office)
    {
        $data = $request->validate([
            'distributeur_id'  => ['required', 'exists:distributeurs,id'],
            'type'             => ['required', 'in:facon,grille,exceptionnel'],
            'montant_ttc'      => ['required', 'numeric', 'min:0.01'],
            'date_reception'   => ['required', 'date'],
            'notes'            => ['nullable', 'string', 'max:2000'],
        ]);

        $office->update($data);
        $office->calculerEtSauvegarderRetourLimite();

        return redirect()->route('offices.show', $office)
            ->with('success', "Office {$office->reference} mis à jour.");
    }

    // ── Action : enregistrer un retour ────────────────────────────────────────

    public function retour(Request $request, Office $office)
    {
        $data = $request->validate([
            'montant_retourne' => ['required', 'numeric', 'min:0.01', 'max:' . $office->montant_ttc],
        ]);

        $total = $office->montant_retourne + $data['montant_retourne'];

        $office->update([
            'montant_retourne' => $total,
            // Si le retour couvre tout le montant → statut "retourne"
            // Sinon → "retour_partiel"
            'statut' => $total >= $office->montant_ttc ? 'retourne' : 'retour_partiel',
        ]);

        return redirect()->route('offices.show', $office)
            ->with('success', "Retour de " . number_format($data['montant_retourne'], 2, ',', ' ') . " € enregistré.");
    }

    // ── Action : marquer payé ─────────────────────────────────────────────────

    public function payer(Office $office)
    {
        abort_unless(in_array($office->statut, ['en_attente', 'en_retard', 'retour_partiel']), 403);

        $office->update([
            'statut'  => 'paye',
            'paye_le' => now(),
        ]);

        return redirect()->route('offices.show', $office)
            ->with('success', "Office {$office->reference} marqué payé.");
    }

    // ── Soft delete ───────────────────────────────────────────────────────────

    public function destroy(Office $office)
    {
        $office->update(['supprime_le' => now()]);

        return redirect()->route('offices.index')
            ->with('success', "Office {$office->reference} déplacé en corbeille.");
    }

    // ── Restaurer depuis corbeille ────────────────────────────────────────────

    public function restore(int $id)
    {
        $office = Office::withoutGlobalScope('actif')->findOrFail($id);
        $office->update(['supprime_le' => null]);

        return redirect()->route('offices.index')
            ->with('success', "Office restauré.");
    }
}
