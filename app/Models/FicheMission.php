<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FicheMission extends Model
{
    protected $table = 'fiches_missions';

    protected $fillable = [
        'titre', 'auteur', 'isbn', 'editeur',
        'prix_ttc', 'categorie',
        'priorite', 'statut', 'notes',
        'cree_par',
    ];

    protected function casts(): array
    {
        return ['prix_ttc' => 'decimal:2'];
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    /** Filtre par statut */
    public function scopeStatut(Builder $q, ?string $statut): Builder
    {
        return $statut ? $q->where('statut', $statut) : $q;
    }

    /** Filtre par priorité */
    public function scopePriorite(Builder $q, ?string $priorite): Builder
    {
        return $priorite ? $q->where('priorite', $priorite) : $q;
    }

    /** Recherche texte sur titre, auteur, editeur, isbn */
    public function scopeRecherche(Builder $q, ?string $terme): Builder
    {
        if (!$terme) return $q;
        return $q->where(function ($sub) use ($terme) {
            $sub->where('titre',   'like', "%{$terme}%")
                ->orWhere('auteur',  'like', "%{$terme}%")
                ->orWhere('editeur', 'like', "%{$terme}%")
                ->orWhere('isbn',    'like', "%{$terme}%");
        });
    }
}
