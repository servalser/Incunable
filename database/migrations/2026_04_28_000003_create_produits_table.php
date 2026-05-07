<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table produits — catalogue de la librairie.
     *
     * Deux types de produits :
     *   - 'livre'  : identifié par EAN-13 (ISBN), auto-rempli via API OpenLibrary
     *   - 'goodie' : saisie manuelle (papeterie, jeux, cartes, etc.)
     *
     * Stock :
     *   stock_physique est stocké directement ici (pas de table séparée)
     *   car une librairie n'a qu'un seul emplacement.
     *   Les mouvements (entrées/sorties) sont tracés dans mouvements_stock.
     */
    public function up(): void
    {
        Schema::create('produits', function (Blueprint $table) {
            $table->id();

            // Référence interne générée automatiquement (ex: PRD-2025-0001)
            $table->string('reference', 30)->unique();

            // EAN-13 / ISBN-13 pour les livres (null pour les goodies)
            $table->string('ean', 20)->unique()->nullable();

            $table->string('titre', 255);
            $table->string('auteur', 255)->nullable();
            $table->string('editeur', 255)->nullable();

            // 'livre' ou 'goodie'
            $table->enum('type', ['livre', 'goodie'])->default('livre');

            // Genre libre (Roman, BD, Jeunesse, Papeterie, Jeux…)
            $table->string('genre', 100)->nullable();

            $table->decimal('prix_ttc', 8, 2)->nullable();

            // Date de parution — sert à calculer si c'est une nouveauté
            $table->date('date_parution')->nullable();

            // Stock physique actuel (mis à jour via mouvements_stock)
            $table->integer('stock_physique')->default(0);

            // Seuil d'alerte stock personnalisé.
            // Si NULL → utilise configuration.seuil_alerte_stock_global
            $table->unsignedSmallInteger('seuil_alerte')->nullable();

            // Notes libres (sourcing, commentaire, etc.)
            $table->text('notes')->nullable();

            // Soft-delete manuel (même pattern que lettres_de_change / offices)
            $table->timestamp('supprime_le')->nullable();

            $table->timestamps();

            // Index pour les recherches fréquentes
            $table->index('type');
            $table->index('genre');
            $table->index('date_parution');
            $table->index('stock_physique');
            $table->index('supprime_le');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};
