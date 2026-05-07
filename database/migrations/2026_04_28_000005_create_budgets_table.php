<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table budgets — prévisions financières mensuelles par catégorie.
     *
     * Seul un gérant (ou admin) peut créer / modifier des lignes.
     * Les employés peuvent uniquement lire.
     *
     * Exemple de lignes :
     *   2025 | 05 | Achats livres    | prévu: 8000 € | réel: 7430 €
     *   2025 | 05 | Frais généraux   | prévu: 1200 €
     *   2025 | 05 | Salaires         | prévu: 3500 € | réel: 3500 €
     */
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();

            $table->smallInteger('annee');       // ex: 2025
            $table->unsignedTinyInteger('mois'); // 1 = janvier … 12 = décembre

            // Catégorie de dépense définie librement par le gérant
            $table->string('categorie', 100);

            $table->decimal('montant_prevu', 10, 2);

            // Montant réel renseigné en fin de période (nullable = pas encore connu)
            $table->decimal('montant_reel', 10, 2)->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('cree_par')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->timestamps();

            // Unicité : une seule ligne par (année, mois, catégorie)
            $table->unique(['annee', 'mois', 'categorie'], 'uq_budget_periode_cat');

            $table->index(['annee', 'mois']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
