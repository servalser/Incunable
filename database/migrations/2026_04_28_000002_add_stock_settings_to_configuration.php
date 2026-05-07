<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuration', function (Blueprint $table) {
            // Seuil d'alerte stock global : alerte si stock <= seuil
            // Chaque produit peut avoir son propre seuil (nullable dans produits)
            $table->unsignedSmallInteger('seuil_alerte_stock_global')->default(2)
                  ->after('alerte_recap_hebdo');

            // Durée (en semaines) pour qu'un produit soit considéré "nouveauté"
            // Défaut : 8 semaines (~2 mois)
            $table->unsignedTinyInteger('delai_nouveautes_semaines')->default(8)
                  ->after('seuil_alerte_stock_global');
        });
    }

    public function down(): void
    {
        Schema::table('configuration', function (Blueprint $table) {
            $table->dropColumn(['seuil_alerte_stock_global', 'delai_nouveautes_semaines']);
        });
    }
};
