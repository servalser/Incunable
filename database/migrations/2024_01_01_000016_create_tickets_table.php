<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cree_par')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sujet', 200);
            $table->text('description');
            $table->enum('priorite', ['faible', 'normale', 'haute', 'urgente'])->default('normale');
            $table->enum('statut', ['ouvert', 'en_cours', 'ferme'])->default('ouvert');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
