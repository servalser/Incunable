<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Inertia middleware sur toutes les requêtes web
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        // Redirige les visiteurs non connectés vers /login
        $middleware->redirectGuestsTo('/login');

        // Les webhooks arrivent de services externes (ETL4hub, Librisoft…) :
        // ils n'ont pas de session Laravel, donc pas de jeton CSRF.
        // On exclut explicitement leur préfixe de la vérification CSRF.
        $middleware->validateCsrfTokens(except: [
            '/webhooks/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
