<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lignes_lcr', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lettre_id')->constrained('lettres_de_change')->cascadeOnDelete();
            $table->string('isbn')->nullable();
            $table->string('titre');
            $table->string('auteur')->nullable();
            $table->string('editeur')->nullable();
            $table->unsignedSmallInteger('quantite')->default(1);
            $table->decimal('prix_unitaire_ttc', 8, 2)->default(0);
            $table->decimal('montant_ttc', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lignes_lcr');
    }
};
