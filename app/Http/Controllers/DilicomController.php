<?php

namespace App\Http\Controllers;

use App\Models\Configuration;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DilicomController — page de recherche et d'enrichissement du catalogue.
 *
 * Deux sources de données, selon la configuration :
 *
 *   1. Google Books API (gratuit, par défaut)
 *      Permet de rechercher un livre par ISBN, titre ou auteur
 *      et de pré-remplir une fiche produit.
 *      Aucune clé API requise pour les recherches de base.
 *
 *   2. LibriWeb / Librisoft (optionnel, nécessite un abonnement)
 *      Si activé dans Configuration > Intégrations, permet de synchroniser
 *      le catalogue directement depuis le logiciel de caisse Librisoft.
 *
 * Note : Le vrai FEL (Fichier Exhaustif du Livre de Dilicom) nécessite
 * un abonnement professionnel. Pour les librairies qui en disposent,
 * le champ `libriweb_url` peut pointer vers leur espace FEL.
 */
class DilicomController extends Controller
{
    // ── Page principale ──────────────────────────────────────────────────────

    public function index(): Response
    {
        $config = Configuration::get();

        return Inertia::render('Dilicom', [
            // On expose uniquement les infos nécessaires côté React
            // (pas la clé API — elle ne doit pas partir dans le HTML)
            'libriweb_actif' => (bool) $config->libriweb_actif,
            'nom_librairie'  => $config->nom_librairie ?? 'Incunable',
        ]);
    }

    // ── Recherche Google Books ────────────────────────────────────────────────

    /**
     * Recherche dans Google Books par ISBN, titre ou auteur.
     *
     * Appelé en AJAX depuis la page Dilicom (pas de rechargement de page).
     * Retourne un JSON avec la liste des livres trouvés.
     *
     * Paramètres GET :
     *   q     : terme de recherche (ISBN, titre, auteur)
     *   lang  : restriction de langue (défaut : fr) — "all" pour tout
     */
    public function rechercher(Request $request): JsonResponse
    {
        $q    = trim($request->input('q', ''));
        $lang = $request->input('lang', 'fr');

        if (strlen($q) < 2) {
            return response()->json(['livres' => []]);
        }

        // Détection automatique : si la saisie ressemble à un ISBN (chiffres + tirets)
        // on préfixe avec isbn: pour une recherche précise
        $estIsbn  = preg_match('/^[\d\-\s]{9,17}$/', $q);
        $isbn     = preg_replace('/[\s\-]/', '', $q);
        $requete  = $estIsbn ? "isbn:{$isbn}" : $q;

        try {
            $params = [
                'q'          => $requete,
                'maxResults' => 12,
                'printType'  => 'books',
                'fields'     => 'items(id,volumeInfo(title,subtitle,authors,publisher,publishedDate,categories,description,pageCount,language,imageLinks,industryIdentifiers))',
            ];

            // Restriction de langue pour les recherches par titre/auteur
            if ($lang !== 'all' && ! $estIsbn) {
                $params['langRestrict'] = $lang;
            }

            $reponse = Http::timeout(8)->get('https://www.googleapis.com/books/v1/volumes', $params);

            // Pour les ISBN, si rien trouvé en français → réessayer sans restriction
            if (($reponse->failed() || empty($reponse->json('items'))) && $estIsbn) {
                unset($params['langRestrict']);
                $reponse = Http::timeout(8)->get('https://www.googleapis.com/books/v1/volumes', $params);
            }

            if ($reponse->failed() || empty($reponse->json('items'))) {
                return response()->json(['livres' => []]);
            }

            $livres = collect($reponse->json('items'))->map(function ($item) {
                $info = $item['volumeInfo'] ?? [];

                // Normalisation de la date : "YYYY" → "YYYY-01-01"
                $dateRaw     = $info['publishedDate'] ?? null;
                $dateParution = $dateRaw
                    ? (preg_match('/^\d{4}$/', $dateRaw) ? "{$dateRaw}-01-01" : $dateRaw)
                    : null;

                // Extraction des identifiants ISBN-13 et ISBN-10
                $isbn13 = null;
                $isbn10 = null;
                foreach ($info['industryIdentifiers'] ?? [] as $id) {
                    if ($id['type'] === 'ISBN_13') $isbn13 = $id['identifier'];
                    if ($id['type'] === 'ISBN_10') $isbn10 = $id['identifier'];
                }

                // URL de couverture : on utilise 'thumbnail' (petite) ou 'smallThumbnail'
                $couverture = $info['imageLinks']['thumbnail']
                    ?? $info['imageLinks']['smallThumbnail']
                    ?? null;
                // Google Books retourne HTTP — forcer HTTPS pour les navigateurs modernes
                if ($couverture) {
                    $couverture = str_replace('http://', 'https://', $couverture);
                    // Supprimer le paramètre zoom pour avoir une meilleure qualité
                    $couverture = str_replace('&edge=curl', '', $couverture);
                }

                return [
                    'google_id'     => $item['id'] ?? null,
                    'titre'         => $info['title'] ?? null,
                    'sous_titre'    => $info['subtitle'] ?? null,
                    'auteur'        => implode(', ', $info['authors'] ?? []) ?: null,
                    'editeur'       => $info['publisher'] ?? null,
                    'date_parution' => $dateParution,
                    'annee'         => $dateRaw ? substr($dateRaw, 0, 4) : null,
                    'genre'         => $info['categories'][0] ?? null,
                    'description'   => mb_substr($info['description'] ?? '', 0, 400),
                    'ean'           => $isbn13,
                    'isbn10'        => $isbn10,
                    'pages'         => $info['pageCount'] ?? null,
                    'langue'        => $info['language'] ?? null,
                    'couverture'    => $couverture,
                    // Indique si ce livre est déjà dans le stock
                    'deja_importe'  => $isbn13 ? Produit::where('ean', $isbn13)->exists() : false,
                ];
            })->values();

            return response()->json(['livres' => $livres]);

        } catch (\Exception $e) {
            return response()->json([
                'livres'  => [],
                'erreur'  => 'Service Google Books temporairement indisponible.',
            ]);
        }
    }

    // ── Import direct vers le stock ──────────────────────────────────────────

    /**
     * Crée un produit dans le stock à partir des données Google Books.
     *
     * Appelé en AJAX depuis la page Dilicom via un bouton "Ajouter au stock".
     * Le livre est créé avec stock = 0 et prix = 0 — l'utilisateur devra
     * compléter ces informations dans la fiche produit.
     */
    public function importer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titre'         => ['required', 'string', 'max:500'],
            'auteur'        => ['nullable', 'string', 'max:255'],
            'editeur'       => ['nullable', 'string', 'max:255'],
            'ean'           => ['nullable', 'string', 'max:20'],
            'date_parution' => ['nullable', 'date'],
            'genre'         => ['nullable', 'string', 'max:100'],
        ]);

        // Vérifier si le livre existe déjà (par EAN)
        if (! empty($data['ean'])) {
            $existant = Produit::where('ean', $data['ean'])->first();
            if ($existant) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'Ce livre est déjà dans votre stock.',
                    'produit_id' => $existant->id,
                ]);
            }
        }

        // Création de la fiche produit — stock et prix à compléter manuellement
        $produit = Produit::create([
            'reference'      => Produit::genererReference(),
            'titre'          => $data['titre'],
            'auteur'         => $data['auteur']        ?? null,
            'editeur'        => $data['editeur']       ?? null,
            'ean'            => $data['ean']           ?? null,
            'date_parution'  => $data['date_parution'] ?? null,
            'genre'          => $data['genre']         ?? null,
            'type'           => 'livre',
            'stock_physique' => 0,
            'prix_ttc'       => 0,
        ]);

        return response()->json([
            'success'    => true,
            'message'    => 'Livre ajouté au stock. Renseignez le prix et le stock.',
            'produit_id' => $produit->id,
            'reference'  => $produit->reference,
        ]);
    }
}
