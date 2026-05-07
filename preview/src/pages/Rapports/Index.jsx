import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { rapports } from '../../data/mock.js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card.jsx';
import { Badge } from '../../components/UI/Badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Separator } from '../../components/ui/separator.jsx';
import { FileText, TrendingUp, TrendingDown, Minus, BarChart2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Helpers de formatage ─────────────────────────────────────────────── */

/* Formate un montant en euros */
const euro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

/* Formate une date ISO courte */
const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Badge de type de rapport ─────────────────────────────────────────── */
function BadgeType({ type }) {
  return (
    <Badge variant={type === 'mensuel' ? 'success' : 'accent'}>
      {type === 'mensuel' ? 'Mensuel' : 'Hebdomadaire'}
    </Badge>
  );
}

/* ── Badge de statut du rapport ───────────────────────────────────────── */
function BadgeStatut({ statut }) {
  return (
    <Badge variant={statut === 'genere' ? 'success' : 'warning'}>
      {statut === 'genere' ? 'Généré' : 'En cours'}
    </Badge>
  );
}

/* ── Indicateur d'évolution avec icône Lucide ─────────────────────────── */
function Evolution({ percent }) {
  if (percent === 0) return <span className="text-muted-foreground text-sm">—</span>;
  const hausse = percent > 0;
  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold text-sm',
      hausse ? 'text-success' : 'text-destructive')}>
      {hausse
        ? <TrendingUp className="h-3.5 w-3.5" />
        : <TrendingDown className="h-3.5 w-3.5" />}
      {Math.abs(percent).toFixed(1)} %
    </span>
  );
}

/* ── Carte d'un rapport ───────────────────────────────────────────────── */
function CarteRapport({ rapport, onVoir }) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onVoir(rapport.id)}
    >
      {/* En-tête : période + badge type */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{rapport.periode}</CardTitle>
        <BadgeType type={rapport.type} />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Statut de génération */}
        <BadgeStatut statut={rapport.statut} />

        {rapport.statut === 'en_cours' ? (
          <p className="text-sm text-muted-foreground">
            Ce rapport est en cours de génération…
          </p>
        ) : (
          /* Métriques clés en grille 2×2 */
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">CA total TTC</p>
              <p className="font-bold font-mono text-base">{euro(rapport.total_ventes_ttc)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Titres vendus</p>
              <p className="font-bold text-base">{rapport.nb_titres_vendus}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Évolution</p>
              <Evolution percent={rapport.evolution_percent} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Généré le</p>
              <p className="text-sm text-muted-foreground">{dateFr(rapport.created_at)}</p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Pied de carte avec bouton "Voir" */}
      <CardFooter className="flex justify-end pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onVoir(rapport.id); }}
        >
          Voir le rapport
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ── Page principale : Liste des rapports ────────────────────────────── */
export default function RapportsIndex() {
  const navigate = useNavigate();

  const voirRapport = (id) => navigate(`/rapports/${id}`);

  /* Calcul des KPIs globaux */
  const rapportsGeneres = rapports.filter(r => r.statut === 'genere');
  const mensuelGeneres  = rapportsGeneres.filter(r => r.type === 'mensuel');
  const caMoyenMensuel  = mensuelGeneres.length > 0
    ? mensuelGeneres.reduce((s, r) => s + r.total_ventes_ttc, 0) / mensuelGeneres.length
    : 0;

  /* Meilleur rapport = plus forte évolution positive */
  const meilleur = rapportsGeneres.reduce(
    (best, r) => (r.evolution_percent > (best?.evolution_percent ?? -Infinity) ? r : best),
    null
  );

  return (
    <AppLayout title="Rapports d'activité">

      {/* ── En-tête de page ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports d'activité</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rapports.length} rapport{rapports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/rapports/nouveau')}>
          <Plus className="h-4 w-4 mr-2" />
          Générer un rapport
        </Button>
      </div>

      {/* ── Grille de KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

        {/* KPI 1 : nombre total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total rapports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rapports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{rapportsGeneres.length} générés</p>
          </CardContent>
        </Card>

        {/* KPI 2 : CA moyen mensuel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CA moyen mensuel</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{euro(caMoyenMensuel)}</div>
            <p className="text-xs text-muted-foreground mt-1">sur {mensuelGeneres.length} mois</p>
          </CardContent>
        </Card>

        {/* KPI 3 : meilleure période */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meilleure période</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meilleur ? meilleur.periode : '—'}</div>
            {meilleur && (
              <p className="text-xs text-success mt-1 font-semibold">
                ▲ {meilleur.evolution_percent.toFixed(1)} %
              </p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Grille de cartes rapports ────────────────────────────────── */}
      {rapports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun rapport généré pour l'instant.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rapports.map((r) => (
            <CarteRapport key={r.id} rapport={r} onVoir={voirRapport} />
          ))}
        </div>
      )}

    </AppLayout>
  );
}
