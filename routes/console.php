<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduler — tâches planifiées automatiques
|--------------------------------------------------------------------------
|
| Le scheduler Laravel nécessite une entrée dans le cron du serveur :
|   * * * * * php /chemin/vers/incunable/artisan schedule:run >> /dev/null 2>&1
|
| Sur Windows (développement), lancer manuellement :
|   php artisan schedule:work
|
*/

// ── Alertes e-mail quotidiennes ───────────────────────────────────────────────
// Envoie les alertes LCR et offices configurées dans Configuration > Alertes.
// Le récapitulatif hebdomadaire est envoyé uniquement le lundi.
Schedule::command('alertes:envoyer')
    ->dailyAt('08:00')           // Chaque matin à 8h — heure d'ouverture de la librairie
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/alertes-email.log'));

// ── Import automatique Librisoft ──────────────────────────────────────────────
// Cherche le CSV le plus récent dans storage/app/imports/librisoft/
// et l'importe si présent. ETL4hub peut y déposer le fichier via SFTP ou FTP.
Schedule::command('import:librisoft')
    ->dailyAt('02:00')          // Chaque nuit à 2h du matin
    ->withoutOverlapping()      // Ne pas lancer si le précédent tourne encore
    ->runInBackground()         // Ne bloque pas les autres tâches planifiées
    ->appendOutputTo(storage_path('logs/import-librisoft.log'));

// ── Nettoyage des archives d'import (> 90 jours) ─────────────────────────────
// Évite d'accumuler des CSV anciens sur le disque.
Schedule::call(function () {
    $archive = storage_path('app/imports/librisoft/archives');
    if (! is_dir($archive)) return;

    foreach (glob($archive . '/*.csv') as $fichier) {
        // Supprimer les fichiers de plus de 90 jours
        if (filemtime($fichier) < strtotime('-90 days')) {
            unlink($fichier);
            \Illuminate\Support\Facades\Log::info("Archive supprimée : " . basename($fichier));
        }
    }
})->monthly()->name('nettoyer-archives-librisoft');
