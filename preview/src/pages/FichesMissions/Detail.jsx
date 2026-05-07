import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { fiches_missions as mockFichesMissions } from '../../data/mock.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Badge } from '../../components/UI/Badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Progress } from '../../components/ui/progress.jsx';
import { Separator } from '../../components/ui/separator.jsx';
import {
  ChevronRight, TrendingUp, TrendingDown, Minus,
  ArrowLeft, ShoppingCart, X, Save, RotateCcw, Network, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Helpers ─────────────────────────────────────────────────────────── */

const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

const pctLabel = (val) => {
  if (val === null || val === undefined) return '—';
  return `${val > 0 ? '+' : ''}${val} %`;
};

/* ── Badge statut fiche ─────────────────────────────────────────────── */
function StatutBadge({ statut }) {
  const cfg = {
    non_traite: { variant: 'warning',  label: 'Non traitée' },
    en_cours:   { variant: 'info',     label: 'En cours'    },
    commande:   { variant: 'success',  label: 'Commandée'   },
    rejete:     { variant: 'neutral',  label: 'Rejetée'     },
  }[statut] ?? { variant: 'neutral', label: statut };

  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/* ── Grande barre de comparaison réseau vs librairie ────────────────── */
function BarreComparaisonLarge({ reseau, librairie }) {
  const max = Math.max(reseau, librairie, 1);
  const pctReseau    = Math.round((reseau    / max) * 100);
  const pctLibrairie = Math.round((librairie / max) * 100);

  return (
    <div className="space-y-3 mt-3">
      {/* Barre réseau */}
      <div>
        <div className="flex justify-between text-sm font-semibold mb-1.5">
          <span className="text-muted-foreground">Réseau moyen</span>
          <span className="text-primary">{reseau} ventes / mois</span>
        </div>
        <Progress value={pctReseau} className="h-2.5" />
      </div>
      {/* Barre librairie */}
      <div>
        <div className="flex justify-between text-sm font-semibold mb-1.5">
          <span className="text-muted-foreground">Votre librairie</span>
          <span className="text-purple-600 dark:text-purple-400">{librairie} ventes / mois</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-500"
            style={{ width: `${pctLibrairie}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Page principale : détail d'une fiche mission ──────────────────── */
export default function FicheMissionDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* Clone local des fiches pour simuler les mises à jour */
  const [items, setItems] = useState(mockFichesMissions);
  const fiche = items.find((f) => f.id === Number(id));

  /* ── Fiche introuvable ──────────────────────────────────────────── */
  if (!fiche) {
    return (
      <AppLayout title="Fiche introuvable">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Fiche introuvable</h1>
        <Card>
          <CardContent className="py-6 space-y-4">
            <p className="text-muted-foreground">
              Aucune fiche ne correspond à l'identifiant{' '}
              <code className="font-mono bg-muted px-1 rounded">#{id}</code>.
            </p>
            <Button variant="outline" asChild>
              <Link to="/fiches-missions">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  /* ── State local pour les champs modifiables ────────────────────── */
  const [reponse, setReponse] = useState(fiche.reponse ?? '');
  const [statut,  setStatut]  = useState(fiche.statut);

  /* Couleur de l'écart par rapport au réseau */
  const ecartCouleur =
    fiche.ecart_percent === null   ? 'text-muted-foreground'
    : fiche.ecart_percent > 0      ? 'text-warning'
    : fiche.ecart_percent < -50    ? 'text-destructive'
    : 'text-success';

  /* Tendance */
  const tendanceCfg = {
    hausse: { icon: TrendingUp,   label: '↑ En hausse', color: 'text-success'     },
    baisse: { icon: TrendingDown, label: '↓ En baisse', color: 'text-destructive' },
    stable: { icon: Minus,        label: '→ Stable',    color: 'text-muted-foreground' },
  }[fiche.tendance] ?? { icon: Minus, label: '—', color: 'text-muted-foreground' };
  const TendanceIcon = tendanceCfg.icon;

  /* ── Mise à jour de la fiche dans l'état local ──────────────────── */
  const mettreAJour = (nouveauStatut, nouvelleReponse) => {
    setStatut(nouveauStatut);
    setItems((prev) =>
      prev.map((f) =>
        f.id === fiche.id ? { ...f, statut: nouveauStatut, reponse: nouvelleReponse } : f
      )
    );
  };

  /* ── Handlers des boutons d'action ─────────────────────────────── */
  const handleEnCours  = () => { mettreAJour('en_cours', reponse);  window.__toast('Fiche marquée en cours', 'info');                };
  const handleCommande = () => { mettreAJour('commande', reponse);  window.__toast('Fiche marquée comme commandée', 'success');       };
  const handleRejeter  = () => { mettreAJour('rejete',   reponse);  window.__toast('Fiche rejetée', 'info');                         };
  const handleSauvegarder = () => { mettreAJour(statut, reponse);   window.__toast('Réponse sauvegardée', 'success');                };
  const handleRouvrir  = () => { mettreAJour('non_traite', reponse); window.__toast('Fiche réouverte', 'info');                      };

  /* Couleur du bandeau selon priorité */
  const bandeauVariant = {
    haute:   'border-destructive/40 bg-destructive/5',
    normale: 'border-warning/40 bg-warning/5',
    faible:  'border-border bg-muted/30',
  }[fiche.priorite] ?? 'border-border bg-muted/30';

  const scoreColor = {
    haute:   'text-destructive',
    normale: 'text-warning',
    faible:  'text-muted-foreground',
  }[fiche.priorite] ?? 'text-foreground';

  return (
    <AppLayout title={fiche.titre}>

      {/* ── Fil d'Ariane ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm mb-6 text-muted-foreground">
        <Link to="/fiches-missions" className="hover:text-foreground transition-colors">
          Fiches Missions
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-xs">
          {fiche.titre.length > 40 ? fiche.titre.slice(0, 40) + '…' : fiche.titre}
        </span>
      </div>

      {/* ── Bouton retour ─────────────────────────────────────────── */}
      <div className="mb-5">
        <Button variant="outline" size="sm" onClick={() => navigate('/fiches-missions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      {/* ── Bandeau priorité avec score en grand ─────────────────── */}
      <div className={cn(
        'rounded-xl border p-5 mb-5 flex items-center justify-between flex-wrap gap-4',
        bandeauVariant,
      )}>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Score de recommandation</p>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-5xl font-extrabold leading-none', scoreColor)}>
              {fiche.score}
            </span>
            <span className="text-lg text-muted-foreground font-normal">/ 100</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <StatutBadge statut={statut} />
          <span className="text-xs text-muted-foreground">Reçue le {dateFr(fiche.created_at)}</span>
        </div>
      </div>

      {/* ── Informations du livre ─────────────────────────────────── */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="text-base">Informations du livre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
            {[
              { label: 'ISBN',             value: <span className="font-mono font-semibold">{fiche.isbn}</span> },
              { label: 'Auteur',           value: fiche.auteur },
              { label: 'Éditeur',          value: fiche.editeur },
              { label: 'Catégorie',        value: fiche.categorie },
              { label: 'Prix TTC',         value: <span className="font-mono font-semibold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(fiche.prix_ttc)}
                </span> },
              { label: 'Tendance réseau',  value: (
                  <span className={cn('inline-flex items-center gap-1 font-semibold', tendanceCfg.color)}>
                    <TendanceIcon className="h-3.5 w-3.5" />
                    {tendanceCfg.label}
                  </span>
              )},
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <div className="font-semibold text-sm">{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Analyse comparative ───────────────────────────────────── */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="text-base">Analyse comparative</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Deux colonnes de stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Dans le réseau */}
            <div className="rounded-lg bg-muted/40 border border-primary/20 border-l-4 border-l-primary p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1.5">Dans le réseau</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-primary leading-none">
                  {fiche.nb_librairies_vendant}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{fiche.nb_librairies_reseau} librairies
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {fiche.ventes_moy_reseau_mois} ventes/mois en moyenne
              </p>
            </div>

            {/* Votre librairie */}
            <div className="rounded-lg bg-muted/40 border border-purple-300/40 border-l-4 border-l-purple-500 p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1.5">Votre librairie</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 leading-none">
                  {fiche.ventes_librairie_mois}
                </span>
                <span className="text-sm text-muted-foreground">ventes ce mois</span>
              </div>
              <p className={cn('text-xs font-semibold mt-1.5', ecartCouleur)}>
                Écart : {pctLabel(fiche.ecart_percent)} vs réseau
              </p>
            </div>
          </div>

          {/* Barres de comparaison */}
          <BarreComparaisonLarge
            reseau={fiche.ventes_moy_reseau_mois}
            librairie={fiche.ventes_librairie_mois}
          />
        </CardContent>
      </Card>

      {/* ── Analyse du réseau ─────────────────────────────────────── */}
      <Card className="mb-5">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Network className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Analyse du réseau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 border-l-4 border-primary rounded-r-lg px-4 py-3 text-sm leading-relaxed">
            {fiche.contexte}
          </div>
        </CardContent>
      </Card>

      {/* ── Réponse du libraire ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votre réponse</CardTitle>
        </CardHeader>
        <CardContent>
          {(statut === 'non_traite' || statut === 'en_cours') ? (

            /* ── Cas 1 : fiche encore ouverte ── */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reponse">Notes ou commentaires (optionnel)</Label>
                <Textarea
                  id="reponse"
                  rows={4}
                  placeholder="Expliquez votre décision, ajoutez un commentaire…"
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cette note sera sauvegardée avec votre décision.
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleEnCours}>
                  <Clock className="h-4 w-4 mr-2" />
                  En cours
                </Button>
                <Button
                  className="bg-success hover:bg-success/90 text-white"
                  onClick={handleCommande}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Passer commande
                </Button>
                <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/5" onClick={handleRejeter}>
                  <X className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSauvegarder}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>

          ) : (

            /* ── Cas 2 : fiche terminée ── */
            <div className="space-y-4">
              {reponse ? (
                <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm leading-relaxed">
                  {reponse}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Aucune note enregistrée pour cette fiche.
                </p>
              )}
              <Button variant="outline" size="sm" onClick={handleRouvrir}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rouvrir cette fiche
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </AppLayout>
  );
}

