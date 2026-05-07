<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Distributeur extends Model
{
    protected $table = 'distributeurs';

    protected $fillable = [
        'nom', 'email', 'telephone', 'siret', 'adresse', 'notes',
        'delai_commandes_mois', 'delai_offices_mois', 'delai_retour_office_mois',
        'actif',
    ];

    protected function casts(): array
    {
        return ['actif' => 'boolean'];
    }

    /** Scope : ne retourne que les distributeurs actifs */
    public function scopeActif(Builder $q): Builder
    {
        return $q->where('actif', true);
    }

    public function lettres(): HasMany
    {
        return $this->hasMany(Lettre::class);
    }

    public function offices(): HasMany
    {
        return $this->hasMany(Office::class);
    }

    /**
     * Retourne le délai de paiement commandes effectif
     * (spécifique distributeur > global config)
     */
    public function delaiCommandes(): int
    {
        return $this->delai_commandes_mois
            ?? config_val('delai_commandes_mois', 3);
    }

    public function delaiOffices(): int
    {
        return $this->delai_offices_mois
            ?? config_val('delai_offices_mois', 2);
    }
}
