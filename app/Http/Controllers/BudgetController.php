<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * BudgetController — Gestion des budgets mensuels.
 *
 * Seuls les gérants et admins peuvent créer, modifier et supprimer des budgets.
 * Les employés peuvent uniquement consulter (lecture seule).
 *
 * Le controller délègue la vérification de permission à la méthode
 * peutFaire() du modèle User, centralisée dans app/Models/User.php.
 */
class BudgetController extends Controller
{
    // =========================================================================
    // LECTURE
    // =========================================================================

    /**
     * Affiche la page principale des budgets.
     *
     * On filtre par année (querystring ?annee=2026) et optionnellement par mois.
     * Les budgets sont groupés par mois pour faciliter l'affichage tableau.
     *
     * @param  Request  $request  Peut contenir 'annee' (int) et 'mois' (int|null)
     * @return Response           Page Inertia 'Budget/Index'
     */
    public function index(Request $request): Response
    {
        // --- Paramètres de filtre ---
        // Si aucune année n'est fournie dans l'URL, on prend l'année courante
        $annee = (int) $request->query('annee', now()->year);
        $mois  = $request->query('mois') ? (int) $request->query('mois') : null;

        // --- Récupération des budgets ---
        // On utilise le scope annee() défini dans Budget.php
        $query = Budget::annee($annee)->orderBy('mois')->orderBy('categorie');

        // Si un mois précis est demandé, on filtre davantage
        if ($mois !== null) {
            $query->where('mois', $mois);
        }

        $budgets = $query->get();

        // --- Groupement par mois ---
        // Transforme la collection plate en un tableau indexé par numéro de mois :
        // [ 1 => Collection([budget1, budget2...]), 2 => Collection([...]), ... ]
        $parMois = $budgets->groupBy('mois');

        // --- Calcul des totaux par mois ---
        // Pour chaque mois, on calcule le total prévu, le total réel et l'écart global
        $totauxParMois = $parMois->map(function ($budgetsDuMois) {
            $totalPrevu = $budgetsDuMois->sum('montant_prevu');
            $totalReel  = $budgetsDuMois->whereNotNull('montant_reel')->sum('montant_reel');

            // L'écart n'a de sens que si au moins un montant réel est renseigné
            $aDesReels = $budgetsDuMois->whereNotNull('montant_reel')->isNotEmpty();
            $ecart     = $aDesReels ? round($totalReel - $totalPrevu, 2) : null;

            return [
                'total_prevu' => round($totalPrevu, 2),
                'total_reel'  => $aDesReels ? round($totalReel, 2) : null,
                'ecart'       => $ecart,
            ];
        });

        // --- Liste des années disponibles ---
        // Permet de peupler le sélecteur d'année dans l'UI
        $anneesDisponibles = Budget::select('annee')
            ->distinct()
            ->orderBy('annee', 'desc')
            ->pluck('annee');

        // --- Permission de modification ---
        // true si gérant ou admin, false si employé (lecture seule)
        $peutModifier = auth()->user()->peutFaire('modifier_budget');

        return Inertia::render('Budget/Index', [
            // Collection groupée — chaque clé est un numéro de mois (1–12)
            'budgets_par_mois'    => $parMois,
            // Année actuellement affichée
            'annee_selectionnee'  => $annee,
            // Années pour lesquelles il existe des données en BDD
            'annees_disponibles'  => $anneesDisponibles,
            // Totaux calculés côté serveur pour chaque mois
            'totaux_par_mois'     => $totauxParMois,
            // Indique si l'utilisateur connecté peut créer/modifier/supprimer
            'peut_modifier'       => $peutModifier,
        ]);
    }

    // =========================================================================
    // CRÉATION / MISE À JOUR COMPLÈTE (upsert)
    // =========================================================================

    /**
     * Crée ou met à jour une ligne budgétaire.
     *
     * On utilise updateOrCreate() avec les 3 champs d'unicité (annee + mois + categorie).
     * Si une ligne avec cette combinaison existe déjà, elle est mise à jour.
     * Sinon, une nouvelle ligne est créée.
     *
     * Réservé aux gérants et admins.
     *
     * @param  Request      $request  Corps JSON : annee, mois, categorie, montant_prevu, ...
     * @return JsonResponse           { success: true, budget: {...} } ou 403
     */
    public function store(Request $request): JsonResponse
    {
        // --- Vérification de la permission ---
        // Seuls les gérants/admins peuvent modifier les budgets
        if (! auth()->user()->peutFaire('modifier_budget')) {
            return response()->json(['error' => 'Non autorisé.'], 403);
        }

        // --- Validation des données reçues ---
        $donnees = $request->validate([
            'annee'          => ['required', 'integer', 'min:2020', 'max:2030'],
            'mois'           => ['required', 'integer', 'between:1,12'],
            'categorie'      => ['required', 'string', 'max:100'],
            'montant_prevu'  => ['required', 'numeric', 'min:0'],
            // Le montant réel est optionnel : on le renseigne en fin de période
            'montant_reel'   => ['nullable', 'numeric', 'min:0'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ]);

        // --- Upsert : update si existe, create sinon ---
        // Les 3 premiers arguments = clés d'unicité
        // Le 4ème = champs à mettre à jour ou à remplir lors de la création
        $budget = Budget::updateOrCreate(
            [
                'annee'     => $donnees['annee'],
                'mois'      => $donnees['mois'],
                'categorie' => $donnees['categorie'],
            ],
            [
                'montant_prevu' => $donnees['montant_prevu'],
                'montant_reel'  => $donnees['montant_reel'] ?? null,
                'notes'         => $donnees['notes'] ?? null,
                // On enregistre quel utilisateur a créé/modifié cette ligne
                'cree_par'      => auth()->id(),
            ]
        );

        return response()->json([
            'success' => true,
            'budget'  => $budget,
        ]);
    }

    // =========================================================================
    // MISE À JOUR PARTIELLE (montant_reel + notes)
    // =========================================================================

    /**
     * Met à jour un budget existant (principalement le montant réel et les notes).
     *
     * Route model binding : Laravel injecte automatiquement l'instance Budget
     * correspondant à l'id passé dans l'URL, ou retourne 404 si introuvable.
     *
     * @param  Request      $request  Corps JSON : montant_prevu, montant_reel, notes
     * @param  Budget       $budget   Instance récupérée via route model binding
     * @return JsonResponse           { success: true, budget: {...} } ou 403
     */
    public function update(Request $request, Budget $budget): JsonResponse
    {
        // --- Vérification de la permission ---
        if (! auth()->user()->peutFaire('modifier_budget')) {
            return response()->json(['error' => 'Non autorisé.'], 403);
        }

        // --- Validation ---
        $donnees = $request->validate([
            'montant_prevu' => ['required', 'numeric', 'min:0'],
            // nullable : le réel peut être effacé si on veut réinitialiser
            'montant_reel'  => ['nullable', 'numeric', 'min:0'],
            'notes'         => ['nullable', 'string', 'max:500'],
        ]);

        // --- Mise à jour ---
        $budget->update($donnees);

        // fresh() recharge l'instance depuis la BDD pour s'assurer que les
        // accesseurs calculés (ecart, ecart_pourcent) sont bien à jour
        return response()->json([
            'success' => true,
            'budget'  => $budget->fresh(),
        ]);
    }

    // =========================================================================
    // SUPPRESSION
    // =========================================================================

    /**
     * Supprime définitivement un budget.
     *
     * Contrairement aux LCR et offices, les budgets n'ont pas de corbeille :
     * un budget supprimé n'a pas de sens à conserver dans un historique de corbeille.
     *
     * @param  Budget       $budget  Instance récupérée via route model binding
     * @return JsonResponse          { success: true } ou 403
     */
    public function destroy(Budget $budget): JsonResponse
    {
        // --- Vérification de la permission ---
        if (! auth()->user()->peutFaire('modifier_budget')) {
            return response()->json(['error' => 'Non autorisé.'], 403);
        }

        // Suppression définitive (pas de soft-delete sur les budgets)
        $budget->delete();

        return response()->json(['success' => true]);
    }
}
