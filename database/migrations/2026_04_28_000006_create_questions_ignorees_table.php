<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table questions_ignorees — mémoriser les questions du widget Dashboard
     * que l'utilisateur a marquées "hors contexte pour ce produit/distributeur".
     *
     * IMPORTANT : on ignore la question pour UNE entité précise, pas pour tous.
     * Exemple :
     *   question_id  = 'produit_dormant'
     *   entite_type  = 'produit'
     *   entite_id    = 42
     *   → "Ne plus poser cette question pour le produit 42"
     *   → La même question peut être posée pour le produit 43 si son contexte le justifie.
     */
    public function up(): void
    {
        Schema::create('questions_ignorees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Identifiant stable du type de question (ex: 'produit_dormant', 'lcr_retard_long')
            $table->string('question_id', 60);

            // Type de l'entité concernée (produit, distributeur, budget…)
            $table->string('entite_type', 30)->nullable();

            // ID de l'entité concernée dans sa table
            $table->unsignedBigInteger('entite_id')->nullable();

            $table->timestamp('ignoree_le')->useCurrent();

            // Unicité : un utilisateur ne peut ignorer qu'une fois la même question pour la même entité
            $table->unique(
                ['user_id', 'question_id', 'entite_type', 'entite_id'],
                'uq_question_ignoree'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions_ignorees');
    }
};
