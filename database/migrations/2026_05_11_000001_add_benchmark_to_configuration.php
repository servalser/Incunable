<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute les colonnes nécessaires au benchmark réseau.
 *
 * benchmark_actif        — l'administrateur accepte explicitement de partager
 *                          des statistiques anonymisées avec le réseau Incunable.
 * benchmark_token        — UUID généré une seule fois, identifie cette instance
 *                          de façon anonyme auprès du hub central. Jamais modifié.
 * benchmark_derniere_sync — horodatage de la dernière synchronisation réussie.
 * benchmark_donnees      — JSON reçu du hub : agrégat des statistiques réseau
 *                          (toutes les librairies participantes, sans nom ni adresse).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuration', function (Blueprint $table) {
            $table->boolean('benchmark_actif')->default(false)->after('libriweb_api_key');
            $table->string('benchmark_token', 36)->nullable()->after('benchmark_actif');
            $table->timestamp('benchmark_derniere_sync')->nullable()->after('benchmark_token');
            $table->json('benchmark_donnees')->nullable()->after('benchmark_derniere_sync');
        });
    }

    public function down(): void
    {
        Schema::table('configuration', function (Blueprint $table) {
            $table->dropColumn([
                'benchmark_actif',
                'benchmark_token',
                'benchmark_derniere_sync',
                'benchmark_donnees',
            ]);
        });
    }
};
