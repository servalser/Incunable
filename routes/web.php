<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\DilicomController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\DashboardQuestionsController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\CorbeilleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DistributeurController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\FicheMissionController;
use App\Http\Controllers\LettreController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\RapportController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

// ── Webhooks entrants (pas d'auth, pas de CSRF — signés par HMAC) ────────────
// Ces routes reçoivent des appels de services externes (ETL4hub, Librisoft…).
// La sécurité repose sur la vérification HMAC dans WebhookController.
Route::post('/webhooks/librisoft', [WebhookController::class, 'librisoft'])
    ->name('webhooks.librisoft');

// ── Authentification ──────────────────────────────────────────────────────────
// Ces routes sont accessibles sans être connecté
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->name('logout')
    ->middleware('auth');

// ── Routes protégées (utilisateur connecté) ───────────────────────────────────
Route::middleware('auth')->group(function () {

    // Tableau de bord
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // ── Lettres de change ─────────────────────────────────────────────────────
    Route::get('/lettres', [LettreController::class, 'index'])->name('lettres.index');
    Route::get('/lettres/creer', [LettreController::class, 'create'])->name('lettres.create');
    Route::post('/lettres', [LettreController::class, 'store'])->name('lettres.store');
    Route::get('/lettres/{lettre}', [LettreController::class, 'show'])->name('lettres.show');
    Route::get('/lettres/{lettre}/modifier', [LettreController::class, 'edit'])->name('lettres.edit');
    Route::put('/lettres/{lettre}', [LettreController::class, 'update'])->name('lettres.update');
    // Actions métier
    Route::post('/lettres/{lettre}/payer', [LettreController::class, 'payer'])->name('lettres.payer');
    Route::delete('/lettres/{lettre}', [LettreController::class, 'destroy'])->name('lettres.destroy'); // soft delete
    Route::post('/lettres/{lettre}/restaurer', [LettreController::class, 'restore'])->name('lettres.restore');

    // ── Offices ───────────────────────────────────────────────────────────────
    Route::get('/offices', [OfficeController::class, 'index'])->name('offices.index');
    Route::get('/offices/creer', [OfficeController::class, 'create'])->name('offices.create');
    Route::post('/offices', [OfficeController::class, 'store'])->name('offices.store');
    Route::get('/offices/{office}', [OfficeController::class, 'show'])->name('offices.show');
    Route::get('/offices/{office}/modifier', [OfficeController::class, 'edit'])->name('offices.edit');
    Route::put('/offices/{office}', [OfficeController::class, 'update'])->name('offices.update');
    // Actions métier
    Route::post('/offices/{office}/retour', [OfficeController::class, 'retour'])->name('offices.retour');
    Route::post('/offices/{office}/payer', [OfficeController::class, 'payer'])->name('offices.payer');
    Route::delete('/offices/{office}', [OfficeController::class, 'destroy'])->name('offices.destroy');
    Route::post('/offices/{office}/restaurer', [OfficeController::class, 'restore'])->name('offices.restore');

    // ── Distributeurs ─────────────────────────────────────────────────────────
    Route::get('/distributeurs', [DistributeurController::class, 'index'])->name('distributeurs.index');
    Route::post('/distributeurs', [DistributeurController::class, 'store'])->name('distributeurs.store');
    Route::put('/distributeurs/{distributeur}', [DistributeurController::class, 'update'])->name('distributeurs.update');
    Route::delete('/distributeurs/{distributeur}', [DistributeurController::class, 'destroy'])->name('distributeurs.destroy');

    // ── Corbeille (soft-delete) ───────────────────────────────────────────────
    Route::get('/corbeille', [CorbeilleController::class, 'index'])->name('corbeille.index');
    Route::post('/corbeille/{type}/{id}/restaurer', [CorbeilleController::class, 'restore'])->name('corbeille.restore');
    Route::delete('/corbeille/{type}/{id}', [CorbeilleController::class, 'destroy'])->name('corbeille.destroy');

    // ── Configuration (admin seulement) ──────────────────────────────────────
    Route::get('/configuration', [ConfigurationController::class, 'index'])->name('configuration.index');
    Route::put('/configuration', [ConfigurationController::class, 'update'])->name('configuration.update');
    Route::post('/configuration/benchmark/synchroniser', [ConfigurationController::class, 'synchroniserBenchmark'])->name('configuration.benchmark.synchroniser');

    // ── Tickets de support ────────────────────────────────────────────────────
    Route::get('/tickets', [TicketController::class, 'index'])->name('tickets.index');
    Route::post('/tickets', [TicketController::class, 'store'])->name('tickets.store');
    Route::put('/tickets/{ticket}', [TicketController::class, 'update'])->name('tickets.update');
    Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy'])->name('tickets.destroy');

    // ── Stock — catalogue produits (livres + goodies) ─────────────────────────
    Route::get('/stock',                    [ProduitController::class, 'index'])   ->name('stock.index');
    Route::get('/stock/creer',              [ProduitController::class, 'create'])  ->name('stock.create');
    // Lookup ISBN AVANT les routes {produit} — sinon "lookup-isbn" serait capturé comme un id de produit
    Route::get('/stock/lookup-isbn',        [ProduitController::class, 'lookupIsbn'])->name('stock.lookup_isbn');
    Route::post('/stock',                   [ProduitController::class, 'store'])   ->name('stock.store');
    Route::get('/stock/{produit}/modifier', [ProduitController::class, 'edit'])    ->name('stock.edit');
    Route::put('/stock/{produit}',          [ProduitController::class, 'update'])  ->name('stock.update');
    Route::delete('/stock/{produit}',       [ProduitController::class, 'destroy']) ->name('stock.destroy');
    // Mouvement de stock (entrée/sortie/ajustement) — appelé depuis le modal dans la liste
    Route::post('/stock/{produit}/mouvement', [ProduitController::class, 'mouvement'])->name('stock.mouvement');

    // ── Budget — prévisions financières ──────────────────────────────────────
    Route::get('/budget',              [BudgetController::class, 'index'])  ->name('budget.index');
    Route::post('/budget',             [BudgetController::class, 'store'])  ->name('budget.store');
    Route::put('/budget/{budget}',     [BudgetController::class, 'update']) ->name('budget.update');
    Route::delete('/budget/{budget}',  [BudgetController::class, 'destroy'])->name('budget.destroy');

    // ── Dashboard — widget questions intelligentes ────────────────────────────
    Route::get('/dashboard/questions',         [DashboardQuestionsController::class, 'index'])  ->name('dashboard.questions');
    Route::post('/dashboard/questions/ignorer',[DashboardQuestionsController::class, 'ignorer'])->name('dashboard.questions.ignorer');

    // ── Dilicom / Recherche catalogue ────────────────────────────────────────
    // Recherche Google Books (gratuit) + import optionnel depuis LibriWeb
    Route::get('/dilicom',            [DilicomController::class, 'index'])     ->name('dilicom.index');
    Route::get('/dilicom/rechercher', [DilicomController::class, 'rechercher'])->name('dilicom.rechercher');
    Route::post('/dilicom/importer',  [DilicomController::class, 'importer'])  ->name('dilicom.importer');

    // ── Analyse — Rapports ────────────────────────────────────────────────────
    Route::get('/rapports', [RapportController::class, 'index'])->name('rapports.index');

    // ── Analyse — Fiches missions ─────────────────────────────────────────────
    Route::get('/fiches-missions', [FicheMissionController::class, 'index'])->name('fiches_missions.index');
    Route::post('/fiches-missions', [FicheMissionController::class, 'store'])->name('fiches_missions.store');
    Route::put('/fiches-missions/{ficheMission}', [FicheMissionController::class, 'update'])->name('fiches_missions.update');
    Route::delete('/fiches-missions/{ficheMission}', [FicheMissionController::class, 'destroy'])->name('fiches_missions.destroy');

    // ── Analyse — Conseiller IA ───────────────────────────────────────────────
    Route::get('/assistant', [AssistantController::class, 'index'])->name('assistant.index');
    Route::post('/assistant/message', [AssistantController::class, 'message'])->name('assistant.message');

    // ── Documents imprimables (renvoient du HTML pur, sans layout React) ──────
    Route::get('/documents/lettre-charge/{office}', [DocumentController::class, 'lettreCharge'])->name('documents.lettre_charge');
    Route::get('/documents/bon-retour/{office}', [DocumentController::class, 'bonRetour'])->name('documents.bon_retour');
    Route::get('/documents/releve/{distributeur}', [DocumentController::class, 'releve'])->name('documents.releve');
    Route::get('/documents/recap-mensuel', [DocumentController::class, 'recapMensuel'])->name('documents.recap_mensuel');
});
