<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fiches_missions', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->string('auteur')->nullable();
            $table->string('isbn', 13)->nullable();
            $table->string('editeur')->nullable();
            $table->decimal('prix_ttc', 8, 2)->nullable();
            $table->string('categorie')->nullable();
            $table->enum('priorite', ['faible', 'normale', 'haute'])->default('normale');
            $table->enum('statut', ['a_evaluer', 'lu', 'recommande', 'refuse'])->default('a_evaluer');
            $table->text('notes')->nullable();
            $table->foreignId('cree_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiches_missions');
    }
};
