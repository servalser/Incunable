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
                'nom_librairie'              => 'Manga Café — Librairie & Culture Japonaise',
                'siret'                      => '48250261500025',
                'email'                      => 'contact@manga-cafe.fr',
                'telephone'                  => '04 67 58 12 34',
                'adresse'                    => "12 rue de la Loge\n34000 Montpellier",
                'delai_commandes_mois'       => 3,
                'delai_offices_mois'         => 2,
                'seuil_alerte_stock_global'  => 3,
                'delai_nouveautes_semaines'  => 4, // Manga : parutions fréquentes → 4 semaines
            ]
        );

        // ──────────────────────────────────────────────────────────────
        // Distributeurs (spécialisés manga / BD japonaise)
        // ──────────────────────────────────────────────────────────────
        $distributeurs = [
            ['nom' => 'Glénat Distribution',   'email' => 'commandes@glenat.com',     'delai_commandes_mois' => 2, 'delai_offices_mois' => 2, 'actif' => true],
            ['nom' => 'Média Participations',  'email' => 'offices@media-part.fr',    'delai_commandes_mois' => 3, 'delai_offices_mois' => 3, 'actif' => true],
            ['nom' => 'Interforum (Kurokawa)', 'email' => 'manga@interforum.fr',      'delai_commandes_mois' => 2, 'delai_offices_mois' => 2, 'actif' => true],
            ['nom' => 'Hachette (Pika/Kana)',  'email' => 'commandes@hachette.fr',    'delai_commandes_mois' => 3, 'delai_offices_mois' => 2, 'actif' => true],
            ['nom' => 'Kazé / Crunchyroll',    'email' => 'distribution@kaze.fr',     'delai_commandes_mois' => 3, 'delai_offices_mois' => 3, 'actif' => true],
        ];

        foreach ($distributeurs as $d) {
            \App\Models\Distributeur::firstOrCreate(['nom' => $d['nom']], $d);
        }

        $glenat     = \App\Models\Distributeur::where('nom', 'Glénat Distribution')->first();
        $mediaPart  = \App\Models\Distributeur::where('nom', 'Média Participations')->first();
        $interforum = \App\Models\Distributeur::where('nom', 'Interforum (Kurokawa)')->first();
        $hachette   = \App\Models\Distributeur::where('nom', 'Hachette (Pika/Kana)')->first();
        $kaze       = \App\Models\Distributeur::where('nom', 'Kazé / Crunchyroll')->first();

        // ──────────────────────────────────────────────────────────────
        // Lettres de change
        // ──────────────────────────────────────────────────────────────
        if (\App\Models\Lettre::count() === 0) {
            $lettres = [
                ['ref' => 'LCR-2025-0042', 'distrib' => $glenat,     'montant' => 3420.50, 'emission' => '2025-01-15', 'echeance' => '2025-04-15', 'statut' => 'en_retard'],
                ['ref' => 'LCR-2025-0043', 'distrib' => $mediaPart,  'montant' => 1850.00, 'emission' => '2025-02-01', 'echeance' => '2025-05-01', 'statut' => 'en_attente'],
                ['ref' => 'LCR-2025-0041', 'distrib' => $glenat,     'montant' => 2100.80, 'emission' => '2025-01-01', 'echeance' => '2025-04-01', 'statut' => 'paye'],
                ['ref' => 'LCR-2025-0044', 'distrib' => $interforum, 'montant' => 4780.00, 'emission' => '2025-02-15', 'echeance' => '2025-05-15', 'statut' => 'en_attente'],
                ['ref' => 'LCR-2025-0040', 'distrib' => $kaze,       'montant' =>  920.00, 'emission' => '2024-12-01', 'echeance' => '2025-03-01', 'statut' => 'en_retard'],
                ['ref' => 'LCR-2025-0045', 'distrib' => $hachette,   'montant' => 3100.00, 'emission' => '2025-03-01', 'echeance' => '2025-06-01', 'statut' => 'en_attente'],
                ['ref' => 'LCR-2025-0039', 'distrib' => $interforum, 'montant' => 1560.00, 'emission' => '2024-11-15', 'echeance' => '2025-02-15', 'statut' => 'paye'],
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
                ['ref' => 'OFF-2025-0018', 'distrib' => $glenat,     'type' => 'facon',       'montant' => 5200.00, 'retourne' => 0,       'reception' => '2025-01-10', 'retour_limite' => '2025-03-10', 'statut' => 'en_retard'],
                ['ref' => 'OFF-2025-0019', 'distrib' => $mediaPart,  'type' => 'grille',      'montant' => 3800.00, 'retourne' => 0,       'reception' => '2025-02-20', 'retour_limite' => '2025-05-20', 'statut' => 'en_attente'],
                ['ref' => 'OFF-2025-0017', 'distrib' => $interforum, 'type' => 'facon',       'montant' => 2400.00, 'retourne' => 1200.00, 'reception' => '2025-01-05', 'retour_limite' => '2025-03-05', 'statut' => 'retour_partiel'],
                ['ref' => 'OFF-2025-0020', 'distrib' => $kaze,       'type' => 'exceptionnel','montant' => 1100.00, 'retourne' => 1100.00, 'reception' => '2025-02-01', 'retour_limite' => '2025-04-01', 'statut' => 'retourne'],
                ['ref' => 'OFF-2025-0021', 'distrib' => $hachette,   'type' => 'grille',      'montant' => 4600.00, 'retourne' => 0,       'reception' => '2024-12-15', 'retour_limite' => '2025-02-15', 'statut' => 'paye'],
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
        // Produits — catalogue manga de démonstration
        // ──────────────────────────────────────────────────────────────
        if (\App\Models\Produit::count() === 0) {
            $produits = [
                // Mangas — shonen
                ['ean' => '9782723489652', 'titre' => 'One Piece — Tome 104',          'auteur' => 'Eiichiro Oda',       'editeur' => 'Glénat',     'type' => 'livre', 'genre' => 'Shonen',      'prix_ttc' => 7.20,  'stock' => 15, 'parution' => '2024-12-04'],
                ['ean' => '9782723478281', 'titre' => 'Jujutsu Kaisen — Tome 25',     'auteur' => 'Gege Akutami',       'editeur' => 'Glénat',     'type' => 'livre', 'genre' => 'Shonen',      'prix_ttc' => 7.20,  'stock' => 8,  'parution' => '2025-03-05'],
                ['ean' => '9782505085911', 'titre' => 'Chainsaw Man — Tome 16',       'auteur' => 'Tatsuki Fujimoto',   'editeur' => 'Kana',       'type' => 'livre', 'genre' => 'Shonen',      'prix_ttc' => 7.45,  'stock' => 2,  'parution' => '2025-01-10'], // alerte
                ['ean' => '9782380712345', 'titre' => 'Dandadan — Tome 12',           'auteur' => 'Yukinobu Tatsu',     'editeur' => 'Crunchyroll','type' => 'livre', 'genre' => 'Shonen',      'prix_ttc' => 7.20,  'stock' => 0,  'parution' => '2025-02-19'], // rupture

                // Mangas — seinen
                ['ean' => '9782811645021', 'titre' => 'Vagabond — Tome 37',           'auteur' => 'Takehiko Inoue',     'editeur' => 'Tonkam',     'type' => 'livre', 'genre' => 'Seinen',      'prix_ttc' => 7.95,  'stock' => 4,  'parution' => '2015-03-20'],
                ['ean' => '9782505082194', 'titre' => 'Berserk — Tome 42',            'auteur' => 'Kentaro Miura',      'editeur' => 'Glénat',     'type' => 'livre', 'genre' => 'Seinen',      'prix_ttc' => 7.20,  'stock' => 6,  'parution' => '2024-09-11'],
                ['ean' => '9782368529854', 'titre' => 'Blue Lock — Tome 28',          'auteur' => 'Muneyuki Kaneshiro', 'editeur' => 'Pika',       'type' => 'livre', 'genre' => 'Shonen',      'prix_ttc' => 7.20,  'stock' => 12, 'parution' => '2025-04-02'], // nouveauté

                // Mangas — shojo / josei
                ['ean' => '9782820340122', 'titre' => 'Fruits Basket — Perfect T.1',  'auteur' => 'Natsuki Takaya',     'editeur' => 'Delcourt',   'type' => 'livre', 'genre' => 'Shojo',       'prix_ttc' => 10.75, 'stock' => 3,  'parution' => '2023-06-14'],
                ['ean' => '9782413044789', 'titre' => 'My Dress-Up Darling — T.12',   'auteur' => 'Shinichi Fukuda',    'editeur' => 'Kurokawa',   'type' => 'livre', 'genre' => 'Seinen',      'prix_ttc' => 7.65,  'stock' => 0,  'parution' => '2025-01-16'], // rupture

                // Light Novel
                ['ean' => '9782377173259', 'titre' => 'Solo Leveling — Roman T.7',    'auteur' => 'Chugong',            'editeur' => 'Kurokawa',   'type' => 'livre', 'genre' => 'Light Novel', 'prix_ttc' => 8.20,  'stock' => 5,  'parution' => '2024-11-20'],

                // Goodies manga
                ['ean' => null, 'titre' => 'Figurine Luffy Gear 5 — 18cm',            'auteur' => null, 'editeur' => null, 'type' => 'goodie', 'genre' => 'Figurine',   'prix_ttc' => 34.90, 'stock' => 3,  'parution' => null],
                ['ean' => null, 'titre' => 'Poster Jujutsu Kaisen A2',                'auteur' => null, 'editeur' => null, 'type' => 'goodie', 'genre' => 'Poster',     'prix_ttc' => 9.90,  'stock' => 7,  'parution' => null],
                ['ean' => null, 'titre' => 'Porte-clés Tanjiro Kamado',               'auteur' => null, 'editeur' => null, 'type' => 'goodie', 'genre' => 'Accessoire', 'prix_ttc' => 6.50,  'stock' => 12, 'parution' => null],
                ['ean' => null, 'titre' => 'Carnet Sakura A5 ligné',                  'auteur' => null, 'editeur' => null, 'type' => 'goodie', 'genre' => 'Papeterie',  'prix_ttc' => 8.90,  'stock' => 1,  'parution' => null], // alerte
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
                ['categorie' => 'Achats manga & light novels', 'prevu' => 8500, 'reel' => null],
                ['categorie' => 'Achats goodies & figurines',  'prevu' => 2000, 'reel' => null],
                ['categorie' => 'Frais généraux',              'prevu' => 1200, 'reel' => null],
                ['categorie' => 'Salaires',                    'prevu' => 3500, 'reel' => null],
                ['categorie' => 'Événements & conventions',    'prevu' =>  800, 'reel' => null],
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
                ['sujet' => 'Erreur sur le montant de LCR-2025-0042',  'desc' => 'Le montant affiché ne correspond pas à la facture Glénat reçue.',    'priorite' => 'haute',   'statut' => 'en_cours'],
                ['sujet' => 'Sortie Tome 105 One Piece — alerte stock','desc' => "La parution du T.105 est prévue le 5 mars, prévoir un réassort anticipé.", 'priorite' => 'normale', 'statut' => 'en_cours'],
                ['sujet' => "Les alertes e-mail ne fonctionnent pas",  'desc' => "Aucune alerte reçue pour les LCR en retard depuis 3 semaines.",        'priorite' => 'urgente', 'statut' => 'ouvert'],
                ['sujet' => 'Délai de retour offices Kazé',            'desc' => "Kazé a changé ses délais de retour : 2 mois au lieu de 3. Mettre à jour.", 'priorite' => 'faible', 'statut' => 'ferme'],
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
