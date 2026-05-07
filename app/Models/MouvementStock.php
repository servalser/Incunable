<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modèle Eloquent pour la table `mouvements_stock`.
 *
 * Chaque ligne enregistre une variation de stock pour un produit :
 * entrée de marchandise, vente (sortie), ajustement d'inventaire,
 * ou retour depuis Librisoft (logiciel de gestion librairie).
 *
 * Particularité : pas de colonne `updated_at` — un mouvement est immuable
 * une fois créé. On garde uniquement `created_at`.
 */
class MouvementStock extends Model
{
    protected $table = 'mouvements_stock';

    /**
     * Champs assignables en masse.
     */
    protected $fillable = [
        'produit_id',
        'user_id',
        'type',          // 'entree' | 'sortie' | 'ajustement' | 'retour_librisoft'
        'quantite',
        'stock_apres',   // valeur du stock après ce mouvement (dénormalisé pour l'historique)
        'motif',
        'source',        // ex : 'manuel', 'import_csv', 'vente_pos'…
    ];

    /**
     * Désactivation du timestamp `updated_at`.
     * On garde seulement `created_at` (colonne de traçabilité).
     */
    public $timestamps = false;

    /**
     * On indique à Laravel quelle colonne utiliser pour la date de création.
     * Sans $timestamps = true, il faut le déclarer explicitement.
     */
    const CREATED_AT = 'created_at';

    /**
     * Conversions de types automatiques.
     */
    protected $casts = [
        'quantite'    => 'integer',
        'stock_apres' => 'integer',
    ];

    // -------------------------------------------------------------------------
    // RELATIONS
    // -------------------------------------------------------------------------

    /**
     * Un mouvement appartient à un produit (inverse du hasMany).
     */
    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }

    /**
     * Un mouvement est réalisé par un utilisateur.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // MÉTHODES UTILITAIRES
    // -------------------------------------------------------------------------

    /**
     * Retourne la classe CSS Tailwind correspondant au type de mouvement.
     * Utilisé dans les vues pour coloriser le badge de type.
     *
     * @return string
     */
    public function typeBadgeClass(): string
    {
        return match ($this->type) {
            'entree'           => 'text-green-600',
            'sortie'           => 'text-red-600',
            'ajustement'       => 'text-yellow-600',
            'retour_librisoft' => 'text-blue-600',
            default            => 'text-gray-500',
        };
    }

    /**
     * Retourne le libellé français du type de mouvement.
     * Utilisé pour l'affichage dans les tableaux et exports.
     *
     * @return string
     */
    public function typeLabel(): string
    {
        return match ($this->type) {
            'entree'           => 'Entrée',
            'sortie'           => 'Sortie',
            'ajustement'       => 'Ajustement',
            'retour_librisoft' => 'Import Librisoft',
            default            => $this->type,
        };
    }
}
