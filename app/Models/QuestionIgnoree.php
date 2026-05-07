<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modèle Eloquent pour la table `questions_ignorees`.
 *
 * Permet de mémoriser qu'un utilisateur a choisi d'ignorer une question
 * ou une suggestion affichée dans l'interface (ex : alertes du Conseiller IA,
 * rappels de configuration, notifications contextuelles…).
 *
 * La combinaison (user_id + question_id + entite_type + entite_id)
 * identifie de façon unique une question ignorée pour un contexte donné.
 *
 * Particularité : pas de `updated_at`, pas de `created_at` standard —
 * on utilise la colonne `ignoree_le` comme timestamp de création.
 */
class QuestionIgnoree extends Model
{
    protected $table = 'questions_ignorees';

    /**
     * Champs assignables en masse.
     */
    protected $fillable = [
        'user_id',
        'question_id',    // identifiant textuel de la question (ex : 'alerte_stock_bas')
        'entite_type',    // classe de l'entité concernée (ex : 'App\Models\Produit')
        'entite_id',      // id de l'entité concernée (nullable)
    ];

    /**
     * Désactivation des deux timestamps automatiques Laravel.
     * On gère manuellement la colonne `ignoree_le`.
     */
    public $timestamps = false;

    /**
     * On mappe le nom de la constante CREATED_AT sur notre colonne `ignoree_le`.
     * Laravel l'utilisera lors d'un Model::create() pour y écrire la date.
     */
    const CREATED_AT = 'ignoree_le';

    /**
     * Conversions de types automatiques.
     */
    protected $casts = [
        'entite_id' => 'integer',   // nullable
    ];

    // -------------------------------------------------------------------------
    // RELATIONS
    // -------------------------------------------------------------------------

    /**
     * L'utilisateur qui a ignoré cette question.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // MÉTHODES STATIQUES
    // -------------------------------------------------------------------------

    /**
     * Vérifie si une combinaison (utilisateur, question, entité) existe déjà en base.
     *
     * Utilisé dans les vues/controllers pour savoir s'il faut afficher
     * ou masquer une alerte/suggestion.
     *
     * Exemples d'appels :
     *   QuestionIgnoree::estIgnoree(1, 'alerte_stock_bas')
     *   QuestionIgnoree::estIgnoree(1, 'alerte_stock_bas', 'App\Models\Produit', 42)
     *
     * @param int         $userId      ID de l'utilisateur connecté
     * @param string      $questionId  Identifiant textuel de la question
     * @param string|null $entiteType  Classe de l'entité (optionnel)
     * @param int|null    $entiteId    ID de l'entité (optionnel)
     * @return bool  true si la question a déjà été ignorée
     */
    public static function estIgnoree(
        int     $userId,
        string  $questionId,
        ?string $entiteType = null,
        ?int    $entiteId = null
    ): bool {
        return static::where('user_id', $userId)
            ->where('question_id', $questionId)
            ->where('entite_type', $entiteType)   // null == null en SQL → whereNull géré automatiquement
            ->where('entite_id', $entiteId)
            ->exists();
    }
}
