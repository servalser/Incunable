<?php

namespace App\Http\Controllers;

use App\Models\Distributeur;
use App\Models\Lettre;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LettreController extends Controller
{
    // ── Liste ─────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        // Filtres transmis via query string (?statut=en_retard&q=hachette...)
        $filters = $request->only(['q', 'statut', 'distributeur_id', 'mois']);

        $lettres = Lettre::with('distributeur')
            ->actif()
            ->when($filters['q'] ?? null, fn($query, $q) =>
                $query->where(function ($sub) use ($q) {
                    $sub->where('reference', 'like', "%$q%")
                        ->orWhereHas('distributeur', fn($d) => $d->where('nom', 'like', "%$q%"));
                })
            )
            ->when($filters['statut'] ?? null, fn($q, $s) => $q->where('statut', $s))
            ->when($filters['distributeur_id'] ?? null, fn($q, $id) => $q->where('distributeur_id', $id))
            ->when($filters['mois'] ?? null, function ($q, $mois) {
                // Format attendu : "2024-03"
                [$year, $month] = explode('-', $mois);
                $q->whereYear('date_echeance', $year)->whereMonth('date_echeance', $month);
            })
            ->orderBy('date_echeance')
            ->paginate(30)
            ->withQueryString(); // garde les filtres dans les liens de pagination

        $distributeurs = Distributeur::actif()->orderBy('nom')->get(['id', 'nom']);

        return Inertia::render('Lettres/Index', [
            'lettres'       => $lettres,
            'distributeurs' => $distributeurs,
            'filters'       => $filters,
        ]);
    }

    // ── Formulaire de création ────────────────────────────────────────────────

    public function create(): Response
    {
        return Inertia::render('Lettres/Form', [
            'lettre'        => null, // null = mode création
            'distributeurs' => Distributeur::actif()->orderBy('nom')->get(['id', 'nom']),
        ]);
    }

    // ── Enregistrement création ───────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'distributeur_id' => ['required', 'exists:distributeurs,id'],
            'montant_ttc'     => ['required', 'numeric', 'min:0.01'],
            'date_emission'   => ['required', 'date'],
            'notes'           => ['nullable', 'string', 'max:2000'],
        ]);

        $lettre = Lettre::create([
            ...$data,
            'reference'     => Lettre::genererReference(),
            'statut'        => 'en_attente',
            'cree_par'      => auth()->id(),
        ]);

        // Calculer la date d'échéance depuis le délai du distributeur
        $lettre->calculerEtSauvegarderEcheance();

        return redirect()->route('lettres.show', $lettre)
            ->with('success', "Lettre {$lettre->reference} créée.");
    }

    // ── Détail ────────────────────────────────────────────────────────────────

    public function show(Lettre $lettre): Response
    {
        $lettre->load('distributeur', 'lignes', 'createurUser');

        return Inertia::render('Lettres/Detail', [
            'lettre' => [
                'id'              => $lettre->id,
                'reference'       => $lettre->reference,
                'statut'          => $lettre->statut,
                'montant_ttc'     => $lettre->montant_ttc,
                'date_emission'   => $lettre->date_emission?->format('Y-m-d'),
                'date_echeance'   => $lettre->date_echeance?->format('Y-m-d'),
                'jours_restants'  => $lettre->jours_restants,
                'notes'           => $lettre->notes,
                'distributeur'    => $lettre->distributeur,
                'lignes'          => $lettre->lignes,
                'cree_par'        => $lettre->createurUser?->nom,
                'cree_le'         => $lettre->cree_le?->format('d/m/Y H:i'),
            ],
        ]);
    }

    // ── Formulaire de modification ────────────────────────────────────────────

    public function edit(Lettre $lettre): Response
    {
        return Inertia::render('Lettres/Form', [
            'lettre'        => $lettre->load('distributeur'),
            'distributeurs' => Distributeur::actif()->orderBy('nom')->get(['id', 'nom']),
        ]);
    }

    // ── Enregistrement modification ───────────────────────────────────────────

    public function update(Request $request, Lettre $lettre)
    {
        $data = $request->validate([
            'distributeur_id' => ['required', 'exists:distributeurs,id'],
            'montant_ttc'     => ['required', 'numeric', 'min:0.01'],
            'date_emission'   => ['required', 'date'],
            'notes'           => ['nullable', 'string', 'max:2000'],
        ]);

        $lettre->update($data);
        $lettre->calculerEtSauvegarderEcheance();

        return redirect()->route('lettres.show', $lettre)
            ->with('success', "Lettre {$lettre->reference} mise à jour.");
    }

    // ── Action : marquer payée ────────────────────────────────────────────────

    public function payer(Lettre $lettre)
    {
        abort_unless(in_array($lettre->statut, ['en_attente', 'en_retard']), 403);

        $lettre->update([
            'statut'   => 'paye',
            'paye_le'  => now(),
        ]);

        return redirect()->route('lettres.show', $lettre)
            ->with('success', "Lettre {$lettre->reference} marquée payée.");
    }

    // ── Soft delete ───────────────────────────────────────────────────────────

    public function destroy(Lettre $lettre)
    {
        $lettre->update(['supprime_le' => now()]);

        return redirect()->route('lettres.index')
            ->with('success', "Lettre {$lettre->reference} déplacée en corbeille.");
    }

    // ── Restaurer depuis corbeille ────────────────────────────────────────────

    public function restore(int $id)
    {
        // withTrashed = on interroge aussi les supprimés
        $lettre = Lettre::withoutGlobalScope('actif')->findOrFail($id);
        $lettre->update(['supprime_le' => null]);

        return redirect()->route('lettres.index')
            ->with('success', "Lettre restaurée.");
    }
}
