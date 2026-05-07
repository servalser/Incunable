import { useState } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { dilicom_connexion, dilicom_flux } from '../../data/mock.js';

/* Composants shadcn */
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui/table.jsx';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '../../components/ui/select.jsx';

/* Icônes Lucide */
import {
  CheckCircle2, AlertTriangle, Settings2, RefreshCw, Zap,
  Send, FileText, ReceiptText, FileX, Plus, ArrowRightLeft,
} from 'lucide-react';

/* ── Helpers de formatage ─────────────────────────────────────────────── */

/* Formate un nombre en euros avec le format français */
const euro = (n) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

/* Formate une date ISO en "24/04/2025 à 06:12" */
const dateHeure = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return (
    d.toLocaleDateString('fr-FR') +
    ' à ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
};

/* ── Badges colorés pour le TYPE de flux ───────────────────────────────
   Chaque type de flux EDI a une couleur différente pour être identifiable */
function BadgeType({ type }) {
  const map = {
    commande:          { variant: 'info',    label: 'Commande'      },
    'accusé_reception':{ variant: 'neutral', label: 'Accusé récep.' },
    facture:           { variant: 'success', label: 'Facture'       },
    avoir:             { variant: 'warning', label: 'Avoir'         },
  };
  const item = map[type] ?? { variant: 'neutral', label: type };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/* ── Badges colorés pour le STATUT d'un flux ──────────────────────────── */
function BadgeStatut({ statut }) {
  const map = {
    transmis:   { variant: 'info',        label: 'Transmis'   },
    traite:     { variant: 'success',     label: 'Traité'     },
    erreur:     { variant: 'destructive', label: 'Erreur'     },
    en_attente: { variant: 'warning',     label: 'En attente' },
  };
  const item = map[statut] ?? { variant: 'neutral', label: statut };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/* ── Bandeau de statut de connexion ──────────────────────────────────────
   Affiche un bandeau coloré selon l'état de la connexion Dilicom/FEL.
   Le fond et la bordure changent selon le statut : vert, rouge ou orange. */
function BandeauConnexion({ connexion }) {
  /* Thème visuel par statut */
  const themes = {
    connecte: {
      wrapClass:   'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
      iconClass:   'text-green-600',
      titleClass:  'text-green-900 dark:text-green-300',
      metaClass:   'text-green-800/80 dark:text-green-400/80',
      codeClass:   'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    erreur: {
      wrapClass:   'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
      iconClass:   'text-destructive',
      titleClass:  'text-red-900 dark:text-red-300',
      metaClass:   'text-red-800/80 dark:text-red-400/80',
      codeClass:   '',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    non_configure: {
      wrapClass:   'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800',
      iconClass:   'text-yellow-600',
      titleClass:  'text-yellow-900 dark:text-yellow-300',
      metaClass:   'text-yellow-800/80 dark:text-yellow-400/80',
      codeClass:   '',
      icon: <Settings2 className="h-5 w-5" />,
    },
  };

  const theme = themes[connexion.statut] ?? themes.non_configure;

  return (
    <div className={`border rounded-lg p-4 mb-6 flex flex-wrap items-center gap-4 ${theme.wrapClass}`}>
      {/* Icône d'état */}
      <span className={`flex-shrink-0 ${theme.iconClass}`}>{theme.icon}</span>

      {/* Informations de connexion */}
      <div className="flex-1 min-w-0">
        {connexion.statut === 'connecte' && (
          <>
            <strong className={`font-semibold ${theme.titleClass}`}>
              Connecté au réseau FEL
            </strong>
            <div className={`flex flex-wrap gap-4 mt-1 text-xs ${theme.metaClass}`}>
              {/* GLN affiché en monospace pour bien le distinguer */}
              <span>
                GLN :{' '}
                <code className={`font-mono px-1.5 py-0.5 rounded ${theme.codeClass}`}>
                  {connexion.gln}
                </code>
              </span>
              <span>Protocole : {connexion.version_protocole}</span>
              <span>Dernière synchro : {dateHeure(connexion.derniere_synchro)}</span>
            </div>
          </>
        )}
        {connexion.statut === 'erreur' && (
          <strong className={`font-semibold ${theme.titleClass}`}>
            Erreur de connexion au réseau FEL — vérifiez votre GLN et les paramètres réseau.
          </strong>
        )}
        {connexion.statut === 'non_configure' && (
          <strong className={`font-semibold ${theme.titleClass}`}>
            Dilicom n'est pas encore configuré pour cette librairie.
          </strong>
        )}
      </div>

      {/* Bouton d'action contextuel */}
      <div className="flex-shrink-0">
        {connexion.statut === 'connecte' && (
          <Button
            size="sm"
            onClick={() => window.__toast('Synchronisation lancée avec le réseau FEL.', 'success')}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Synchroniser maintenant
          </Button>
        )}
        {connexion.statut === 'non_configure' && (
          <Button
            size="sm"
            onClick={() => window.__toast('Redirection vers la configuration Dilicom.', 'info')}
          >
            <Settings2 className="h-3.5 w-3.5 mr-2" />
            Configurer
          </Button>
        )}
        {connexion.statut === 'erreur' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.__toast('Tentative de reconnexion en cours...', 'info')}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Réessayer
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Page principale : Dashboard EDI Dilicom ──────────────────────────── */
export default function DilicomIndex() {
  /* Filtre actif : type de flux sélectionné ('all' = tous) */
  const [typeFilter,   setTypeFilter]   = useState('all');
  /* Filtre actif : statut sélectionné ('all' = tous) */
  const [statutFilter, setStatutFilter] = useState('all');

  /* ── Calcul des KPIs depuis les données mock ──────────────────────────
     On parcourt dilicom_flux pour compter les différents types et statuts */
  const nbCommandes = dilicom_flux.filter((f) => f.type === 'commande').length;
  const nbFactures  = dilicom_flux.filter((f) => f.type === 'facture').length;
  const nbErreurs   = dilicom_flux.filter((f) => f.statut === 'erreur').length;

  /* ── Filtrage local du tableau de flux ──────────────────────────────── */
  const filtered = dilicom_flux.filter((f) => {
    if (typeFilter   !== 'all' && f.type   !== typeFilter)   return false;
    if (statutFilter !== 'all' && f.statut !== statutFilter) return false;
    return true;
  });

  return (
    <AppLayout title="EDI Dilicom">

      {/* ── En-tête de page ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">EDI Dilicom</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion des flux électroniques via le réseau FEL
          </p>
        </div>
        {/* Nouveau flux manuel — requiert un backend réel */}
        <Button onClick={() => window.__toast('Fonctionnalité backend requise pour créer un flux manuel.', 'info')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau flux manuel
        </Button>
      </div>

      {/* ── Bandeau d'état de connexion ──────────────────────────────── */}
      <BandeauConnexion connexion={dilicom_connexion} />

      {/* ── Grille de KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* KPI 1 : flux aujourd'hui */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flux aujourd'hui</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dilicom_connexion.nb_flux_aujourd_hui}</div>
            <p className="text-xs text-muted-foreground mt-1">échanges transmis</p>
          </CardContent>
        </Card>

        {/* KPI 2 : commandes transmises ce mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commandes ce mois</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nbCommandes}</div>
            <p className="text-xs text-muted-foreground mt-1">transmises via FEL</p>
          </CardContent>
        </Card>

        {/* KPI 3 : factures reçues ce mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Factures reçues</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nbFactures}</div>
            <p className="text-xs text-muted-foreground mt-1">ce mois</p>
          </CardContent>
        </Card>

        {/* KPI 4 : flux en erreur — rouge si > 0 pour attirer l'attention */}
        <Card className={nbErreurs > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flux en erreur</CardTitle>
            <FileX className={`h-4 w-4 ${nbErreurs > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${nbErreurs > 0 ? 'text-destructive' : ''}`}>
              {nbErreurs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {nbErreurs > 0 ? 'à traiter' : 'aucune erreur'}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Barre de filtres ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Filtre par type de flux */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="commande">Commande</SelectItem>
            <SelectItem value="accusé_reception">Accusé de réception</SelectItem>
            <SelectItem value="facture">Facture</SelectItem>
            <SelectItem value="avoir">Avoir</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtre par statut */}
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="transmis">Transmis</SelectItem>
            <SelectItem value="traite">Traité</SelectItem>
            <SelectItem value="erreur">Erreur</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* ── Tableau des flux récents ──────────────────────────────────── */}
      <Card className="p-0">
        {/* En-tête de la carte avec le titre et le nombre de résultats */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Flux récents</span>
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} flux</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Lignes</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  Aucun flux ne correspond aux filtres.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((flux) => (
                <TableRow key={flux.id}>
                  {/* Type du flux : badge coloré */}
                  <TableCell><BadgeType type={flux.type} /></TableCell>

                  {/* Référence en monospace pour bien la distinguer */}
                  <TableCell className="font-mono text-sm">{flux.reference}</TableCell>

                  <TableCell>{flux.distributeur.nom}</TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {dateHeure(flux.date)}
                  </TableCell>

                  {/* Nombre de lignes du flux */}
                  <TableCell className="text-right tabular-nums">
                    {flux.nb_lignes}
                  </TableCell>

                  {/* Montant TTC en monospace — null pour les accusés de réception */}
                  <TableCell className="font-mono text-right">
                    {euro(flux.montant_ttc)}
                  </TableCell>

                  {/* Statut du flux : badge coloré */}
                  <TableCell><BadgeStatut statut={flux.statut} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

    </AppLayout>
  );
}
