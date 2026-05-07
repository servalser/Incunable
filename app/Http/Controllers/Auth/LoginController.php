<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    /** Affiche le formulaire de login. */
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /** Traite la tentative de connexion. */
    public function store(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Rate limiting : 5 tentatives par minute par IP + email
        $key = 'login:' . Str::lower($request->email) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->withErrors([
                'email' => "Trop de tentatives. Réessayez dans {$seconds} secondes.",
            ]);
        }

        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            RateLimiter::hit($key, 60 * 15); // 15 minutes

            return back()->withErrors([
                'email' => 'Identifiants incorrects. Vérifiez votre email et mot de passe.',
            ]);
        }

        RateLimiter::clear($key);

        // Mettre à jour derniere_connexion
        $request->user()->update(['derniere_connexion' => now(), 'tentatives_connexion' => 0]);

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    /** Déconnexion. */
    public function destroy(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
