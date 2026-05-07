<?php

namespace App\Console\Commands;

use App\Models\Configuration;
use App\Models\Lettre;
use App\Models\Office;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * SendAlertes — envoie les alertes e-mail configurées dans Incunable.
 *
 * Alertes disponibles (configurables dans Configuration > Alertes) :
 *   - LCR en retard                 → dès qu'une LCR dépasse sa date d'échéance
 *   - LCR à 7 jours                 → une semaine avant l'échéance
 *   - LCR à 1 jour                  → la veille de l'échéance
 *   - Retour office proche          → 7 jours avant la date limite de retour
 *   - Récapitulatif hebdomadaire    → résumé complet chaque lundi matin
 *
 * Utilisation :
 *   php artisan alertes:envoyer            → envoi normal (respecte les toggles)
 *   php artisan alertes:envoyer --force    → force l'envoi de toutes les alertes
 *   php artisan alertes:envoyer --dry-run  → affiche ce qui serait envoyé sans envoyer
 */
class SendAlertes extends Command
{
    protected $signature = 'alertes:envoyer
                            {--force   : Envoie toutes les alertes même si désactivées}
                            {--dry-run : Affiche les alertes sans les envoyer}';

    protected $description = 'Envoie les alertes e-mail configurées (LCR, offices, récap hebdomadaire)';

    // ── Point d'entrée ───────────────────────────────────────────────────────

    public function handle(): int
    {
        $config  = Configuration::get();
        $dryRun  = $this->option('dry-run');
        $force   = $this->option('force');

        // ── Vérifications préalables ─────────────────────────────────────────

        // SMTP obligatoire pour envoyer quoi que ce soit
        if (! $config->smtp_host || ! $config->smtp_from_email) {
            $this->warn('SMTP non configuré — alertes ignorées. Renseignez le serveur SMTP dans Configuration > SMTP.');
            return self::SUCCESS;
        }

        // Email destinataire = email de la librairie
        $dest = $config->email;
        if (! $dest) {
            $this->warn('Aucun e-mail de librairie configuré — alertes ignorées. Renseignez l\'e-mail dans Configuration > Librairie.');
            return self::SUCCESS;
        }

        // Configuration dynamique du mailer depuis la base de données.
        // Laravel n'utilise pas le .env ici — les paramètres SMTP viennent de la BDD.
        if (! $dryRun) {
            $this->configurerSMTP($config);
        }

        $envois = 0;

        // ── Alerte retard LCR ────────────────────────────────────────────────
        if ($force || $config->alerte_retard) {
            $envois += $this->alerteRetardLcr($dest, $config, $dryRun);
        }

        // ── Alerte LCR à 7 jours ─────────────────────────────────────────────
        if ($force || $config->alerte_7j) {
            $envois += $this->alerteLcr7j($dest, $config, $dryRun);
        }

        // ── Alerte LCR à 1 jour ──────────────────────────────────────────────
        if ($force || $config->alerte_1j) {
            $envois += $this->alerteLcr1j($dest, $config, $dryRun);
        }

        // ── Alerte retour office proche ──────────────────────────────────────
        if ($force || $config->alerte_retour_expiration) {
            $envois += $this->alerteRetourOffice($dest, $config, $dryRun);
        }

        // ── Récapitulatif hebdomadaire (uniquement le lundi) ─────────────────
        $estLundi = now()->isDayOfWeek(Carbon::MONDAY);
        if ($force || ($config->alerte_recap_hebdo && $estLundi)) {
            $envois += $this->recapHebdo($dest, $config, $dryRun);
        }

        $label = $dryRun ? '(dry-run) ' : '';
        $this->info("{$label}{$envois} e-mail(s) envoyé(s).");
        Log::info("Alertes e-mail : {$envois} envoyé(s).", ['dry_run' => $dryRun]);

        return self::SUCCESS;
    }

    // ── Configuration dynamique du mailer ────────────────────────────────────

    /**
     * Injecte les paramètres SMTP stockés en base dans la config Laravel
     * au moment de l'exécution. Cela permet à chaque librairie d'avoir
     * son propre serveur mail sans modifier le .env.
     */
    private function configurerSMTP(Configuration $config): void
    {
        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp', [
            'transport'  => 'smtp',
            'host'       => $config->smtp_host,
            'port'       => $config->smtp_port ?? 587,
            'encryption' => $config->smtp_tls ? 'tls' : null,
            'username'   => $config->smtp_username,
            'password'   => $config->smtp_password,
        ]);
        Config::set('mail.from.address', $config->smtp_from_email);
        Config::set('mail.from.name',    $config->smtp_from_name ?? $config->nom_librairie ?? 'Incunable');
    }

    // ── Alertes individuelles ─────────────────────────────────────────────────

    /**
     * LCR dont la date d'échéance est dépassée et non payées.
     */
    private function alerteRetardLcr(string $dest, Configuration $config, bool $dryRun): int
    {
        $lcrs = Lettre::actif()
            ->whereNotIn('statut', ['payee'])
            ->whereDate('date_echeance', '<', today())
            ->with('distributeur')
            ->orderBy('date_echeance')
            ->get();

        if ($lcrs->isEmpty()) return 0;

        $sujet = "[{$config->nom_librairie}] ⚠️ {$lcrs->count()} LCR en retard";
        $corps = $this->htmlRetardLcr($lcrs, $config);

        return $this->envoyer($dest, $sujet, $corps, $dryRun, "LCR en retard : {$lcrs->count()}");
    }

    /**
     * LCR qui arrivent à échéance dans exactement 7 jours.
     */
    private function alerteLcr7j(string $dest, Configuration $config, bool $dryRun): int
    {
        $lcrs = Lettre::actif()
            ->whereNotIn('statut', ['payee'])
            ->whereDate('date_echeance', today()->addDays(7))
            ->with('distributeur')
            ->orderBy('date_echeance')
            ->get();

        if ($lcrs->isEmpty()) return 0;

        $sujet = "[{$config->nom_librairie}] 📅 {$lcrs->count()} LCR arrivent à échéance dans 7 jours";
        $corps = $this->htmlEcheanceLcr($lcrs, $config, '7 jours');

        return $this->envoyer($dest, $sujet, $corps, $dryRun, "LCR à 7j : {$lcrs->count()}");
    }

    /**
     * LCR qui arrivent à échéance demain.
     */
    private function alerteLcr1j(string $dest, Configuration $config, bool $dryRun): int
    {
        $lcrs = Lettre::actif()
            ->whereNotIn('statut', ['payee'])
            ->whereDate('date_echeance', today()->addDay())
            ->with('distributeur')
            ->orderBy('date_echeance')
            ->get();

        if ($lcrs->isEmpty()) return 0;

        $sujet = "[{$config->nom_librairie}] 🔔 {$lcrs->count()} LCR arrivent à échéance demain";
        $corps = $this->htmlEcheanceLcr($lcrs, $config, 'demain');

        return $this->envoyer($dest, $sujet, $corps, $dryRun, "LCR à 1j : {$lcrs->count()}");
    }

    /**
     * Offices dont la date limite de retour approche (≤ 7 jours).
     */
    private function alerteRetourOffice(string $dest, Configuration $config, bool $dryRun): int
    {
        $offices = Office::actif()
            ->whereNotIn('statut', ['retourne', 'paye'])
            ->whereNotNull('date_retour_limite')
            ->whereDate('date_retour_limite', '>=', today())
            ->whereDate('date_retour_limite', '<=', today()->addDays(7))
            ->with('distributeur')
            ->orderBy('date_retour_limite')
            ->get();

        if ($offices->isEmpty()) return 0;

        $sujet = "[{$config->nom_librairie}] 📦 {$offices->count()} office(s) à retourner dans 7 jours";
        $corps = $this->htmlRetourOffice($offices, $config);

        return $this->envoyer($dest, $sujet, $corps, $dryRun, "Retour office proche : {$offices->count()}");
    }

    /**
     * Récapitulatif hebdomadaire : toutes les alertes actives en un seul e-mail.
     */
    private function recapHebdo(string $dest, Configuration $config, bool $dryRun): int
    {
        $lcrsRetard = Lettre::actif()
            ->whereNotIn('statut', ['payee'])
            ->whereDate('date_echeance', '<', today())
            ->count();

        $lcrsSemaine = Lettre::actif()
            ->whereNotIn('statut', ['payee'])
            ->whereDate('date_echeance', '>=', today())
            ->whereDate('date_echeance', '<=', today()->addDays(7))
            ->count();

        $officesRetour = Office::actif()
            ->whereNotIn('statut', ['retourne', 'paye'])
            ->whereNotNull('date_retour_limite')
            ->whereDate('date_retour_limite', '>=', today())
            ->whereDate('date_retour_limite', '<=', today()->addDays(7))
            ->count();

        $corps = $this->htmlRecapHebdo($lcrsRetard, $lcrsSemaine, $officesRetour, $config);
        $sujet = "[{$config->nom_librairie}] 📊 Récap hebdomadaire — " . now()->locale('fr')->isoFormat('D MMMM YYYY');

        return $this->envoyer($dest, $sujet, $corps, $dryRun, "Récap hebdo");
    }

    // ── Envoi effectif ────────────────────────────────────────────────────────

    private function envoyer(string $dest, string $sujet, string $html, bool $dryRun, string $label): int
    {
        if ($dryRun) {
            $this->line("  [dry-run] {$label} → serait envoyé à {$dest}");
            return 1;
        }

        try {
            Mail::html($html, function ($msg) use ($dest, $sujet) {
                $msg->to($dest)->subject($sujet);
            });
            $this->line("  ✓ {$label}");
            return 1;
        } catch (\Exception $e) {
            $this->error("  ✗ {$label} — erreur : {$e->getMessage()}");
            Log::error("Alerte non envoyée : {$label}", ['error' => $e->getMessage()]);
            return 0;
        }
    }

    // ── Templates HTML ────────────────────────────────────────────────────────

    /**
     * Style commun à tous les e-mails.
     * Un HTML simple, lisible sur tous les clients mail.
     */
    private function htmlBase(string $titre, string $intro, string $contenu, Configuration $config): string
    {
        $librairie = htmlspecialchars($config->nom_librairie ?? 'Incunable');
        $date      = now()->locale('fr')->isoFormat('dddd D MMMM YYYY');

        return <<<HTML
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                   background: #f4f4f5; margin: 0; padding: 20px; color: #18181b; }
            .wrap { max-width: 600px; margin: 0 auto; background: #fff;
                    border-radius: 8px; overflow: hidden;
                    box-shadow: 0 1px 4px rgba(0,0,0,.1); }
            .hdr  { background: #1e293b; color: #f8fafc; padding: 20px 24px; }
            .hdr h1 { margin: 0; font-size: 18px; font-weight: 600; }
            .hdr p  { margin: 4px 0 0; font-size: 13px; opacity: .65; }
            .body   { padding: 24px; }
            .intro  { font-size: 14px; color: #52525b; margin-bottom: 20px; }
            table   { width: 100%; border-collapse: collapse; font-size: 13px; }
            th      { background: #f4f4f5; text-align: left; padding: 8px 10px;
                      font-weight: 600; color: #71717a; border-bottom: 1px solid #e4e4e7; }
            td      { padding: 8px 10px; border-bottom: 1px solid #f4f4f5; color: #3f3f46; }
            tr:last-child td { border-bottom: none; }
            .badge  { display: inline-block; padding: 2px 8px; border-radius: 12px;
                      font-size: 11px; font-weight: 600; }
            .red    { background: #fee2e2; color: #b91c1c; }
            .orange { background: #ffedd5; color: #c2410c; }
            .blue   { background: #dbeafe; color: #1d4ed8; }
            .ftr    { padding: 16px 24px; background: #f4f4f5; font-size: 12px; color: #a1a1aa;
                      border-top: 1px solid #e4e4e7; }
            .kpi-row { display: flex; gap: 12px; margin-bottom: 20px; }
            .kpi    { flex: 1; background: #f4f4f5; border-radius: 6px; padding: 12px;
                      text-align: center; }
            .kpi-val { font-size: 28px; font-weight: 700; color: #18181b; }
            .kpi-lbl { font-size: 11px; color: #71717a; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="hdr">
              <h1>{$titre}</h1>
              <p>{$librairie} · {$date}</p>
            </div>
            <div class="body">
              <p class="intro">{$intro}</p>
              {$contenu}
            </div>
            <div class="ftr">
              Cet e-mail a été envoyé automatiquement par Incunable — {$librairie}.
              Pour modifier ces alertes, rendez-vous dans Configuration &gt; Alertes.
            </div>
          </div>
        </body>
        </html>
        HTML;
    }

    private function htmlRetardLcr($lcrs, Configuration $config): string
    {
        $lignes = '';
        foreach ($lcrs as $lcr) {
            $ref   = htmlspecialchars($lcr->reference);
            $dist  = htmlspecialchars($lcr->distributeur?->nom ?? '—');
            $mont  = number_format((float) $lcr->montant_ttc, 2, ',', ' ') . ' €';
            $ech   = $lcr->date_echeance?->format('d/m/Y') ?? '—';
            $jours = abs($lcr->jours_restants);
            $lignes .= "<tr>
                <td><strong>{$ref}</strong></td>
                <td>{$dist}</td>
                <td style='text-align:right'>{$mont}</td>
                <td><span class='badge orange'>Échue le {$ech}</span></td>
                <td><span class='badge red'>{$jours} j de retard</span></td>
            </tr>";
        }

        $tableau = "<table>
            <thead><tr>
                <th>Référence</th><th>Distributeur</th>
                <th style='text-align:right'>Montant</th>
                <th>Échéance</th><th>Retard</th>
            </tr></thead>
            <tbody>{$lignes}</tbody>
        </table>";

        $nb = $lcrs->count();
        return $this->htmlBase(
            "⚠️ {$nb} LCR en retard",
            "Les lettres de change suivantes dépassent leur date d'échéance et n'ont pas encore été réglées.",
            $tableau,
            $config
        );
    }

    private function htmlEcheanceLcr($lcrs, Configuration $config, string $delai): string
    {
        $lignes = '';
        foreach ($lcrs as $lcr) {
            $ref  = htmlspecialchars($lcr->reference);
            $dist = htmlspecialchars($lcr->distributeur?->nom ?? '—');
            $mont = number_format((float) $lcr->montant_ttc, 2, ',', ' ') . ' €';
            $ech  = $lcr->date_echeance?->format('d/m/Y') ?? '—';
            $lignes .= "<tr>
                <td><strong>{$ref}</strong></td>
                <td>{$dist}</td>
                <td style='text-align:right'>{$mont}</td>
                <td><span class='badge blue'>Le {$ech}</span></td>
            </tr>";
        }

        $tableau = "<table>
            <thead><tr>
                <th>Référence</th><th>Distributeur</th>
                <th style='text-align:right'>Montant</th><th>Échéance</th>
            </tr></thead>
            <tbody>{$lignes}</tbody>
        </table>";

        $nb = $lcrs->count();
        return $this->htmlBase(
            "📅 {$nb} LCR arrivent à échéance ({$delai})",
            "Les lettres de change suivantes arrivent à échéance {$delai}. Pensez à les régler avant la date limite.",
            $tableau,
            $config
        );
    }

    private function htmlRetourOffice($offices, Configuration $config): string
    {
        $lignes = '';
        foreach ($offices as $off) {
            $ref   = htmlspecialchars($off->reference);
            $dist  = htmlspecialchars($off->distributeur?->nom ?? '—');
            $mont  = number_format((float) $off->montant_ttc, 2, ',', ' ') . ' €';
            $date  = $off->date_retour_limite?->format('d/m/Y') ?? '—';
            $jours = max(0, $off->jours_retour_restants);
            $badge = $jours <= 2 ? 'red' : 'orange';
            $lignes .= "<tr>
                <td><strong>{$ref}</strong></td>
                <td>{$dist}</td>
                <td style='text-align:right'>{$mont}</td>
                <td><span class='badge {$badge}'>{$jours}j — {$date}</span></td>
            </tr>";
        }

        $tableau = "<table>
            <thead><tr>
                <th>Référence</th><th>Distributeur</th>
                <th style='text-align:right'>Montant</th><th>Retour avant</th>
            </tr></thead>
            <tbody>{$lignes}</tbody>
        </table>";

        $nb = $offices->count();
        return $this->htmlBase(
            "📦 {$nb} office(s) à retourner",
            "Les offices suivants approchent de leur date limite de retour. Pensez à procéder au retour avant la date indiquée.",
            $tableau,
            $config
        );
    }

    private function htmlRecapHebdo(int $lcrsRetard, int $lcrsSemaine, int $officesRetour, Configuration $config): string
    {
        $coulRetard = $lcrsRetard > 0 ? '#b91c1c' : '#16a34a';
        $coulSemaine = $lcrsSemaine > 0 ? '#c2410c' : '#16a34a';
        $coulOffices = $officesRetour > 0 ? '#c2410c' : '#16a34a';

        $kpis = "<div class='kpi-row'>
            <div class='kpi'>
                <div class='kpi-val' style='color:{$coulRetard}'>{$lcrsRetard}</div>
                <div class='kpi-lbl'>LCR en retard</div>
            </div>
            <div class='kpi'>
                <div class='kpi-val' style='color:{$coulSemaine}'>{$lcrsSemaine}</div>
                <div class='kpi-lbl'>LCR cette semaine</div>
            </div>
            <div class='kpi'>
                <div class='kpi-val' style='color:{$coulOffices}'>{$officesRetour}</div>
                <div class='kpi-lbl'>Offices à retourner</div>
            </div>
        </div>";

        $conseils = '';
        if ($lcrsRetard > 0)    $conseils .= "<li>Traitez les <strong>{$lcrsRetard} LCR en retard</strong> en priorité.</li>";
        if ($lcrsSemaine > 0)   $conseils .= "<li><strong>{$lcrsSemaine} LCR</strong> arrivent à échéance dans les 7 prochains jours.</li>";
        if ($officesRetour > 0) $conseils .= "<li><strong>{$officesRetour} office(s)</strong> doivent être retournés avant 7 jours.</li>";
        if (!$conseils) $conseils = "<li>Aucune action urgente cette semaine. ✓</li>";

        $contenu = $kpis . "<ul style='font-size:14px;line-height:1.8;color:#3f3f46'>{$conseils}</ul>";

        return $this->htmlBase(
            '📊 Récapitulatif hebdomadaire',
            'Voici le résumé de la semaine pour votre librairie.',
            $contenu,
            $config
        );
    }
}
