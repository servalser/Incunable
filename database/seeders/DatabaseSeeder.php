<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ──────────────────────────────────────────────────────────────
        // Comptes utilisateurs
        // ──────────────────────────────────────────────────────────────
        $admin = \App\Models\User::firstOrCreate(
            ['email' => 'admin@incunable.local'],
            [
                'nom'      => 'Marie Dupont',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
                'actif'    => true,
            ]
        );

        // Compte gérant (accès complet + budgets)
        \App\Models\User::firstOrCreate(
            ['email' => 'gerant@incunable.local'],
            [
                'nom'      => 'Sophie Martin',
                'password' => Hash::make('gerant123'),
                'role'     => 'gérant',
                'actif'    => true,
            ]
        );

        // Compte employé (accès complet sauf modification des budgets)
        \App\Models\User::firstOrCreate(
            ['email' => 'employe@incunable.local'],
            [
                'nom'      => 'Lucas Bernard',
                'password' => Hash::make('employe123'),
                'role'     => 'employé',
                'actif'    => true,
            ]
        );

        // ──────────────────────────────────────────────────────────────
        // Configuration
        // ──────────────────────────────────────────────────────────────
        \App\Models\Configuration::updateOrCreate(
            ['id' => 1],
            [
                'nom_librairie'              => 'Librairie du Vieux Carré',
                'siret'                      => '48250261500025',
                'email'                      => 'contact@vieux-carre.fr',
                'telephone'                  => '04 67 58 12 34',
                'adresse'                    => "12 rue de la Loge\n34000 Montpellier",
                'delai_commandes_mois'       => 3,
                'delai_offices_mois'         => 2,
                'seuil_alerte_stock_global'  => 2,
                'delai_nouveautes_semaines'  => 8,
            ]
        );

        // ──────────────────────────────────────────────────────────────
        // Distributeurs
        // ──────────────────────────────────────────────────────────────
        $distributeurs = [
            ['nom' => 'Hachette Livre',        'email' => 'commandes@hachette.fr',   'delai_commandes_mois' => 3, 'delai_offices_mois' => 2, 'actif' => true],
            ['nom' => 'Gallimard Distribution', 'email' => 'offices@gallimard.fr',    'delai_commandes_mois' => null, 'delai_offices_mois' => 3, 'actif' => true],
            ['nom' => 'CDE / Sodis',            'email' => 'contact@sodis.fr',        'delai_commandes_mois' => 2, 'delai_offices_mois' => null, 'actif' => true],
            ['nom' => 'Interforum',             'email' => 'commandes@interforum.fr', 'delai_commandes_mois' => 4, 'delai_offices_mois' => 2, 'actif' => false],
            ['nom' => 'Volumen',                'email' => 'volumen@volumen.fr',      'delai_commandes_mois' => 3, 'delai_offices_mois' => 3, 'actif' => true],
        ];

        foreach ($distributeurs as $d) {
            \App\Models\Distributeur::firstOrCreate(['nom' => $d['nom']], $d);
        }

        $hachette  = \App\Models\Distributeur::where('nom', 'Hachette Livre')->first();
        $gallimard = \App\Models\Distributeur::where('nom', 'Gallimard Distribution')->first();
        $sodis     = \App\Models\Distributeur::where('nom', 'CDE / Sodis')->first();
        $volumen   = \App\Models\Distributeur::where('nom', 'Volumen')->first();

        // ──────────────────────────────────────────────────────────────
        // Lettres de change
        // ──────────────────────────────────────────────────────────────
        if (\App\Models\Lettre::count() === 0) {
            $lettres = [
                ['ref' => 'LCR-2025-0042', 'distrib' => $hachette,  'montant' => 3420.50, 'emission' => '2025-01-15', 'echeance' => '2025-04-15', 'statut' => 'en_retard'],
                ['ref' => 'LCR-2025-0043', 'distrib' => $gallimard, 'montant' => 1850.00, 'emission' => '2025-02-01', 'echeance' => '2025-05-01', 'statut' => 'en_attente'],
                ['ref' => 'LCR-2025-0041', 'distrib' => $hachette,  'montant' => 2100.80, 'emission' => '2025-01-01', 'echeance' => '2025-04-01', 'statut' => 'paye'],
                ['ref' => 'LCR-2025-0044', 'distrib' => $sodis,     'montant' => 4780.00, 'emission' => '2025-02-15', 'echeance' => '2025-05-15', 'statut' => 'en_attente'],
                ['ref' => 'LCR-2025-0040', 'distrib' => $volumen,   'montant' =>  920.00, 'emission' => '2024-12-01', 'echeance' => '2025-03-01', 'statut' => 'en_retard'],
                ['ref' => 'LCR-2025-0045', 'distrib' => $gallimard, 'montant' => 3100.00, 'emission' => '2025-03-01', 'echeance' => '2025-06-01', 'statut' => 'en_attente'],
                ['ref' => 'LCR-2025-0039', 'distrib' => $sodis,     'montant' => 1560.00, 'emission' => '2024-11-15', 'echeance' => '2025-02-15', 'statut' => 'paye'],
            ];

            foreach ($lettres as $l) {
                \App\Models\Lettre::create([
                    'reference'       => $l['ref'],
                    'distributeur_id' => $l['distrib']->id,
                    'cree_par'        => $admin->id,
                    'montant_ttc'     => $l['montant'],
                    'date_emission'   => $l['emission'],
                    'date_echeance'   => $l['echeance'],
                    'statut'          => $l['statut'],
                    'paye_le'         => $l['statut'] === 'paye' ? Carbon::now()->subDays(5) : null,
                ]);
            }
        }

        // ──────────────────────────────────────────────────────────────
        // Offices
        // ──────────────────────────────────────────────────────────────
        if (\App\Models\Office::count() === 0) {
            $offices = [
                ['ref' => 'OFF-2025-0018', 'distrib' => $hachette,  'type' => 'facon',       'montant' => 5200.00, 'retourne' => 0,       'reception' => '2025-01-10', 'retour_limite' => '2025-03-10', 'statut' => 'en_retard'],
                ['ref' => 'OFF-2025-0019', 'distrib' => $gallimard, 'type' => 'grille',      'montant' => 3800.00, 'retourne' => 0,       'reception' => '2025-02-20', 'retour_limite' => '2025-05-20', 'statut' => 'en_attente'],
                ['ref' => 'OFF-2025-0017', 'distrib' => $sodis,     'type' => 'facon',       'montant' => 2400.00, 'retourne' => 1200.00, 'reception' => '2025-01-05', 'retour_limite' => '2025-03-05', 'statut' => 'retour_partiel'],
                ['ref' => 'OFF-2025-0020', 'distrib' => $volumen,   'type' => 'exceptionnel','montant' => 1100.00, 'retourne' => 1100.00, 'reception' => '2025-02-01', 'retour_limite' => '2025-04-01', 'statut' => 'retourne'],
                ['ref' => 'OFF-2025-0021', 'distrib' => $hachette,  'type' => 'grille',      'montant' => 4600.00, 'retourne' => 0,       'reception' => '2024-12-15', 'retour_limite' => '2025-02-15', 'statut' => 'paye'],
            ];

            foreach ($offices as $o) {
                \App\Models\Office::create([
                    'reference'          => $o['ref'],
                    'distributeur_id'    => $o['distrib']->id,
                    'cree_par'           => $admin->id,
                    'type'               => $o['type'],
                    'montant_ttc'        => $o['montant'],
                    'montant_retourne'   => $o['retourne'],
                    'date_reception'     => $o['reception'],
                    'date_retour_limite' => $o['retour_limite'],
                    'statut'             => $o['statut'],
                ]);
            }
        }

        // ──────────────────────────────────────────────────────────────
        // Produits — catalogue de démonstration
        // ──────────────────────────────────────────────────────────────
        if (\App\Models\Produit::count() === 0) {
            $produits = [
                // Livres avec stock varié pour tester les alertes
                ['ean' => '9782070360024', 'titre' => 'Le Petit Prince',              'auteur' => 'Antoine de Saint-Exupéry', 'editeur' => 'Gallimard',        'type' => 'livre',  'genre' => 'Jeunesse',      'prix_ttc' => 7.50,  'stock' => 8,  'parution' => '1943-04-06'],
                ['ean' => '9782070413119', 'titre' => 'L\'Étranger',                  'auteur' => 'Albert Camus',             'editeur' => 'Gallimard',        'type' => 'livre',  'genre' => 'Roman',         'prix_ttc' => 7.20,  'stock' => 3,  'parution' => '1942-06-01'],
                ['ean' => '9782253004226', 'titre' => 'Germinal',                     'auteur' => 'Émile Zola',               'editeur' => 'Le Livre de Poche','type' => 'livre',  'genre' => 'Roman',         'prix_ttc' => 8.40,  'stock' => 1,  'parution' => '1885-01-01'], // alerte stock
                ['ean' => '9782072862014', 'titre' => 'Sérotonine',                   'auteur' => 'Michel Houellebecq',       'editeur' => 'Gallimard',        'type' => 'livre',  'genre' => 'Roman',         'prix_ttc' => 21.00, 'stock' => 0,  'parution' => '2019-01-04'], // rupture
                ['ean' => '9782207166680', 'titre' => 'Le Problème à trois corps',    'auteur' => 'Liu Cixin',                'editeur' => 'Denoël',           'type' => 'livre',  'genre' => 'Science-fiction','prix_ttc' => 22.90, 'stock' => 5,  'parution' => '2024-01-11'], // nouveauté (récente)
                ['ean' => '9782378901851', 'titre' => 'L\'Art de la joie',            'auteur' => 'Goliarda Sapienza',        'editeur' => 'Le Tripode',       'type' => 'livre',  'genre' => 'Roman',         'prix_ttc' => 24.00, 'stock' => 2,  'parution' => '2024-08-22'], // nouveauté
                ['ean' => '9782413050001', 'titre' => 'Astérix et le Griffon',        'auteur' => 'Fabcaro',                  'editeur' => 'Hachette',         'type' => 'livre',  'genre' => 'BD',            'prix_ttc' => 10.95, 'stock' => 12, 'parution' => '2021-10-21'],
                ['ean' => '9782070541270', 'titre' => 'Harry Potter à l\'école des sorciers', 'auteur' => 'J.K. Rowling',     'editeur' => 'Gallimard',        'type' => 'livre',  'genre' => 'Jeunesse',      'prix_ttc' => 8.90,  'stock' => 0,  'parution' => '1998-06-26'], // rupture + dormant

                // Goodies
                ['ean' => null, 'titre' => 'Marque-page brodé "Lire"',     'auteur' => null, 'editeur' => null, 'type' => 'goodie', 'genre' => 'Papeterie', 'prix_ttc' => 4.50, 'stock' => 20, 'parution' => null],
                ['ean' => null, 'titre' => 'Carnet A5 couverture kraft',   'auteur' => null, 'editeur' => null, 'type' => 'goodie', 'genre' => 'Papeterie', 'prix_ttc' => 8.90, 'stock' => 7,  'parution' => null],
                ['ean' => null, 'titre' => 'Tote bag "J\'aime les livres"','auteur' => null, 'editeur' => null, 'type' => 'goodie', 'genre' => 'Textile',   'prix_ttc' => 12.00,'stock' => 1,  'parution' => null], // alerte
                ['ean' => null, 'titre' => 'Stylo calligraphie set',       'auteur' => null, 'editeur' => null, 'type' => 'goodie', 'genre' => 'Papeterie', 'prix_ttc' => 15.90,'stock' => 3,  'parution' => null],
            ];

            foreach ($produits as $i => $p) {
                $ref = 'PRD-2025-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT);
                \App\Models\Produit::create([
                    'reference'     => $ref,
                    'ean'           => $p['ean'],
                    'titre'         => $p['titre'],
                    'auteur'        => $p['auteur'],
                    'editeur'       => $p['editeur'],
                    'type'          => $p['type'],
                    'genre'         => $p['genre'],
                    'prix_ttc'      => $p['prix_ttc'],
                    'stock_physique'=> $p['stock'],
                    'date_parution' => $p['parution'],
                ]);
            }
        }

        // ──────────────────────────────────────────────────────────────
        // Budgets — données de démonstration (mois courant + 2 précédents)
        // ──────────────────────────────────────────────────────────────
        $gerant = \App\Models\User::where('email', 'gerant@incunable.local')->first();

        if (\App\Models\Budget::count() === 0 && $gerant) {
            $budgetsDef = [
                ['categorie' => 'Achats livres',   'prevu' => 8000, 'reel' => null],
                ['categorie' => 'Frais généraux',  'prevu' => 1200, 'reel' => null],
                ['categorie' => 'Salaires',        'prevu' => 3500, 'reel' => null],
                ['categorie' => 'Événements',      'prevu' =>  300, 'reel' => null],
            ];

            foreach ([-2, -1, 0] as $offset) {
                $date = now()->addMonths($offset);
                foreach ($budgetsDef as $b) {
                    // Pour les mois passés, simuler un montant réel proche du prévu
                    $reel = $offset < 0 ? round($b['prevu'] * (0.85 + mt_rand(0, 30) / 100), 2) : null;
                    \App\Models\Budget::create([
                        'annee'          => $date->year,
                        'mois'           => $date->month,
                        'categorie'      => $b['categorie'],
                        'montant_prevu'  => $b['prevu'],
                        'montant_reel'   => $reel,
                        'cree_par'       => $gerant->id,
                    ]);
                }
            }
        }

        // ──────────────────────────────────────────────────────────────
        // Tickets de support
        // ──────────────────────────────────────────────────────────────
        if (\App\Models\Ticket::count() === 0) {
            $tickets = [
                ['sujet' => 'Erreur sur le montant de LCR-2025-0042',  'desc' => 'Le montant affiché ne correspond pas à la facture papier reçue.',    'priorite' => 'haute',   'statut' => 'en_cours'],
                ['sujet' => 'Ajouter le distributeur Dilicom',         'desc' => "Nous travaillons avec Dilicom. Il faudrait l'ajouter.",                'priorite' => 'normale', 'statut' => 'en_cours'],
                ['sujet' => "Les alertes e-mail ne fonctionnent pas",  'desc' => "Aucune alerte reçue pour les LCR en retard depuis 3 semaines.",        'priorite' => 'urgente', 'statut' => 'ouvert'],
                ['sujet' => 'Question sur le délai par défaut',        'desc' => "Quelle est la différence entre le délai fournisseur et le délai global ?", 'priorite' => 'faible', 'statut' => 'ferme'],
            ];

            foreach ($tickets as $t) {
                \App\Models\Ticket::create([
                    'cree_par'    => $admin->id,
                    'sujet'       => $t['sujet'],
                    'description' => $t['desc'],
                    'priorite'    => $t['priorite'],
                    'statut'      => $t['statut'],
                ]);
            }
        }
    }
}
