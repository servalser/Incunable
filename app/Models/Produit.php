<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Modèle Eloquent pour la table `produits`.
 *
 * Représente un article du catalogue de la librairie :
 * soit un livre, soit un goodie (objet dérivé, jeux, etc.).
 */
class Produit extends Model
{
    protected $table = 'produits';

    /**
     * Champs assignables en masse.
     * On exclut `id` et les timestamps Laravel (created_at, updated_at)
     * car ils sont gérés automatiquement.
     */
    protected $fillable = [
        'reference',
        'ean',
        'titre',
        'auteur',
        'editeur',
        'type',           // 'livre' ou 'goodie'
        'genre',
        'prix_ttc',
        'date_parution',
        'stock_physique',
        'seuil_alerte',
        'notes',
        'supprime_le',
    ];

    /**
     * Conversions automatiques de types.
     * Laravel transforme ces colonnes au bon type PHP lors de la lecture.
     */
    protected $casts = [
        'prix_ttc'        => 'float',
        'date_parution'   => 'date',      // Carbon date (sans heure)
        'stock_physique'  => 'integer',
        'seuil_alerte'    => 'integer',   // nullable : peut être null
    ];

    // -------------------------------------------------------------------------
    // SCOPES — filtres réutilisables qu'on peut chaîner sur les requêtes
    // -------------------------------------------------------------------------

    /**
     * Scope `actif` : exclut les produits supprimés (soft-delete manuel).
     * Usage : Produit::actif()->get()
     */
    public function scopeActif($q)
    {
        return $q->whereNull('supprime_le');
    }

    /**
     * Scope `recherche` : filtre LIKE sur titre, auteur, EAN et référence.
     * Usage : Produit::actif()->recherche('tolkien')->get()
     *
     * Si $search est null ou vide, la requête n'est pas modifiée.
     */
    public function scopeRecherche($q, ?string $search)
    {
        if (!$search) {
            return $q;
        }

        $terme = '%' . $search . '%';

        return $q->where(function ($sub) use ($terme) {
            $sub->where('titre', 'LIKE', $terme)
                ->orWhere('auteur', 'LIKE', $terme)
                ->orWhere('ean', 'LIKE', $terme)
                ->orWhere('reference', 'LIKE', $terme);
        });
    }

    /**
     * Scope `livres` : retourne uniquement les produits de type 'livre'.
     */
    public function scopeLivres($q)
    {
        return $q->where('type', 'livre');
    }

    /**
     * Scope `goodies` : retourne uniquement les produits de type 'goodie'.
     */
    public function scopeGoodies($q)
    {
        return $q->where('type', 'goodie');
    }

    // -------------------------------------------------------------------------
    // ACCESSEURS — propriétés calculées accessibles comme $produit->est_nouveaute
    // -------------------------------------------------------------------------

    /**
     * Indique si le produit est une nouveauté.
     *
     * On lit le délai en semaines depuis la table `configuration` via DB façade
     * (on évite config_val() pour ne pas créer de dépendance circulaire
     * si le helper n'est pas encore chargé au boot du modèle).
     *
     * @return bool
     */
    public function getEstNouveauteAttribute(): bool
    {
        if (!$this->date_parution) {
            return false;
        }

        // Lecture directe en base : délai en semaines (défaut : 8)
        $semaines = \DB::table('configuration')->value('delai_nouveautes_semaines') ?? 8;

        // La date de parution est-elle dans les N dernières semaines ?
        return $this->date_parution->greaterThanOrEqualTo(
            Carbon::now()->subWeeks((int) $semaines)
        );
    }

    /**
     * Indique si le stock est sous le seuil d'alerte.
     *
     * Priorité : seuil_alerte du produit, sinon seuil global en configuration.
     *
     * @return bool
     */
    public function getEnAlerteAttribute(): bool
    {
        $seuil = $this->seuil_alerte
            ?? (\DB::table('configuration')->value('seuil_alerte_stock_global') ?? 2);

        return $this->stock_physique <= (int) $seuil;
    }

    /**
     * Indique si le produit est en rupture de stock (stock ≤ 0).
     *
     * @return bool
     */
    public function getEnRuptureAttribute(): bool
    {
        return $this->stock_physique <= 0;
    }

    /**
     * Valeur totale du stock pour ce produit (stock × prix unitaire TTC).
     *
     * @return float
     */
    public function getValeurStockAttribute(): float
    {
        return $this->stock_physique * ($this->prix_ttc ?? 0);
    }

    // -------------------------------------------------------------------------
    // MÉTHODES STATIQUES
    // -------------------------------------------------------------------------

    /**
     * Génère une référence unique au format PRD-YYYY-XXXX.
     *
     * On cherche la dernière référence de l'année courante et on incrémente
     * le compteur. Même logique que Lettre::genererReference().
     *
     * Exemple : PRD-2026-0001, PRD-2026-0002…
     *
     * @return string
     */
    public static function genererReference(): string
    {
        $annee = date('Y');
        $prefixe = "PRD-{$annee}-";

        // On cherche la dernière référence de cette année
        $derniere = static::where('reference', 'LIKE', $prefixe . '%')
            ->orderBy('reference', 'desc')
            ->value('reference');

        if ($derniere) {
            // Extrait le numéro après le dernier tiret et incrémente
            $numero = (int) substr($derniere, strrpos($derniere, '-') + 1);
            $numero++;
        } else {
            $numero = 1;
        }

        // Formatage sur 4 chiffres avec zéros : 0001, 0042, 0150…
        return $prefixe . str_pad($numero, 4, '0', STR_PAD_LEFT);
    }

    // -------------------------------------------------------------------------
    // RELATIONS
    // -------------------------------------------------------------------------

    /**
     * Un produit peut avoir plusieurs mouvements de stock.
     * (entrées, sorties, ajustements, retours…)
     */
    public function mouvements()
    {
        return $this->hasMany(MouvementStock::class);
    }
}
