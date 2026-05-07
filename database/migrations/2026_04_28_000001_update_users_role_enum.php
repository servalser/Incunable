<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Ajoute les valeurs 'gérant' et 'employé' à l'enum role de la table users.
     * On conserve 'admin', 'comptable', 'lecteur' pour la compatibilité ascendante.
     *
     * On utilise DB::statement() car le Schema Builder de Laravel
     * ne sait pas faire un MODIFY sur un ENUM sans récrire toute la colonne.
     */
    public function up(): void
    {
        DB::statement("
            ALTER TABLE users
            MODIFY COLUMN role
            ENUM('admin','comptable','lecteur','gérant','employé')
            NOT NULL DEFAULT 'employé'
        ");
    }

    public function down(): void
    {
        // Repasser à l'enum original (les utilisateurs gérant/employé deviendraient invalides)
        DB::statement("
            ALTER TABLE users
            MODIFY COLUMN role
            ENUM('admin','comptable','lecteur')
            NOT NULL DEFAULT 'lecteur'
        ");
    }
};
