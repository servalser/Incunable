<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuration', function (Blueprint $table) {
            $table->id();
            $table->string('nom_librairie')->default('Ma Librairie');
            $table->string('siret')->nullable();
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->text('adresse')->nullable();

            // Délais de paiement par défaut (en mois)
            $table->unsignedTinyInteger('delai_commandes_mois')->default(3);
            $table->unsignedTinyInteger('delai_offices_mois')->default(2);

            // Alertes email
            $table->boolean('alerte_7j')->default(true);
            $table->boolean('alerte_1j')->default(true);
            $table->boolean('alerte_retard')->default(true);
            $table->boolean('alerte_retour_expiration')->default(true);
            $table->boolean('alerte_recap_hebdo')->default(false);

            // SMTP
            $table->string('smtp_host')->nullable();
            $table->unsignedSmallInteger('smtp_port')->default(587);
            $table->string('smtp_username')->nullable();
            $table->string('smtp_password')->nullable();
            $table->string('smtp_from_email')->nullable();
            $table->string('smtp_from_name')->default('Incunable');
            $table->boolean('smtp_tls')->default(true);

            // Thème visuel
            $table->unsignedSmallInteger('theme_hue')->default(348);
            $table->unsignedTinyInteger('theme_sat')->default(62);
            $table->boolean('theme_dark')->default(false);
        });

        // Ligne unique de configuration
        \DB::table('configuration')->insert([
            'nom_librairie' => 'Ma Librairie',
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('configuration');
    }
};
