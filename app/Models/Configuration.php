<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuration extends Model
{
    protected $table = 'configuration';
    public $timestamps = false;

    protected $fillable = [
        'nom_librairie', 'siret', 'email', 'telephone', 'adresse',
        'delai_commandes_mois', 'delai_offices_mois',
        // Seuils de stock et durée nouveautés
        'seuil_alerte_stock_global', 'delai_nouveautes_semaines',
        // Intégration LibriWeb (optionnelle, activée par le client)
        'libriweb_actif', 'libriweb_url', 'libriweb_client_id', 'libriweb_api_key',
        // Benchmark réseau (opt-in — statistiques anonymisées partagées avec le réseau Incunable)
        'benchmark_actif', 'benchmark_token', 'benchmark_derniere_sync', 'benchmark_donnees',
        'alerte_7j', 'alerte_1j', 'alerte_retard',
        'alerte_retour_expiration', 'alerte_recap_hebdo',
        'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password',
        'smtp_from_email', 'smtp_from_name', 'smtp_tls',
        'theme_hue', 'theme_sat', 'theme_dark',
    ];

    protected function casts(): array
    {
        return [
            'libriweb_actif'          => 'boolean',
            'benchmark_actif'         => 'boolean',
            'benchmark_donnees'       => 'array',
            'benchmark_derniere_sync' => 'datetime',
            'alerte_7j'               => 'boolean',
            'alerte_1j'               => 'boolean',
            'alerte_retard'           => 'boolean',
            'alerte_retour_expiration'=> 'boolean',
            'alerte_recap_hebdo'      => 'boolean',
            'smtp_tls'                => 'boolean',
            'theme_dark'              => 'boolean',
        ];
    }

    /** Retourne la config unique (singleton). */
    public static function get(): self
    {
        return static::firstOrCreate(['id' => 1]);
    }
}
