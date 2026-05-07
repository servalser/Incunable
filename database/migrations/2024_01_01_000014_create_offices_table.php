<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offices', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();

            $table->foreignId('distributeur_id')->constrained('distributeurs')->restrictOnDelete();
            $table->foreignId('cree_par')->nullable()->constrained('users')->nullOnDelete();

            // type = facon | grille | exceptionnel
            $table->enum('type', ['facon', 'grille', 'exceptionnel']);

            // Dates
            $table->date('date_reception');
            $table->date('date_retour_limite')->nullable(); // Calculé depuis date_reception + délai

            // Montants
            $table->decimal('montant_ttc', 10, 2);
            $table->decimal('montant_retourne', 10, 2)->default(0);
            // montant_net = montant_ttc - montant_retourne, calculé par l'accesseur Eloquent

            $table->text('notes')->nullable();

            $table->enum('statut', ['en_attente', 'paye', 'en_retard', 'retour_partiel', 'retourne'])
                  ->default('en_attente');

            $table->timestamp('paye_le')->nullable();
            $table->timestamp('supprime_le')->nullable();
            $table->timestamps();

            $table->index(['statut', 'supprime_le']);
            $table->index(['date_retour_limite', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offices');
    }
};
