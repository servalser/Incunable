import { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { rapports } from '../../data/mock.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';
import { ChevronRight, TrendingUp, TrendingDown, BarChart2, BookOpen, Calendar, Download, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Helpers de formatage ─────────────────────────────────────────────── */

const euro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Indicateur d'évolution ─────────────────────────────────────────── */
function Evolution({ percent }) {
  if (percent === 0) return <span className="text-muted-foreground text-sm">Données insuffisantes</span>;
  const hausse = percent > 0;
  return (
    <span className={cn('inline-flex items-center gap-1 font-bold',
      hausse ? 'text-success' : 'text-destructive')}>
      {hausse
        ? <TrendingUp className="h-4 w-4" />
        : <TrendingDown className="h-4 w-4" />}
      {Math.abs(percent).toFixed(1)} %
    </span>
  );
}

/* ── Composant graphique à barres (Chart.js via window.Chart) ──────────
   Chart.js est chargé depuis le CDN par AppLayout (window.Chart).
   useRef accède directement au <canvas>. useEffect s'exécute après rendu.
   On détruit l'ancienne instance avant d'en créer une nouvelle pour éviter
   que deux graphiques se superposent dans le registre interne de Chart.js. */
function GraphiqueVentes({ data, titre }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return;
    if (!data || data.length === 0) return;

    /* Détruire l'instance précédente */
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.semaine),
        datasets: [{
          label: 'Ventes (€)',
          data: data.map((d) => d.ventes),
          backgroundColor: '#059669',   /* vert émeraude */
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
                  .format(ctx.parsed.y),
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) =>
                new Intl.NumberFormat('fr-FR', {
                  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
                }).format(val),
            },
          },
        },
      },
    });

    /* Nettoyage au démontage du composant */
    return () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titre}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* hauteur fixe requise par Chart.js avec maintainAspectRatio: false */}
        <div className="relative h-64">
          {data && data.length > 0 ? (
            <canvas ref={canvasRef} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Données de graphique non disponibles.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Page principale : Détail d'un rapport ───────────────────────────── */
export default function RapportDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const rapport = rapports.find((r) => r.id === Number(id));

  /* ── Rapport introuvable ──────────────────────────────────────────── */
  if (!rapport) {
    return (
      <AppLayout title="Rapport introuvable">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Rapport introuvable</h1>
        <Card>
          <CardContent className="py-6 space-y-4">
            <p className="text-muted-foreground">
              Aucun rapport ne correspond à l'identifiant{' '}
              <code className="font-mono bg-muted px-1 rounded">#{id}</code>.
            </p>
            <Button variant="outline" onClick={() => navigate('/rapports')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const nbSemaines = rapport.chart_ventes?.length ?? 0;

  return (
    <AppLayout title={`Rapport — ${rapport.periode}`}>

      {/* ── Fil d'Ariane ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm mb-6 text-muted-foreground">
        <Link to="/rapports" className="hover:text-foreground transition-colors">Rapports</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{rapport.periode}</span>
      </div>

      {/* ── En-tête de page ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{rapport.periode}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dateFr(rapport.date_debut)} → {dateFr(rapport.date_fin)}
            {' · '}Généré le {dateFr(rapport.created_at)} par {rapport.cree_par}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/rapports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.__toast('Export PDF disponible après configuration du backend.', 'info')}
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* ── Grille de KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* KPI 1 : CA total TTC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CA total TTC</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{euro(rapport.total_ventes_ttc)}</div>
            <p className="text-xs text-muted-foreground mt-1">chiffre d'affaires</p>
          </CardContent>
        </Card>

        {/* KPI 2 : titres vendus */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Titres vendus</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rapport.nb_titres_vendus}</div>
            <p className="text-xs text-muted-foreground mt-1">exemplaires</p>
          </CardContent>
        </Card>

        {/* KPI 3 : évolution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Évolution</CardTitle>
            {rapport.evolution_percent >= 0
              ? <TrendingUp className="h-4 w-4 text-success" />
              : <TrendingDown className="h-4 w-4 text-destructive" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Evolution percent={rapport.evolution_percent} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs période précédente</p>
          </CardContent>
        </Card>

        {/* KPI 4 : nombre de semaines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Période</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nbSemaines}</div>
            <p className="text-xs text-muted-foreground mt-1">
              semaine{nbSemaines !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Graphique à barres ───────────────────────────────────────── */}
      <div className="mb-6">
        <GraphiqueVentes data={rapport.chart_ventes} titre="Ventes par période (€)" />
      </div>

      {/* ── Tableau Top Ventes ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top ventes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rapport.top_ventes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Données non disponibles.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead className="text-right">Qté vendue</TableHead>
                  <TableHead className="text-right">CA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rapport.top_ventes.map((livre, idx) => (
                  <TableRow key={idx}>
                    {/* Médaille pour le podium */}
                    <TableCell className="font-bold text-muted-foreground">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{livre.titre}</TableCell>
                    <TableCell className="text-muted-foreground">{livre.auteur}</TableCell>
                    <TableCell className="text-right tabular-nums">{livre.quantite}</TableCell>
                    <TableCell className="text-right font-mono">{euro(livre.ca)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </AppLayout>
  );
}
