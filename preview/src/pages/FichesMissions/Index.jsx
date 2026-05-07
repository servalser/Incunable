import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { fiches_missions as mockFichesMissions } from '../../data/mock.js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card.jsx';
import { Badge } from '../../components/UI/Badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select.jsx';
import { Progress } from '../../components/ui/progress.jsx';
import { TrendingUp, TrendingDown, Minus, Star, ListChecks, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Helpers de formatage ─────────────────────────────────────────────── */

const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

const tronquer = (texte, max = 120) =>
  texte && texte.length > max ? texte.slice(0, max) + '…' : texte;

/* ── Badge score de recommandation ──────────────────────────────────────
   Vert ≥ 80, orange 60-79, rouge < 60 */
function ScoreBadge({ score }) {
  const variant =
    score >= 80 ? 'success'
    : score >= 60 ? 'warning'
    : 'destructive';

  return (
    <Badge variant={variant} className="gap-1">
      <Star className="h-3 w-3" />
      Score {score}
    </Badge>
  );
}

/* ── Badge statut fiche mission ─────────────────────────────────────── */
function StatutBadge({ statut }) {
  const cfg = {
    non_traite: { variant: 'warning',     label: 'Non traitée' },
    en_cours:   { variant: 'info',        label: 'En cours'    },
    commande:   { variant: 'success',     label: 'Commandée'   },
    rejete:     { variant: 'neutral',     label: 'Rejetée'     },
  }[statut] ?? { variant: 'neutral', label: statut };

  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/* ── Badge priorité ─────────────────────────────────────────────────── */
function PrioriteBadge({ priorite }) {
  const cfg = {
    haute:   { variant: 'destructive', label: 'Priorité haute'   },
    normale: { variant: 'warning',     label: 'Priorité normale' },
    faible:  { variant: 'neutral',     label: 'Priorité faible'  },
  }[priorite] ?? { variant: 'neutral', label: priorite };

  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/* ── Indicateur de tendance ─────────────────────────────────────────── */
function Tendance({ valeur }) {
  const cfg = {
    hausse: { icon: TrendingUp,   label: 'En hausse', color: 'text-success'     },
    baisse: { icon: TrendingDown, label: 'En baisse', color: 'text-destructive' },
    stable: { icon: Minus,        label: 'Stable',    color: 'text-muted-foreground' },
  }[valeur] ?? { icon: Minus, label: valeur, color: 'text-muted-foreground' };

  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', cfg.color)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

/* ── Barres de comparaison réseau vs librairie ──────────────────────────
   Deux barres Progress côte à côte — réseau en primary, librairie en purple */
function BarreComparaison({ reseau, librairie }) {
  const max = Math.max(reseau, librairie, 1);
  const pctReseau    = Math.round((reseau    / max) * 100);
  const pctLibrairie = Math.round((librairie / max) * 100);

  return (
    <div className="space-y-2 mt-2">
      {/* Barre réseau */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Réseau moyen</span>
          <span className="font-semibold text-primary">{reseau} /mois</span>
        </div>
        <Progress value={pctReseau} className="h-1.5" />
      </div>
      {/* Barre librairie */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Votre librairie</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">{librairie} /mois</span>
        </div>
        {/* On utilise une barre manuelle pour avoir la couleur purple */}
        <div className="h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-500"
            style={{ width: `${pctLibrairie}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Page principale : liste des fiches missions ────────────────────── */
export default function FichesMissionsIndex() {
  const navigate = useNavigate();

  const [items] = useState(mockFichesMissions);

  /* ── Filtres ─────────────────────────────────────────────────────── */
  const [filtreStatut,   setFiltreStatut]   = useState('');
  const [filtrePriorite, setFiltrePriorite] = useState('');
  const [filtreTendance, setFiltreTendance] = useState('');

  /* ── Calculs KPI ─────────────────────────────────────────────────── */
  const total       = items.length;
  const nonTraitees = items.filter((f) => f.statut === 'non_traite').length;
  const enCours     = items.filter((f) => f.statut === 'en_cours').length;
  const traitees    = items.filter((f) => f.statut === 'commande' || f.statut === 'rejete').length;

  /* ── Filtrage local ──────────────────────────────────────────────── */
  const filtrees = items.filter((f) => {
    if (filtreStatut   && f.statut   !== filtreStatut)   return false;
    if (filtrePriorite && f.priorite !== filtrePriorite) return false;
    if (filtreTendance && f.tendance !== filtreTendance) return false;
    return true;
  });

  return (
    <AppLayout title="Fiches Missions">

      {/* ── En-tête de page ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fiches Missions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recommandations basées sur l'analyse cross-clients du réseau
          </p>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total fiches</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Non traitées</CardTitle>
            <Clock className={cn('h-4 w-4', nonTraitees > 0 ? 'text-destructive' : 'text-muted-foreground')} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', nonTraitees > 0 && 'text-destructive')}>
              {nonTraitees}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {nonTraitees > 0 ? 'Décision requise' : 'Tout à jour'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{enCours}</div>
            <p className="text-xs text-muted-foreground mt-1">En traitement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Traitées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{traitees}</div>
            <p className="text-xs text-muted-foreground mt-1">Commandées ou rejetées</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Barre de filtres ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">

        <Select value={filtreStatut || 'all'} onValueChange={(v) => setFiltreStatut(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="non_traite">Non traitées</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="commande">Commandées</SelectItem>
            <SelectItem value="rejete">Rejetées</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtrePriorite || 'all'} onValueChange={(v) => setFiltrePriorite(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Toutes priorités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="haute">Haute</SelectItem>
            <SelectItem value="normale">Normale</SelectItem>
            <SelectItem value="faible">Faible</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtreTendance || 'all'} onValueChange={(v) => setFiltreTendance(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Toutes tendances" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes tendances</SelectItem>
            <SelectItem value="hausse">En hausse</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="baisse">En baisse</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* ── Compteur de résultats ────────────────────────────────────── */}
      <p className="text-sm text-muted-foreground mb-4">
        {filtrees.length} fiche{filtrees.length !== 1 ? 's' : ''} affichée{filtrees.length !== 1 ? 's' : ''}
      </p>

      {/* ── État vide ────────────────────────────────────────────────── */}
      {filtrees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune fiche ne correspond aux filtres sélectionnés.
          </CardContent>
        </Card>
      )}

      {/* ── Grille de cards ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {filtrees.map((fiche) => (
          <Card key={fiche.id} className="overflow-hidden">

            {/* En-tête : score + priorité + tendance */}
            <CardHeader className="flex flex-row items-center gap-2 flex-wrap space-y-0 pb-3">
              <ScoreBadge score={fiche.score} />
              <PrioriteBadge priorite={fiche.priorite} />
              <Tendance valeur={fiche.tendance} />
            </CardHeader>

            {/* Corps : titre, auteur/isbn, barres, contexte */}
            <CardContent className="space-y-3 pb-3">
              <div>
                <p className="font-bold text-base leading-tight">{fiche.titre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fiche.auteur} — <span className="font-mono">{fiche.isbn}</span> — {fiche.editeur}
                </p>
              </div>

              <BarreComparaison
                reseau={fiche.ventes_moy_reseau_mois}
                librairie={fiche.ventes_librairie_mois}
              />

              <p className="text-sm text-muted-foreground leading-relaxed">
                {tronquer(fiche.contexte, 120)}
              </p>
            </CardContent>

            {/* Pied : statut + date + bouton */}
            <CardFooter className="flex items-center justify-between flex-wrap gap-2 border-t pt-3">
              <div className="flex items-center gap-2">
                <StatutBadge statut={fiche.statut} />
                <span className="text-xs text-muted-foreground">{dateFr(fiche.created_at)}</span>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/fiches-missions/${fiche.id}`)}
              >
                Voir &amp; Répondre →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

    </AppLayout>
  );
}
