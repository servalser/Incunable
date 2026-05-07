import { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Layout/AppLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/button.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table.jsx';
import {
  stats, chart_data, distrib_stats,
  alertes_retard, alertes_proches, alertes_offices, lettres,
} from '../data/mock.js';
import {
  CalendarDays, Clock, AlertTriangle, Bell, ArrowRight, TrendingUp,
} from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────── */
const euro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Carte KPI ────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, variant = 'default', linkTo }) {
  const navigate = useNavigate();

  const colorMap = {
    default: 'text-primary',
    accent:  'text-primary',
    danger:  'text-destructive',
    warning: 'text-warning',
    success: 'text-success',
  };

  const bgMap = {
    default: 'bg-primary/10',
    accent:  'bg-primary/10',
    danger:  'bg-destructive/10',
    warning: 'bg-warning/10',
    success: 'bg-success/10',
  };

  const color = colorMap[variant] ?? colorMap.default;
  const bg    = bgMap[variant]    ?? bgMap.default;

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${linkTo ? 'cursor-pointer' : ''}`}
      onClick={linkTo ? () => navigate(linkTo) : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variant !== 'default' && variant !== 'accent' ? color : ''}`}>
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

/* ── Ligne alerte ─────────────────────────────────────────────── */
function AlertRow({ reference, id, distributeur, montant, right, route, urgent }) {
  return (
    <Link
      to={`/${route}/${id}`}
      className="flex items-center gap-4 px-4 py-2.5 hover:bg-muted/40 transition-colors rounded-lg"
    >
      <span className="font-mono text-xs font-medium text-primary w-28 shrink-0">{reference}</span>
      <span className="flex-1 text-sm text-muted-foreground truncate">{distributeur}</span>
      <span className="font-mono text-sm font-semibold w-28 text-right">{euro(montant)}</span>
      <span className={`text-xs font-medium w-32 text-right ${urgent ? 'text-destructive' : 'text-warning'}`}>
        {right}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </Link>
  );
}

/* ── Dashboard ────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const prochaines = lettres
    .filter((l) => l.jours_restants >= 0 && l.jours_restants <= 7)
    .sort((a, b) => a.jours_restants - b.jours_restants)
    .slice(0, 5);

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  /* ── Chart.js ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const isDark = document.body.classList.contains('dark');
    const gridColor   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const tickColor   = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: chart_data.map((d) => d.label),
        datasets: [
          {
            label: 'LCR (€)',
            data: chart_data.map((d) => d.lettres),
            backgroundColor: 'hsl(221 83% 53% / 0.8)',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Offices (€)',
            data: chart_data.map((d) => d.offices),
            backgroundColor: 'hsl(142 71% 45% / 0.6)',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: tickColor, font: { size: 11 }, boxRadius: 4 } },
          tooltip: { callbacks: { label: (ctx) => ` ${euro(ctx.raw)}` } },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 10 } },
            border: { display: false },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { size: 10 },
              callback: (v) => `${(v / 1000).toFixed(0)}k`,
            },
            border: { display: false },
          },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, []);

  const nbAlertes = alertes_retard.length + alertes_proches.length + alertes_offices.length;

  return (
    <AppLayout title="Tableau de bord">

      {/* ── En-tête ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/lettres/creer">+ Nouvelle LCR</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/offices/creer">+ Nouvelle office</Link>
          </Button>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Dû ce mois"
          value={euro(stats.du_ce_mois)}
          sub="LCR à régler en avril"
          icon={CalendarDays}
          variant="accent"
        />
        <KpiCard
          label="Horizon 30 jours"
          value={euro(stats.du_30j)}
          sub="Toutes échéances confondues"
          icon={Clock}
        />
        <KpiCard
          label="En retard"
          value={euro(stats.en_retard)}
          sub={`${alertes_retard.length} lettre(s) concernée(s)`}
          icon={AlertTriangle}
          variant={stats.en_retard > 0 ? 'danger' : 'default'}
          linkTo={stats.en_retard > 0 ? '/lettres' : undefined}
        />
        <KpiCard
          label="Offices en alerte"
          value={stats.offices_alerte}
          sub="Retour limite proche ou dépassée"
          icon={Bell}
          variant={stats.offices_alerte > 0 ? 'warning' : 'default'}
          linkTo={stats.offices_alerte > 0 ? '/offices' : undefined}
        />
      </div>

      {/* ── Alertes actives ────────────────────────────────── */}
      {nbAlertes > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Alertes actives
            </CardTitle>
            <Badge variant="destructive">{nbAlertes}</Badge>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">

            {alertes_retard.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1 px-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  <span className="text-xs font-semibold text-destructive">
                    Lettres en retard — {alertes_retard.length}
                  </span>
                </div>
                {alertes_retard.map((l) => (
                  <AlertRow key={l.id} id={l.id} reference={l.reference}
                    distributeur={l.distributeur} montant={l.montant_ttc}
                    right={`${Math.abs(l.jours_restants)}j de retard`} route="lettres" urgent />
                ))}
              </div>
            )}

            {alertes_proches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1 px-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  <span className="text-xs font-semibold text-warning">
                    Échéances dans moins de 7 jours — {alertes_proches.length}
                  </span>
                </div>
                {alertes_proches.map((l) => (
                  <AlertRow key={l.id} id={l.id} reference={l.reference}
                    distributeur={l.distributeur} montant={l.montant_ttc}
                    right={l.jours_restants === 0 ? "Aujourd'hui" : `${l.jours_restants}j restant(s)`}
                    route="lettres" urgent={l.jours_restants <= 2} />
                ))}
              </div>
            )}

            {alertes_offices.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1 px-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Retour d'office dans moins de 30 jours — {alertes_offices.length}
                  </span>
                </div>
                {alertes_offices.map((o) => (
                  <AlertRow key={o.id} id={o.id} reference={o.reference}
                    distributeur={o.distributeur} montant={o.montant_ttc}
                    right={`Retour le ${dateFr(o.date_retour_limite)}`} route="offices" />
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* ── Graphique + Fournisseurs ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Graphique */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution sur 12 mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <canvas ref={canvasRef} />
            </div>
          </CardContent>
        </Card>

        {/* Fournisseurs */}
        <Card>
          <CardHeader>
            <CardTitle>Montants par fournisseur</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {distrib_stats.map((d, i) => {
              const max = distrib_stats[0].total;
              const pct = Math.round((d.total / max) * 100);
              return (
                <div key={d.nom} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{d.nom}</span>
                      <span className="font-mono text-sm font-semibold">{euro(d.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>

      {/* ── Prochaines échéances ────────────────────────────── */}
      {prochaines.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Prochaines échéances
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/lettres">Tout voir</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead className="text-right">Échéance</TableHead>
                  <TableHead className="text-center">Urgence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prochaines.map((l) => {
                  const isToday  = l.jours_restants === 0;
                  const isUrgent = l.jours_restants <= 2;
                  const label    = isToday ? "Aujourd'hui" : `${l.jours_restants}j`;
                  const urgClass = isUrgent || isToday
                    ? 'bg-destructive/10 text-destructive'
                    : l.jours_restants <= 5
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success';
                  return (
                    <TableRow
                      key={l.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/lettres/${l.id}`)}
                    >
                      <TableCell>
                        <Link
                          className="font-mono text-xs text-primary hover:underline"
                          to={`/lettres/${l.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {l.reference}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{l.distributeur.nom}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{euro(l.montant_ttc)}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">{dateFr(l.date_echeance)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${urgClass}`}>
                          {label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

    </AppLayout>
  );
}
