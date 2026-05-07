<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneOffice extends Model
{
    protected $table = 'lignes_office';

    protected $fillable = [
        'office_id', 'isbn', 'titre', 'auteur', 'editeur',
        'quantite_recue', 'quantite_retournee', 'prix_unitaire_ttc',
    ];

    protected function casts(): array
    {
        return ['prix_unitaire_ttc' => 'decimal:2'];
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function getQuantiteDisponibleAttribute(): int
    {
        return $this->quantite_recue - $this->quantite_retournee;
    }
}
