<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'nom', 'email', 'password',
        'role', 'actif', 'tentatives_connexion',
        'verrouille_jusqu_a', 'derniere_connexion',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'           => 'hashed',
            'actif'              => 'boolean',
            'verrouille_jusqu_a' => 'datetime',
            'derniere_connexion' => 'datetime',
        ];
    }

    // ── Helpers de rôle ──────────────────────────────────────────────────────

    /** Vérifie si l'utilisateur est gérant ou admin (droit d'écriture sur les budgets) */
    public function estGerant(): bool
    {
        return in_array($this->role, ['gérant', 'admin']);
    }

    /** Vérifie si l'utilisateur est employé (accès complet sauf budgets en écriture) */
    public function estEmploye(): bool
    {
        return $this->role === 'employé';
    }

    /**
     * Vérifie si l'utilisateur a une permission métier.
     *
     * Permissions disponibles :
     *   'modifier_budget' → réservé aux gérants et admins
     *   'manage_users'    → réservé aux admins uniquement
     *   (tout le reste)   → accordé à tous les rôles actifs
     */
    public function peutFaire(string $permission): bool
    {
        // Admin : tout est permis
        if ($this->role === 'admin') return true;

        // Gérant : tout sauf manage_users
        if ($this->role === 'gérant') {
            return $permission !== 'manage_users';
        }

        // Employé : tout sauf modifier les budgets et gérer les utilisateurs
        if ($this->role === 'employé') {
            return ! in_array($permission, ['modifier_budget', 'manage_users']);
        }

        // Anciens rôles (compatibilité ascendante)
        if ($this->role === 'comptable') return $permission !== 'manage_users';
        if ($this->role === 'lecteur')   return in_array($permission, ['view', 'export']);

        return false;
    }

    /** Label français du rôle — utilisé dans l'interface */
    public function roleLabel(): string
    {
        return match($this->role) {
            'gérant'    => 'Gérant',
            'employé'   => 'Employé',
            'admin'     => 'Administrateur',
            'comptable' => 'Comptable',
            'lecteur'   => 'Lecteur',
            default     => $this->role ?? 'Inconnu',
        };
    }

    // ── Relations ────────────────────────────────────────────────────────────

    public function mouvementsStock()
    {
        return $this->hasMany(MouvementStock::class, 'user_id');
    }

    public function budgetsCrees()
    {
        return $this->hasMany(Budget::class, 'cree_par');
    }

    public function questionsIgnorees()
    {
        return $this->hasMany(QuestionIgnoree::class, 'user_id');
    }
}
