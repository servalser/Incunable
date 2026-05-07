<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | IA — provider et modèle
    |--------------------------------------------------------------------------
    | AI_PROVIDER=groq   → utilise l'API cloud Groq (rapide, gratuit jusqu'à 30 req/min)
    | AI_PROVIDER=ollama → utilise Ollama en local (données 100 % sur la machine)
    |
    | Pour Groq : créer un compte sur https://console.groq.com → API Keys
    | et coller la clé dans GROQ_API_KEY dans le .env.
    */
    'ai' => [
        'provider' => env('AI_PROVIDER', 'ollama'),
    ],

    'groq' => [
        'url'   => 'https://api.groq.com/openai/v1',
        'key'   => env('GROQ_API_KEY'),
        /* llama-3.3-70b-versatile = meilleur modèle gratuit Groq (70 B param).
           Groq ne propose pas qwen2.5:7b dans son catalogue.
           llama-3.3-70b est nettement plus puissant (70 B vs 7 B). */
        'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
    ],

    'ollama' => [
        'url'   => env('OLLAMA_URL', 'http://localhost:11434'),
        'model' => env('OLLAMA_MODEL', 'qwen2.5:7b'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Webhooks entrants
    |--------------------------------------------------------------------------
    | WEBHOOK_SECRET_LIBRISOFT = clé secrète partagée avec ETL4hub.
    | ETL4hub signe chaque requête en HMAC-SHA256 avec cette clé.
    | Laisser vide en développement (signature non vérifiée).
    */
    'webhook' => [
        'librisoft_secret' => env('WEBHOOK_SECRET_LIBRISOFT'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Books API
    |--------------------------------------------------------------------------
    | Utilisée pour la recherche de livres par ISBN, titre ou auteur.
    | Gratuite sans clé API pour des volumes faibles (≤ 1 000 req/jour).
    | Si vous avez besoin de plus de requêtes, créez une clé dans Google Cloud
    | Console et renseignez GOOGLE_BOOKS_API_KEY dans le .env.
    */
    'google_books' => [
        'url' => 'https://www.googleapis.com/books/v1',
        'key' => env('GOOGLE_BOOKS_API_KEY'),   // optionnel — laissez vide pour l'usage basique
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
