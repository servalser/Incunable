<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table mouvements_stock — journal de toutes les entrées/sorties.
     *
     * Types de mouvements :
     *   entree          → livraison reçue, réassort
     *   sortie          → vente saisie manuellement
     *   ajustement      → correction d'inventaire (positif ou négatif)
     *   retour_librisoft→ synchronisation depuis Librisoft (webhook ou import CSV)
     *
     * La quantite est toujours positive ; le type détermine le sens.
     * (Simplification vs un delta positif/négatif — plus lisible pour l'employé)
     */
    public function up(): void
    {
        Schema::create('mouvements_stock', function (Blueprint $table) {
            $table->id();

            $table->foreignId('produit_id')
                  ->constrained('produits')
                  ->cascadeOnDelete();

            // Qui a fait le mouvement (null pour les imports automatiques)
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->enum('type', ['entree', 'sortie', 'ajustement', 'retour_librisoft']);

            // Quantité concernée par ce mouvement (toujours positive)
            $table->unsignedInteger('quantite');

            // Stock résultant après ce mouvement (calculé au moment de l'insertion)
            $table->integer('stock_apres');

            $table->string('motif', 255)->nullable();

            // D'où vient l'info (interface manuelle, webhook, import CSV)
            $table->enum('source', ['manuel', 'webhook', 'import_csv'])->default('manuel');

            // Pas de updated_at — un mouvement ne s'édite pas
            $table->timestamp('created_at')->useCurrent();

            $table->index('produit_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_stock');
    }
};
