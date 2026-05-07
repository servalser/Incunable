<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lettres_de_change', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();

            // Distributeur émetteur
            $table->foreignId('distributeur_id')->constrained('distributeurs')->restrictOnDelete();

            // Créateur (utilisateur connecté au moment de la création)
            $table->foreignId('cree_par')->nullable()->constrained('users')->nullOnDelete();

            // Dates
            $table->date('date_emission');
            $table->date('date_echeance')->nullable(); // Calculé depuis date_emission + délai

            // Montants
            $table->decimal('montant_ttc', 10, 2);

            $table->text('notes')->nullable();

            $table->enum('statut', ['en_attente', 'paye', 'en_retard'])
                  ->default('en_attente');

            // Date de paiement (remplie quand statut → paye)
            $table->timestamp('paye_le')->nullable();

            // Soft-delete
            $table->timestamp('supprime_le')->nullable();

            $table->timestamps();

            $table->index(['statut', 'supprime_le']);
            $table->index(['date_echeance', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lettres_de_change');
    }
};
