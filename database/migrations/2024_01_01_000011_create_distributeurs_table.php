<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('distributeurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('siret')->nullable();
            $table->text('adresse')->nullable();
            $table->text('notes')->nullable();

            // Délais spécifiques (null = utiliser les délais globaux)
            $table->unsignedTinyInteger('delai_commandes_mois')->nullable();
            $table->unsignedTinyInteger('delai_offices_mois')->nullable();
            $table->unsignedTinyInteger('delai_retour_office_mois')->default(6);

            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('distributeurs');
    }
};
