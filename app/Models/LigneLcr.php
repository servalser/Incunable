<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneLcr extends Model
{
    protected $table = 'lignes_lcr';

    protected $fillable = [
        'lettre_id', 'isbn', 'titre', 'auteur', 'editeur',
        'quantite', 'prix_unitaire_ttc', 'montant_ttc',
    ];

    protected function casts(): array
    {
        return [
            'prix_unitaire_ttc' => 'decimal:2',
            'montant_ttc'       => 'decimal:2',
        ];
    }

    public function lettre(): BelongsTo
    {
        return $this->belongsTo(Lettre::class);
    }
}
