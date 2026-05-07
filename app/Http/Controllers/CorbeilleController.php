<?php

namespace App\Http\Controllers;

use App\Models\Lettre;
use App\Models\Office;
use Inertia\Inertia;
use Inertia\Response;

class CorbeilleController extends Controller
{
    public function index(): Response
    {
        // On interroge les éléments supprimés (supprime_le IS NOT NULL)
        // en utilisant une query sans le scope "actif"
        $lettres = Lettre::withoutGlobalScopes()
            ->whereNotNull('supprime_le')
            ->with('distributeur')
            ->orderByDesc('supprime_le')
            ->get();

        $offices = Office::withoutGlobalScopes()
            ->whereNotNull('supprime_le')
            ->with('distributeur')
            ->orderByDesc('supprime_le')
            ->get();

        return Inertia::render('Corbeille', [
            'lettres' => $lettres,
            'offices' => $offices,
        ]);
    }

    public function restore(string $type, int $id)
    {
        $model = $this->findTrashed($type, $id);
        $model->update(['supprime_le' => null]);

        return redirect()->route('corbeille.index')
            ->with('success', 'Élément restauré.');
    }

    public function destroy(string $type, int $id)
    {
        // Suppression définitive (hard delete — pas de trait SoftDeletes, delete() = vraie suppression)
        $model = $this->findTrashed($type, $id);
        $model->delete();

        return redirect()->route('corbeille.index')
            ->with('success', 'Élément supprimé définitivement.');
    }

    // ── Utilitaire : retrouver le bon modèle ──────────────────────────────────

    private function findTrashed(string $type, int $id)
    {
        return match ($type) {
            'lettre' => Lettre::withoutGlobalScopes()->findOrFail($id),
            'office' => Office::withoutGlobalScopes()->findOrFail($id),
            default  => abort(404),
        };
    }
}
