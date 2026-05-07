<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute les colonnes pour l'intégration LibriWeb (Librisoft en ligne).
 *
 * LibriWeb est la plateforme web de Librisoft permettant de synchroniser
 * le catalogue, les stocks et les ventes depuis le logiciel de caisse.
 * Cette intégration est optionnelle : elle se configure dans l'onglet
 * "Intégrations" de la page Configuration (réservé aux admins).
 *
 * Pour l'activer, le client doit fournir ses identifiants LibriWeb.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuration', function (Blueprint $table) {
            // Activation de l'intégration (off par défaut)
            $table->boolean('libriweb_actif')
                  ->default(false)
                  ->after('delai_nouveautes_semaines')
                  ->comment('Active la synchronisation avec LibriWeb / Librisoft');

            // URL de l'API LibriWeb du client (fournie par Librisoft)
            // Exemple : https://api.libriweb.fr/v1
            $table->string('libriweb_url', 255)
                  ->nullable()
                  ->after('libriweb_actif');

            // Identifiant client LibriWeb (fourni par Librisoft)
            $table->string('libriweb_client_id', 100)
                  ->nullable()
                  ->after('libriweb_url');

            // Clé API LibriWeb (à garder secrète)
            $table->string('libriweb_api_key', 255)
                  ->nullable()
                  ->after('libriweb_client_id');
        });
    }

    public function down(): void
    {
        Schema::table('configuration', function (Blueprint $table) {
            $table->dropColumn([
                'libriweb_actif',
                'libriweb_url',
                'libriweb_client_id',
                'libriweb_api_key',
            ]);
        });
    }
};
