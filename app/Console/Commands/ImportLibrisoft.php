<?php

namespace App\Console\Commands;

use App\Models\MouvementStock;
use App\Models\Produit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * ImportLibrisoft — importe un export CSV de Librisoft dans Incunable.
 *
 * Utilisations :
 *   Manuel      : php artisan import:librisoft chemin/vers/export.csv
 *   Automatique : le scheduler appelle cette commande toutes les nuits (voir console.php)
 *   Dossier auto: si aucun fichier passé, cherche dans storage/app/imports/librisoft/
 *
 * Formats supportés :
 *   - CSV séparateur ; (standard Librisoft français)
 *   - Encodage windows-1252 → converti automatiquement en UTF-8
 *
 * Colonnes attendues (à confirmer avec ETL4hub / export Librisoft) :
 *   EAN | TITRE | AUTEUR | EDITEUR | PRIX_TTC | STOCK | DATE_VENTE | QTE_VENDUE
 *   Les noms exacts seront mappés une fois le format connu.
 */
class ImportLibrisoft extends Command
{
    // Signature de la commande artisan
    protected $signature = 'import:librisoft
                            {fichier? : Chemin vers le CSV (optionnel — dossier auto si absent)}
                            {--dry-run : Simule l\'import sans écrire en base}
                            {--type=auto : Type de données : produits|ventes|stock|auto}';

    protected $description = 'Importe un export CSV Librisoft (produits, ventes, stock)';

    // ── Point d'entrée ───────────────────────────────────────────────────────

    public function handle(): int
    {
        $fichier = $this->argument('fichier');
        $dryRun  = $this->option('dry-run');
        $type    = $this->option('type');

        // Si aucun fichier fourni → chercher dans le dossier d'imports automatiques
        if (! $fichier) {
            $fichier = $this->trouverFichierAuto();
            if (! $fichier) {
                $this->error('Aucun fichier CSV trouvé dans storage/app/imports/librisoft/');
                return self::FAILURE;
            }
        }

        if (! file_exists($fichier)) {
            $this->error("Fichier introuvable : {$fichier}");
            return self::FAILURE;
        }

        $this->info("Import Librisoft — fichier : {$fichier}");
        if ($dryRun) {
            $this->warn('Mode dry-run activé — aucune écriture en base.');
        }

        // Lecture et décodage du CSV
        $lignes = $this->lireCsv($fichier);
        if (empty($lignes)) {
            $this->warn('CSV vide ou illisible.');
            return self::FAILURE;
        }

        $this->info(count($lignes) . ' lignes lues.');

        // Détection automatique du type si non spécifié
        if ($type === 'auto') {
            $type = $this->detecterType(array_keys($lignes[0] ?? []));
            $this->info("Type détecté : {$type}");
        }

        // Dispatch vers le bon handler
        match ($type) {
            'produits' => $this->importerProduits($lignes, $dryRun),
            'ventes'   => $this->importerVentes($lignes, $dryRun),
            'stock'    => $this->importerStock($lignes, $dryRun),
            default    => $this->warn("Type '{$type}' non reconnu. Options : produits|ventes|stock"),
        };

        // Déplacer le fichier dans les archives après import réussi
        if (! $dryRun) {
            $this->archiver($fichier);
        }

        Log::info('Import Librisoft terminé', [
            'fichier' => basename($fichier),
            'lignes'  => count($lignes),
            'type'    => $type,
            'dry_run' => $dryRun,
        ]);

        $this->info('Import terminé.');
        return self::SUCCESS;
    }

    // ── Lecture du CSV ───────────────────────────────────────────────────────

    /**
     * Lit le CSV, convertit de windows-1252 vers UTF-8 si nécessaire,
     * et retourne un tableau associatif (colonnes = clés, lignes = valeurs).
     */
    private function lireCsv(string $chemin): array
    {
        $contenu = file_get_contents($chemin);

        // Détection et conversion d'encodage (Librisoft exporte souvent en ANSI/windows-1252)
        if (! mb_detect_encoding($contenu, 'UTF-8', true)) {
            $contenu = mb_convert_encoding($contenu, 'UTF-8', 'windows-1252');
        }

        // Écriture dans un fichier temporaire pour utiliser fgetcsv
        $tmp = tempnam(sys_get_temp_dir(), 'librisoft_');
        file_put_contents($tmp, $contenu);

        $lignes  = [];
        $entetes = null;

        if (($handle = fopen($tmp, 'r')) !== false) {
            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                if ($entetes === null) {
                    // Première ligne = en-têtes (noms des colonnes)
                    $entetes = array_map('trim', $row);
                    continue;
                }
                // Associer chaque valeur à son en-tête
                if (count($row) === count($entetes)) {
                    $lignes[] = array_combine($entetes, $row);
                }
            }
            fclose($handle);
        }

        unlink($tmp);
        return $lignes;
    }

    // ── Détection du type de fichier ─────────────────────────────────────────

    /**
     * Devine le type de données à partir des noms de colonnes.
     * À ajuster quand le format ETL4hub sera confirmé.
     */
    private function detecterType(array $colonnes): string
    {
        $colonnes = array_map('strtolower', $colonnes);

        if (in_array('date_vente', $colonnes) || in_array('qte_vendue', $colonnes)) {
            return 'ventes';
        }
        if (in_array('stock', $colonnes) || in_array('stock_physique', $colonnes)) {
            return 'stock';
        }
        // Par défaut : catalogue produits
        return 'produits';
    }

    // ── Handlers par type ────────────────────────────────────────────────────

    /**
     * Importe ou met à jour le catalogue produits depuis un CSV Librisoft.
     *
     * Colonnes CSV attendues (séparateur ;) :
     *   EAN | TITRE | AUTEUR | EDITEUR | PRIX_TTC | TYPE | GENRE | REFERENCE
     *
     * Stratégie : upsert sur EAN. Si EAN absent, la ligne est ignorée.
     * Les colonnes manquantes dans le CSV ne remplacent pas les valeurs existantes.
     */
    private function importerProduits(array $lignes, bool $dryRun): void
    {
        $nb = 0;
        $ignores = 0;
        $bar = $this->output->createProgressBar(count($lignes));

        foreach ($lignes as $ligne) {
            // Normalisation des clés en minuscules (Librisoft exporte parfois en MAJUSCULES)
            $d   = array_change_key_case($ligne, CASE_LOWER);
            $ean = trim($d['ean'] ?? '');

            if (! $ean) {
                $ignores++;
                $bar->advance();
                continue;
            }

            if (! $dryRun) {
                try {
                    Produit::updateOrCreate(
                        ['ean' => $ean],
                        array_filter([
                            'titre'    => $d['titre']   ?? null,
                            'auteur'   => $d['auteur']  ?? null,
                            'editeur'  => $d['editeur'] ?? null,
                            'prix_ttc' => isset($d['prix_ttc'])
                                ? (float) str_replace(',', '.', $d['prix_ttc'])
                                : null,
                            'type' => isset($d['type'])
                                ? (in_array(strtolower($d['type']), ['livre', 'goodie']) ? strtolower($d['type']) : 'livre')
                                : null,
                            'genre'     => $d['genre']     ?? $d['rayon'] ?? null,
                            'reference' => $d['reference'] ?? null,
                        ], fn($v) => $v !== null)
                    );
                } catch (\Exception $e) {
                    Log::error("ImportLibrisoft produits — EAN {$ean} : {$e->getMessage()}");
                }
            }

            $nb++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$nb} produits importés/mis à jour, {$ignores} ligne(s) ignorée(s) (EAN manquant).");
    }

    /**
     * Met à jour les niveaux de stock depuis un CSV Librisoft.
     *
     * Colonnes CSV attendues :
     *   EAN | STOCK_PHYSIQUE (ou STOCK) | STOCK_COMMANDE (optionnel)
     *
     * Crée un MouvementStock pour chaque changement de stock.
     */
    private function importerStock(array $lignes, bool $dryRun): void
    {
        $nb = 0;
        $ignores = 0;
        $bar = $this->output->createProgressBar(count($lignes));

        foreach ($lignes as $ligne) {
            $d         = array_change_key_case($ligne, CASE_LOWER);
            $ean       = trim($d['ean'] ?? '');
            $stockBrut = $d['stock_physique'] ?? $d['stock'] ?? null;

            if (! $ean || $stockBrut === null) {
                $ignores++;
                $bar->advance();
                continue;
            }

            if (! $dryRun) {
                $produit = Produit::where('ean', $ean)->first();
                if ($produit) {
                    $nouveauStock = (int) $stockBrut;
                    $delta        = $nouveauStock - $produit->stock_physique;

                    if ($delta !== 0) {
                        $produit->update(['stock_physique' => $nouveauStock]);

                        MouvementStock::create([
                            'produit_id'  => $produit->id,
                            'user_id'     => null,
                            'type'        => $delta > 0 ? 'entree' : 'sortie',
                            'quantite'    => abs($delta),
                            'stock_apres' => $nouveauStock,
                            'motif'       => 'Import stock Librisoft (CSV)',
                            'source'      => 'import_csv',
                        ]);
                    }

                    $nb++;
                }
            } else {
                $nb++;   // En dry-run, on compte quand même
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$nb} stocks mis à jour, {$ignores} ligne(s) ignorée(s).");
    }

    /**
     * Importe les ventes de la journée depuis un CSV Librisoft.
     *
     * Colonnes CSV attendues :
     *   EAN | DATE_VENTE | QTE_VENDUE | PRIX_UNITAIRE (optionnel)
     *
     * Chaque vente décrémente le stock et crée un mouvement 'sortie'.
     */
    private function importerVentes(array $lignes, bool $dryRun): void
    {
        $nb = 0;
        $ignores = 0;
        $bar = $this->output->createProgressBar(count($lignes));

        foreach ($lignes as $ligne) {
            $d         = array_change_key_case($ligne, CASE_LOWER);
            $ean       = trim($d['ean'] ?? '');
            $qte       = (int) ($d['qte_vendue'] ?? $d['quantite'] ?? 0);
            $dateVente = trim($d['date_vente'] ?? date('Y-m-d'));

            if (! $ean || $qte <= 0) {
                $ignores++;
                $bar->advance();
                continue;
            }

            if (! $dryRun) {
                $produit = Produit::where('ean', $ean)->first();
                if ($produit) {
                    $stockApres = max(0, $produit->stock_physique - $qte);
                    $produit->update(['stock_physique' => $stockApres]);

                    MouvementStock::create([
                        'produit_id'  => $produit->id,
                        'user_id'     => null,
                        'type'        => 'sortie',
                        'quantite'    => $qte,
                        'stock_apres' => $stockApres,
                        'motif'       => "Vente Librisoft du {$dateVente}",
                        'source'      => 'import_csv',
                    ]);
                }
            }

            $nb++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$nb} vente(s) importée(s), {$ignores} ligne(s) ignorée(s).");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Cherche le fichier CSV le plus récent dans le dossier d'import automatique.
     * ETL4hub déposera les fichiers dans : storage/app/imports/librisoft/
     */
    private function trouverFichierAuto(): ?string
    {
        $dossier = storage_path('app/imports/librisoft');

        if (! is_dir($dossier)) {
            mkdir($dossier, 0755, true);
            return null;
        }

        $fichiers = glob($dossier . '/*.csv');
        if (empty($fichiers)) {
            return null;
        }

        // Le plus récent en premier
        usort($fichiers, fn($a, $b) => filemtime($b) - filemtime($a));
        return $fichiers[0];
    }

    /**
     * Déplace le fichier traité vers storage/app/imports/librisoft/archives/
     * pour éviter de le ré-importer.
     */
    private function archiver(string $chemin): void
    {
        $archive = storage_path('app/imports/librisoft/archives');
        if (! is_dir($archive)) {
            mkdir($archive, 0755, true);
        }
        $destination = $archive . '/' . date('Y-m-d_His_') . basename($chemin);
        rename($chemin, $destination);
        $this->info("Fichier archivé : {$destination}");
    }
}
