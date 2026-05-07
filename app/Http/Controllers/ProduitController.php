<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use App\Models\MouvementStock;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ProduitController
 *
 * Gère le catalogue de produits de la librairie (livres et goodies).
 *
 * Responsabilités :
 *  - Afficher la liste filtrée avec KPIs (index)
 *  - Créer / modifier / supprimer un produit (create, store, edit, update, destroy)
 *  - Enregistrer des mouvements de stock (mouvement)
 *  - Rechercher un livre par ISBN via l'API Google Books (lookupIsbn)
 */
class ProduitController extends Controller
{
    // ── Liste du catalogue ────────────────────────────────────────────────────

    /**
     * Affiche la liste paginée des produits avec filtres et statistiques.
     *
     * Query strings acceptés :
     *   ?q=tolkien          → recherche texte (titre, auteur, EAN, référence)
     *   ?type=livre         → filtre par type (livre | goodie | all)
     *   ?statut=alerte      → filtre par état du stock (alerte | rupture | nouveaute | all)
     */
    public function index(Request $request): Response
    {
        // --- Lecture des filtres depuis l'URL ---
        $q      = $request->input('q');
        $type   = $request->input('type', 'all');
        $statut = $request->input('statut', 'all');

        // --- Lecture de la configuration globale (singleton) ---
        $config = Configuration::get();

        // Seuil d'alerte global (défaut : 2 si colonne absente ou null)
        $seuilGlobal = $config->seuil_alerte_stock_global ?? 2;

        // Délai en semaines pour considérer une parution comme "nouveauté" (défaut : 8)
        $delaiNouveautes = $config->delai_nouveautes_semaines ?? 8;

        // --- Construction de la requête de base ---
        $query = Produit::actif()
            ->recherche($q);                // scope : LIKE sur titre/auteur/ean/référence

        // --- Filtre par type de produit ---
        if ($type === 'livre') {
            $query->livres();
        } elseif ($type === 'goodie') {
            $query->goodies();
        }
        // Si $type === 'all' (ou toute autre valeur), on ne filtre pas

        // --- Filtre par statut de stock ---
        if ($statut === 'alerte') {
            // Produits dont le stock est inférieur ou égal au seuil d'alerte.
            // COALESCE() utilise d'abord le seuil propre au produit,
            // sinon bascule sur le seuil global de la configuration.
            $query->whereRaw(
                'stock_physique <= COALESCE(seuil_alerte, (SELECT seuil_alerte_stock_global FROM configuration WHERE id = 1))'
            );
        } elseif ($statut === 'rupture') {
            // Rupture = stock épuisé (≤ 0)
            $query->whereRaw('stock_physique <= 0');
        } elseif ($statut === 'nouveaute') {
            // Nouveauté = parution dans les N dernières semaines
            $query->whereRaw(
                'date_parution >= DATE_SUB(NOW(), INTERVAL ? WEEK)',
                [$delaiNouveautes]
            );
        }

        // --- Tri : les produits en alerte (stock faible) remontent en tête ---
        $produits = $query
            ->orderByRaw('stock_physique ASC')  // stock le plus bas en premier
            ->paginate(30)
            ->withQueryString();                // conserve les filtres dans les liens de pagination

        // --- Calcul des KPIs (statistiques globales, sans tenir compte des filtres) ---
        // On utilise des requêtes séparées sur Produit::actif() pour que les stats
        // reflètent toujours l'ensemble du catalogue, pas juste la page affichée.

        $total = Produit::actif()->count();

        // Produits en alerte : stock ≤ seuil d'alerte (propre ou global)
        $enAlerte = Produit::actif()
            ->whereRaw(
                'stock_physique <= COALESCE(seuil_alerte, (SELECT seuil_alerte_stock_global FROM configuration WHERE id = 1))'
            )
            ->count();

        // Produits en rupture : stock épuisé
        $enRupture = Produit::actif()
            ->whereRaw('stock_physique <= 0')
            ->count();

        // Nouveautés : parution récente
        $nbNouveautes = Produit::actif()
            ->whereRaw('date_parution >= DATE_SUB(NOW(), INTERVAL ? WEEK)', [$delaiNouveautes])
            ->count();

        // Valeur totale du stock : somme de (stock_physique × prix_ttc) pour chaque produit.
        // COALESCE(prix_ttc, 0) évite que les NULL cassent la somme.
        $valeurStockTotal = Produit::actif()
            ->selectRaw('SUM(stock_physique * COALESCE(prix_ttc, 0)) as valeur')
            ->value('valeur') ?? 0;

        return Inertia::render('Stock/Index', [
            'produits' => $produits,

            // Filtres actifs — transmis à React pour pré-remplir les champs de recherche
            'filters' => [
                'q'      => $q,
                'type'   => $type,
                'statut' => $statut,
            ],

            // Valeurs de configuration utiles côté React (ex : afficher le seuil dans l'UI)
            'config' => [
                'seuil_alerte_stock_global'  => $seuilGlobal,
                'delai_nouveautes_semaines'  => $delaiNouveautes,
            ],

            // Statistiques pour les cartes KPI en haut de page
            'stats' => [
                'total'              => $total,
                'en_alerte'          => $enAlerte,
                'en_rupture'         => $enRupture,
                'nb_nouveautes'      => $nbNouveautes,
                'valeur_stock_total' => round((float) $valeurStockTotal, 2),
            ],
        ]);
    }

    // ── Formulaire de création ────────────────────────────────────────────────

    /**
     * Affiche le formulaire vide pour créer un nouveau produit.
     *
     * On passe `produit => null` pour que la page React sache qu'elle est
     * en mode "création" et non en mode "édition".
     */
    public function create(): Response
    {
        return Inertia::render('Stock/Form', [
            'produit' => null,
            'mode'    => 'create',
        ]);
    }

    // ── Enregistrement d'un nouveau produit ──────────────────────────────────

    /**
     * Valide et persiste un nouveau produit en base.
     *
     * Si un stock initial est fourni (> 0), on crée également un premier
     * mouvement de stock de type "entrée" pour tracer l'origine du stock.
     */
    public function store(Request $request): RedirectResponse
    {
        // --- Validation des données du formulaire ---
        $data = $request->validate([
            'titre'         => ['required', 'string', 'max:255'],
            'ean'           => ['nullable', 'string', 'max:20', 'unique:produits,ean'],
            'type'          => ['required', 'in:livre,goodie'],
            'genre'         => ['nullable', 'string', 'max:100'],
            'prix_ttc'      => ['nullable', 'numeric', 'min:0'],
            'date_parution' => ['nullable', 'date'],
            'stock_initial' => ['nullable', 'integer', 'min:0'],   // quantité de départ
            'seuil_alerte'  => ['nullable', 'integer', 'min:0'],
            'notes'         => ['nullable', 'string', 'max:1000'],
        ]);

        // Le stock initial (si non fourni, on part à 0)
        $stockInitial = (int) ($data['stock_initial'] ?? 0);

        // --- Création du produit ---
        $produit = Produit::create([
            'reference'      => Produit::genererReference(),   // ex : PRD-2026-0001
            'titre'          => $data['titre'],
            'ean'            => $data['ean'] ?? null,
            'type'           => $data['type'],
            'genre'          => $data['genre'] ?? null,
            'prix_ttc'       => $data['prix_ttc'] ?? null,
            'date_parution'  => $data['date_parution'] ?? null,
            'stock_physique' => $stockInitial,                 // stock de départ
            'seuil_alerte'   => $data['seuil_alerte'] ?? null,
            'notes'          => $data['notes'] ?? null,
        ]);

        // --- Traçabilité : mouvement de stock initial ---
        // Si le produit commence avec du stock, on trace une entrée pour
        // conserver l'historique complet dès la création.
        if ($stockInitial > 0) {
            MouvementStock::create([
                'produit_id'  => $produit->id,
                'user_id'     => auth()->id(),
                'type'        => 'entree',
                'quantite'    => $stockInitial,
                'stock_apres' => $stockInitial,   // stock après = stock initial
                'motif'       => 'Stock initial',
                'source'      => 'manuel',
            ]);
        }

        return redirect()->route('stock.index')
            ->with('success', 'Produit ajouté.');
    }

    // ── Formulaire d'édition ──────────────────────────────────────────────────

    /**
     * Affiche le formulaire pré-rempli pour modifier un produit existant.
     *
     * Laravel résout automatiquement le modèle Produit via son id (route model binding).
     * Le mode 'edit' permet à la page React d'adapter son comportement.
     */
    public function edit(Produit $produit): Response
    {
        return Inertia::render('Stock/Form', [
            'produit' => $produit,
            'mode'    => 'edit',
        ]);
    }

    // ── Mise à jour d'un produit ──────────────────────────────────────────────

    /**
     * Valide et met à jour les informations d'un produit.
     *
     * Note : on ne modifie PAS le stock_physique ici — les variations de stock
     * passent obligatoirement par la méthode `mouvement()` pour conserver
     * un historique complet.
     */
    public function update(Request $request, Produit $produit): RedirectResponse
    {
        // --- Validation (même règles que store, sauf stock_initial absent) ---
        // Pour l'EAN : unique sauf pour CE produit (on s'exclut soi-même)
        $data = $request->validate([
            'titre'         => ['required', 'string', 'max:255'],
            'ean'           => ['nullable', 'string', 'max:20', "unique:produits,ean,{$produit->id}"],
            'type'          => ['required', 'in:livre,goodie'],
            'genre'         => ['nullable', 'string', 'max:100'],
            'prix_ttc'      => ['nullable', 'numeric', 'min:0'],
            'date_parution' => ['nullable', 'date'],
            'seuil_alerte'  => ['nullable', 'integer', 'min:0'],
            'notes'         => ['nullable', 'string', 'max:1000'],
        ]);

        $produit->update($data);

        return redirect()->back()
            ->with('success', 'Produit mis à jour.');
    }

    // ── Suppression (soft-delete) ─────────────────────────────────────────────

    /**
     * Place le produit dans la corbeille (soft-delete manuel).
     *
     * On remplit `supprime_le` avec la date/heure courante plutôt que de
     * supprimer définitivement l'enregistrement, ce qui permet de le restaurer.
     */
    public function destroy(Produit $produit): RedirectResponse
    {
        $produit->update(['supprime_le' => now()]);

        return redirect()->route('stock.index')
            ->with('success', 'Produit déplacé en corbeille.');
    }

    // ── Mouvement de stock ────────────────────────────────────────────────────

    /**
     * Enregistre une variation de stock pour un produit.
     *
     * Trois types de mouvements :
     *  - entree     → on reçoit de la marchandise (+quantite)
     *  - sortie     → on vend ou retire du stock (-quantite)
     *  - ajustement → correction d'inventaire (delta positif ou négatif)
     */
    public function mouvement(Request $request, Produit $produit): RedirectResponse
    {
        // --- Validation ---
        // Pour l'ajustement, la quantité peut être négative (ex : on corrige -3)
        // Pour entree/sortie, elle est forcément positive (min:1)
        $data = $request->validate([
            'type'     => ['required', 'in:entree,sortie,ajustement'],
            'quantite' => ['required', 'integer'],   // pas de min ici : l'ajustement peut être négatif
            'motif'    => ['nullable', 'string', 'max:255'],
        ]);

        // Validation secondaire : entree et sortie exigent une quantité ≥ 1
        if (in_array($data['type'], ['entree', 'sortie'])) {
            $request->validate([
                'quantite' => ['min:1'],
            ]);
        }

        $quantite = (int) $data['quantite'];

        // --- Calcul du nouveau stock selon le type de mouvement ---
        $nouveauStock = match ($data['type']) {
            'entree'     => $produit->stock_physique + $quantite,   // réception de stock
            'sortie'     => $produit->stock_physique - $quantite,   // retrait de stock
            'ajustement' => $produit->stock_physique + $quantite,   // delta (peut être négatif)
        };

        // --- Mise à jour du stock du produit ---
        $produit->update(['stock_physique' => $nouveauStock]);

        // --- Création du mouvement pour l'historique ---
        MouvementStock::create([
            'produit_id'  => $produit->id,
            'user_id'     => auth()->id(),
            'type'        => $data['type'],
            'quantite'    => $quantite,
            'stock_apres' => $nouveauStock,          // stock résultant (utile pour l'historique)
            'motif'       => $data['motif'] ?? null,
            'source'      => 'manuel',
        ]);

        return redirect()->back()
            ->with('success', 'Mouvement enregistré.');
    }

    // ── Recherche ISBN via Google Books ───────────────────────────────────────

    /**
     * Recherche les informations d'un livre à partir de son ISBN.
     *
     * Utilise l'API Google Books (gratuite, sans clé API).
     * URL : https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}
     *
     * Retourne un JSON avec les métadonnées trouvées, ou {"found": false}
     * si aucun résultat ou en cas d'erreur réseau.
     *
     * Cette route est appelée en AJAX depuis le formulaire de création
     * pour pré-remplir automatiquement les champs du livre.
     */
    public function lookupIsbn(Request $request): JsonResponse
    {
        // --- Validation de l'ISBN ---
        $request->validate([
            'isbn' => ['required', 'string', 'max:20'],
        ]);

        // Nettoyage : l'ISBN peut être saisi avec des tirets ou espaces (ex : 978-2-07-036024-5)
        $isbn = preg_replace('/[\s\-]/', '', $request->input('isbn'));

        try {
            // --- Appel à l'API Google Books ---
            // On utilise le client HTTP de Laravel (basé sur Guzzle)
            $reponse = Http::timeout(8)   // timeout de 8 secondes pour ne pas bloquer l'UI
                ->get('https://www.googleapis.com/books/v1/volumes', [
                    'q' => "isbn:{$isbn}",
                ]);

            // Si la requête HTTP a échoué (code 4xx ou 5xx), on retourne "non trouvé"
            if ($reponse->failed()) {
                return response()->json(['found' => false]);
            }

            $corps = $reponse->json();

            // Vérification qu'il y a au moins un résultat dans la réponse
            if (empty($corps['items'][0]['volumeInfo'])) {
                return response()->json(['found' => false]);
            }

            // --- Extraction des informations du premier résultat ---
            $info = $corps['items'][0]['volumeInfo'];

            // La date de parution peut être au format "YYYY-MM-DD" ou juste "YYYY"
            // On normalise : si c'est juste une année, on ajoute "-01-01"
            $dateParution = null;
            if (!empty($info['publishedDate'])) {
                $dateRaw = $info['publishedDate'];
                // Si le format est uniquement une année (4 chiffres)
                $dateParution = preg_match('/^\d{4}$/', $dateRaw)
                    ? $dateRaw . '-01-01'
                    : $dateRaw;
            }

            return response()->json([
                'found'         => true,
                'titre'         => $info['title'] ?? null,
                'auteur'        => $info['authors'][0] ?? null,      // premier auteur uniquement
                'editeur'       => $info['publisher'] ?? null,
                'date_parution' => $dateParution,
                'genre'         => $info['categories'][0] ?? null,   // première catégorie si présente
            ]);

        } catch (\Exception $e) {
            // En cas d'erreur réseau ou d'exception inattendue, on retourne
            // "non trouvé" sans planter l'application.
            // L'utilisateur pourra saisir les informations manuellement.
            return response()->json(['found' => false]);
        }
    }
}
