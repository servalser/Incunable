<?php

namespace App\Http\Middleware;

use App\Models\Configuration;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /** Template Blade racine utilisé pour le premier rendu (full page). */
    protected $rootView = 'app';

    /** Versioning des assets pour forcer le rechargement en déploiement. */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Props partagées sur toutes les pages React.
     * Accessibles via usePage().props dans n'importe quel composant.
     */
    public function share(Request $request): array
    {
        $config = Configuration::get();

        return [
            ...parent::share($request),

            // Utilisateur connecté (null si non authentifié)
            'auth' => [
                'user' => $request->user() ? [
                    'id'         => $request->user()->id,
                    'nom'        => $request->user()->nom,
                    'email'      => $request->user()->email,
                    'role'       => $request->user()->role,
                    'role_label' => $request->user()->roleLabel(),
                    'est_gerant' => $request->user()->estGerant(),
                ] : null,
            ],

            // Flash messages (toasts) transmis via session
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],

            // Configuration globale (thème, nom librairie)
            'appConfig' => [
                'nom_librairie' => $config->nom_librairie ?? 'Incunable',
                'theme_hue'     => $config->theme_hue ?? 220,
                'theme_sat'     => $config->theme_sat ?? 60,
                'theme_dark'    => $config->theme_dark ?? false,
            ],
        ];
    }
}
