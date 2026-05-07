<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConfigurationController extends Controller
{
    public function index(): Response
    {
        // Seul l'admin peut accéder à la configuration
        abort_unless(auth()->user()->role === 'admin', 403);

        return Inertia::render('Configuration', [
            'config' => Configuration::get(),
        ]);
    }

    public function update(Request $request)
    {
        abort_unless(auth()->user()->role === 'admin', 403);

        $data = $request->validate([
            'nom_librairie'              => ['required', 'string', 'max:100'],
            'siret'                      => ['nullable', 'string', 'max:20'],
            'email'                      => ['nullable', 'email', 'max:150'],
            'telephone'                  => ['nullable', 'string', 'max:30'],
            'adresse'                    => ['nullable', 'string', 'max:500'],
            'delai_commandes_mois'       => ['required', 'integer', 'min:1', 'max:24'],
            'delai_offices_mois'         => ['required', 'integer', 'min:1', 'max:24'],
            // Seuils de stock et nouveautés
            'seuil_alerte_stock_global'  => ['required', 'integer', 'min:0', 'max:999'],
            'delai_nouveautes_semaines'  => ['required', 'integer', 'min:1', 'max:52'],
            // Intégration LibriWeb
            'libriweb_actif'             => ['boolean'],
            'libriweb_url'               => ['nullable', 'url', 'max:255'],
            'libriweb_client_id'         => ['nullable', 'string', 'max:100'],
            'libriweb_api_key'           => ['nullable', 'string', 'max:255'],
            // Alertes email
            'alerte_7j'               => ['boolean'],
            'alerte_1j'               => ['boolean'],
            'alerte_retard'           => ['boolean'],
            'alerte_retour_expiration'=> ['boolean'],
            'alerte_recap_hebdo'      => ['boolean'],
            // SMTP
            'smtp_host'               => ['nullable', 'string', 'max:100'],
            'smtp_port'               => ['nullable', 'integer'],
            'smtp_username'           => ['nullable', 'string', 'max:150'],
            'smtp_password'           => ['nullable', 'string', 'max:150'],
            'smtp_from_email'         => ['nullable', 'email', 'max:150'],
            'smtp_from_name'          => ['nullable', 'string', 'max:100'],
            'smtp_tls'                => ['boolean'],
            // Thème
            'theme_hue'               => ['required', 'integer', 'min:0', 'max:360'],
            'theme_sat'               => ['required', 'integer', 'min:0', 'max:100'],
            'theme_dark'              => ['boolean'],
        ]);

        Configuration::get()->update($data);

        return redirect()->route('configuration.index')
            ->with('success', 'Configuration enregistrée.');
    }
}
