<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Office extends Model
{
    protected $table = 'offices';

    protected $fillable = [
        'reference', 'distributeur_id', 'cree_par',
        'type',                         // facon | grille | exceptionnel
        'date_reception', 'date_retour_limite',
        'montant_ttc', 'montant_retourne',
        'notes', 'statut',
        'paye_le', 'supprime_le',
    ];

    protected function casts(): array
    {
        return [
            'date_reception'     => 'date',
            'date_retour_limite' => 'date',
            'paye_le'            => 'datetime',
            'supprime_le'        => 'datetime',
            'montant_ttc'        => 'decimal:2',
            'montant_retourne'   => 'decimal:2',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function distributeur(): BelongsTo
    {
        return $this->belongsTo(Distributeur::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneOffice::class);
    }

    public function createurUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActif(Builder $q): Builder
    {
        return $q->whereNull('supprime_le');
    }

    public function scopeStatut(Builder $q, ?string $statut): Builder
    {
        return $statut ? $q->where('statut', $statut) : $q;
    }

    public function scopeType(Builder $q, ?string $type): Builder
    {
        return $type ? $q->where('type', $type) : $q;
    }

    public function scopeRecherche(Builder $q, ?string $search): Builder
    {
        if (!$search) return $q;
        return $q->where(fn($s) =>
            $s->where('reference', 'like', "%{$search}%")
              ->orWhereHas('distributeur', fn($d) => $d->where('nom', 'like', "%{$search}%"))
        );
    }

    // ── Accesseurs calculés ───────────────────────────────────────────────────

    /** montant_net = montant_ttc - montant_retourne */
    public function getMontantNetAttribute(): float
    {
        return round((float) $this->montant_ttc - (float) $this->montant_retourne, 2);
    }

    /** Jours avant la limite de retour (négatif si dépassé) */
    public function getJoursRetourRestantsAttribute(): int
    {
        if (!$this->date_retour_limite) return 0;
        return (int) now()->startOfDay()->diffInDays($this->date_retour_limite->startOfDay(), false);
    }

    // ── Logique métier ────────────────────────────────────────────────────────

    /**
     * Calcule la date limite de retour depuis la date de réception + délai offices.
     */
    public function calculerEtSauvegarderRetourLimite(): void
    {
        $distributeur = $this->distributeur ?? $this->load('distributeur')->distributeur;
        $delaiMois = $distributeur->delai_offices_mois ?? config_val('delai_offices_mois', 3);

        $this->update([
            'date_retour_limite' => $this->date_reception->addMonths($delaiMois),
        ]);
    }

    // ── Génération de référence unique ────────────────────────────────────────

    public static function genererReference(): string
    {
        $prefix = 'OFF-' . date('Y') . '-';
        $last   = static::withoutGlobalScopes()->where('reference', 'like', $prefix . '%')->count();
        return $prefix . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }
}
