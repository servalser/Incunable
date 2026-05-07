<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lettre extends Model
{
    protected $table = 'lettres_de_change';

    protected $fillable = [
        'reference', 'distributeur_id', 'cree_par',
        'date_emission', 'date_echeance',
        'montant_ttc',
        'notes', 'statut',
        'paye_le', 'supprime_le',
    ];

    protected function casts(): array
    {
        return [
            'date_emission'  => 'date',
            'date_echeance'  => 'date',
            'paye_le'        => 'datetime',
            'supprime_le'    => 'datetime',
            'montant_ttc'    => 'decimal:2',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function distributeur(): BelongsTo
    {
        return $this->belongsTo(Distributeur::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneLcr::class, 'lettre_id');
    }

    /** L'utilisateur qui a créé la lettre */
    public function createurUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    /** Exclut les éléments en corbeille (supprime_le IS NULL) */
    public function scopeActif(Builder $q): Builder
    {
        return $q->whereNull('supprime_le');
    }

    /** Filtre par statut */
    public function scopeStatut(Builder $q, ?string $statut): Builder
    {
        return $statut ? $q->where('statut', $statut) : $q;
    }

    /** Recherche texte sur référence et nom distributeur */
    public function scopeRecherche(Builder $q, ?string $search): Builder
    {
        if (!$search) return $q;
        return $q->where(fn($s) =>
            $s->where('reference', 'like', "%{$search}%")
              ->orWhereHas('distributeur', fn($d) => $d->where('nom', 'like', "%{$search}%"))
        );
    }

    // ── Accesseurs calculés ───────────────────────────────────────────────────

    /** Nombre de jours avant (positif) ou après (négatif) l'échéance */
    public function getJoursRestantsAttribute(): int
    {
        if (!$this->date_echeance) return 0;
        return (int) now()->startOfDay()->diffInDays($this->date_echeance->startOfDay(), false);
    }

    // ── Logique métier ────────────────────────────────────────────────────────

    /**
     * Calcule la date d'échéance depuis la date d'émission + délai du distributeur,
     * puis sauvegarde.
     * Délai = délai du distributeur si défini, sinon délai global de la configuration.
     */
    public function calculerEtSauvegarderEcheance(): void
    {
        $distributeur = $this->distributeur ?? $this->load('distributeur')->distributeur;
        $delaiMois = $distributeur->delai_commandes_mois ?? config_val('delai_commandes_mois', 3);

        $this->update([
            'date_echeance' => $this->date_emission->addMonths($delaiMois),
        ]);
    }

    // ── Génération de référence unique ────────────────────────────────────────

    public static function genererReference(): string
    {
        $prefix = 'LCR-' . date('Y') . '-';
        $last   = static::withoutGlobalScopes()->where('reference', 'like', $prefix . '%')->count();
        return $prefix . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }
}
