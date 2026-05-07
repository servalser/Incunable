<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Création automatique des comptes par défaut.
        // Le try/catch évite que l'app plante si MySQL n'est pas encore joignable.
        try {
            $this->creerComptesParDefaut();
        } catch (\Throwable) {
            // MySQL indisponible au boot — les comptes seront créés à la prochaine requête
        }
    }

    private function creerComptesParDefaut(): void
    {
        $comptes = [
            [
                'email'    => 'mehdiaayyadi@gmail.com',
                'nom'      => 'Mehdi',
                'password' => Hash::make('ouiouioui'),
                'role'     => 'admin',
            ],
            [
                'email'    => 'admin@incunable.local',
                'nom'      => 'Administrateur',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
            ],
        ];

        foreach ($comptes as $compte) {
            User::firstOrCreate(
                ['email' => $compte['email']],
                array_merge($compte, ['actif' => true])
            );
        }
    }
}
