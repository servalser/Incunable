<?php

use App\Models\Configuration;

/**
 * Retourne une valeur de la table configuration.
 * Exemple : config_val('delai_commandes_mois', 3)
 */
if (!function_exists('config_val')) {
    function config_val(string $key, mixed $default = null): mixed
    {
        static $cfg = null;
        $cfg ??= Configuration::get();
        return $cfg?->$key ?? $default;
    }
}
