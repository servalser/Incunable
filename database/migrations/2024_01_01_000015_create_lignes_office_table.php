<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lignes_office', function (Blueprint $table) {
            $table->id();
            $table->foreignId('office_id')->constrained('offices')->cascadeOnDelete();
            $table->string('isbn')->nullable();
            $table->string('titre');
            $table->string('auteur')->nullable();
            $table->string('editeur')->nullable();
            $table->unsignedSmallInteger('quantite_recue')->default(1);
            $table->unsignedSmallInteger('quantite_retournee')->default(0);
            $table->decimal('prix_unitaire_ttc', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lignes_office');
    }
};
