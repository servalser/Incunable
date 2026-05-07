<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Modèle Eloquent pour la table `budgets`.
 *
 * Permet de suivre les prévisions budgétaires par catégorie et par mois,
 * et de les comparer aux dépenses/recettes réelles.
 *
 * Exemples de catégories : 'achats_livres', 'loyer', 'salaires', 'recettes_ventes'…
 */
class Budget extends Model
{
    protected $table = 'budgets';

    /**
     * Champs assignables en masse.
     * `id`, `created_at` et `updated_at` sont exclus (gérés automatiquement).
     */
    protected $fillable = [
        'annee',
        'mois',
        'categorie',
        'montant_prevu',
        'montant_reel',   // nullable : rempli en fin de période
        'notes',
        'cree_par',       // FK vers users.id
    ];

    /**
     * Conversions de types automatiques.
     */
    protected $casts = [
        'montant_prevu' => 'float',
        'montant_reel'  => 'float',   // nullable
        'annee'         => 'integer',
        'mois'          => 'integer',
    ];

    // -------------------------------------------------------------------------
    // ACCESSEURS
    // -------------------------------------------------------------------------

    /**
     * Écart entre le montant réel et le montant prévu.
     * Un écart négatif = on a dépensé moins que prévu (bonne nouvelle).
     * Un écart positif = on a dépassé le budget (attention).
     *
     * Retourne null si le montant réel n'est pas encore renseigné.
     *
     * @return float|null
     */
    public function getEcartAttribute(): ?float
    {
        if ($this->montant_reel === null) {
            return null;
        }

        return $this->montant_reel - $this->montant_prevu;
    }

    /**
     * Écart exprimé en pourcentage du montant prévu.
     *
     * Retourne null si :
     * - le montant réel n'est pas renseigné
     * - le montant prévu vaut 0 (division par zéro impossible)
     *
     * @return float|null
     */
    public function getEcartPourcentAttribute(): ?float
    {
        if ($this->montant_reel === null || $this->montant_prevu == 0) {
            return null;
        }

        // ($ecart / $prevu) × 100
        return ($this->ecart / $this->montant_prevu) * 100;
    }

    /**
     * Label français du mois (ex : 'Janvier', 'Février', 'Mars'…).
     *
     * On utilise Carbon pour construire une date fictive avec l'année et le mois,
     * puis on récupère le nom du mois en français via la locale.
     *
     * @return string
     */
    public function getMoisLabelAttribute(): string
    {
        // Carbon::createFromDate() crée une date Carbon avec le 1er du mois
        return Carbon::createFromDate($this->annee, $this->mois, 1)
            ->locale('fr')
            ->isoFormat('MMMM');  // 'janvier', 'février'… (minuscule en fr)
        // Si vous préférez la majuscule : ->translatedFormat('F')
    }

    // -------------------------------------------------------------------------
    // SCOPES
    // -------------------------------------------------------------------------

    /**
     * Scope `periode` : filtre sur une année ET un mois précis.
     * Usage : Budget::periode(2026, 4)->get()
     */
    public function scopePeriode($q, int $annee, int $mois)
    {
        return $q->where('annee', $annee)->where('mois', $mois);
    }

    /**
     * Scope `annee` : filtre sur une année entière.
     * Usage : Budget::annee(2026)->get() → retourne les 12 mois
     */
    public function scopeAnnee($q, int $annee)
    {
        return $q->where('annee', $annee);
    }

    // -------------------------------------------------------------------------
    // RELATIONS
    // -------------------------------------------------------------------------

    /**
     * L'utilisateur qui a créé cette ligne budgétaire.
     * La clé étrangère est `cree_par` (et non `user_id` par convention).
     */
    public function createur()
    {
        return $this->belongsTo(User::class, 'cree_par');
    }
}
