import { Link, useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { livres, mouvements_stock } from '../../data/mock.js';

/* Composants shadcn */
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui/table.jsx';
import { Separator } from '../../components/ui/separator.jsx';

/* Icônes Lucide */
import {
  ChevronRight, Package, ShoppingCart, Clock, DollarSign, Pencil, SlidersHorizontal,
} from 'lucide-react';

/* ─── Helpers de formatage ─────────────────────────────────── */
const euro   = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ─── Couleur et libellé selon le type de mouvement ──────────
   entree    → success (+)   stock qui monte
   sortie    → neutral (-)   vente ou départ
   retour    → warning (←)   retour client
   inventaire→ info    (≡)   correction d'inventaire
───────────────────────────────────────────────────────────── */
const MOUVEMENT_STYLE = {
  entree:     { variant: 'success',     label: 'Entrée',     signe: '+',  qteClass: 'text-green-600 dark:text-green-400' },
  sortie:     { variant: 'neutral',     label: 'Sortie',     signe: '-',  qteClass: 'text-muted-foreground' },
  retour:     { variant: 'warning',     label: 'Retour',     signe: '←',  qteClass: 'text-yellow-600 dark:text-yellow-400' },
  inventaire: { variant: 'info',        label: 'Inventaire', signe: '≡',  qteClass: 'text-blue-600 dark:text-blue-400' },
};

/* ─── Badge type mouvement avec shadcn Badge ──────────────────── */
function BadgeMouvement({ type }) {
  const style = MOUVEMENT_STYLE[type] ?? { variant: 'neutral', label: type };
  return <Badge variant={style.variant}>{style.label}</Badge>;
}

/* ─── Badge stock avec shadcn Badge ───────────────────────────── */
function BadgeStock({ quantite, seuil }) {
  if (quantite === 0) {
    return <Badge variant="destructive">Rupture</Badge>;
  }
  if (quantite <= seuil) {
    return <Badge variant="warning">{quantite} ex. — Alerte</Badge>;
  }
  return <Badge variant="success">{quantite} ex.</Badge>;
}

/* ─── Page détail d'un livre ──────────────────────────────── */
export default function StockDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* Recherche du livre par id (les ids mock sont des entiers) */
  const livre = livres.find((l) => l.id === Number(id));

  /* ── Livre introuvable ─────────────────────────────────── */
  if (!livre) {
    return (
      <AppLayout title="Livre introuvable">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Livre introuvable</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Aucun livre ne correspond à l'identifiant{' '}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-sm">#{id}</code>.
            </p>
            <Button variant="outline" asChild>
              <Link to="/stock">← Retour au catalogue</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  /* ── Mouvements concernant ce livre uniquement, du plus récent au plus ancien ── */
  const mouvements = mouvements_stock
    .filter((m) => m.livre_id === livre.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  /* Valeur totale des exemplaires en rayon */
  const valeurStock = livre.quantite * livre.prix_ttc;

  /* Couleur de la card KPI stock selon l'état */
  const stockBorderClass =
    livre.quantite === 0       ? 'border-destructive/50' :
    livre.quantite <= livre.seuil_alerte ? 'border-warning/50'     : 'border-primary/30';

  return (
    <AppLayout title={livre.titre}>

      {/* ── Fil d'Ariane ── */}
      <div className="flex items-center gap-1.5 text-sm mb-6">
        <Link className="text-muted-foreground hover:text-foreground transition-colors" to="/stock">
          Stock
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        {/* On tronque le titre si trop long pour ne pas écraser le breadcrumb */}
        <span className="text-foreground truncate max-w-xs">
          {livre.titre.length > 50 ? livre.titre.slice(0, 50) + '…' : livre.titre}
        </span>
      </div>

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{livre.titre}</h1>
          {/* Badge de stock sous le titre */}
          <div className="mt-2">
            <BadgeStock quantite={livre.quantite} seuil={livre.seuil_alerte} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/stock/${livre.id}/modifier`}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          {/* Ajustement de stock réservé au backend */}
          <Button onClick={() => window.__toast('Fonctionnalité réservée au backend', 'error')}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Ajuster le stock
          </Button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Stock physique actuel */}
        <Card className={stockBorderClass}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock actuel</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{livre.quantite}</div>
            <p className="text-xs text-muted-foreground mt-1">
              exemplaire{livre.quantite !== 1 ? 's' : ''} en rayon
            </p>
          </CardContent>
        </Card>

        {/* Quantité en commande (bleue si > 0) */}
        <Card className={livre.quantite_commandee > 0 ? 'border-primary/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En commande</CardTitle>
            <ShoppingCart className={`h-4 w-4 ${livre.quantite_commandee > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${livre.quantite_commandee > 0 ? 'text-primary' : ''}`}>
              {livre.quantite_commandee}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {livre.quantite_commandee > 0 ? 'Livraison à venir' : 'Aucune commande en cours'}
            </p>
          </CardContent>
        </Card>

        {/* Dernière vente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dernière vente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{dateFr(livre.derniere_vente)}</div>
            <p className="text-xs text-muted-foreground mt-1">Date de la dernière sortie</p>
          </CardContent>
        </Card>

        {/* Valeur du stock = quantite × prix TTC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valeur en stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{euro(valeurStock)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {livre.quantite} × {euro(livre.prix_ttc)} TTC
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Grille 2 colonnes : infos livre + historique mouvements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Carte informations bibliographiques ── */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Grille de champs label / valeur */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">

              <dt className="text-muted-foreground font-medium self-center">ISBN</dt>
              <dd className="font-mono">{livre.isbn}</dd>

              <Separator className="col-span-2" />

              <dt className="text-muted-foreground font-medium self-center">Auteur</dt>
              <dd>{livre.auteur}</dd>

              <Separator className="col-span-2" />

              <dt className="text-muted-foreground font-medium self-center">Éditeur</dt>
              <dd>{livre.editeur}</dd>

              <Separator className="col-span-2" />

              <dt className="text-muted-foreground font-medium self-center">Catégorie</dt>
              <dd>{livre.categorie}</dd>

              <Separator className="col-span-2" />

              {/* Lien vers la fiche du fournisseur */}
              <dt className="text-muted-foreground font-medium self-center">Fournisseur</dt>
              <dd>
                <Link
                  className="text-primary hover:underline"
                  to={`/distributeurs/${livre.distributeur.id}`}
                >
                  {livre.distributeur.nom}
                </Link>
              </dd>

              <Separator className="col-span-2" />

              {/* Prix TTC affiché en gros (le prix de vente est l'info la plus utile) */}
              <dt className="text-muted-foreground font-medium self-center">Prix de vente TTC</dt>
              <dd className="text-xl font-bold font-mono">{euro(livre.prix_ttc)}</dd>

              <Separator className="col-span-2" />

              <dt className="text-muted-foreground font-medium self-center">Seuil d'alerte</dt>
              <dd className="font-mono">{livre.seuil_alerte} ex.</dd>

              <Separator className="col-span-2" />

              <dt className="text-muted-foreground font-medium self-center">Référencé le</dt>
              <dd>{dateFr(livre.created_at)}</dd>

            </dl>
          </CardContent>
        </Card>

        {/* ── Carte historique des mouvements ── */}
        <Card className="p-0">
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle>Historique des mouvements</CardTitle>
          </CardHeader>

          {mouvements.length === 0 ? (
            /* Pas encore de mouvement enregistré pour ce livre */
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Aucun mouvement de stock enregistré pour ce titre.
              </p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.map((m) => {
                  /* Le style du mouvement détermine le signe à afficher (+/-/←/≡) */
                  const style = MOUVEMENT_STYLE[m.type] ?? { signe: '', qteClass: '' };

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {dateFr(m.created_at)}
                      </TableCell>
                      <TableCell>
                        <BadgeMouvement type={m.type} />
                      </TableCell>
                      {/* Quantité avec signe (ex: +12, -3, ←4) et couleur contextuelle */}
                      <TableCell className={`font-mono text-right font-bold ${style.qteClass}`}>
                        {style.signe}{m.quantite}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.note || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground/60">
                        {m.cree_par}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

      </div>
    </AppLayout>
  );
}
