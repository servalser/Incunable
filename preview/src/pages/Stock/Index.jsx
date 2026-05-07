import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { ConfirmDialog } from '../../components/UI/ConfirmDialog.jsx';
import { livres as mockLivres, distributeurs } from '../../data/mock.js';

/* Composants shadcn */
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
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
  BookOpen, AlertCircle, TrendingDown, DollarSign,
  Search, Pencil, SlidersHorizontal, Trash2, Plus,
} from 'lucide-react';

/* ─── Helpers de formatage ─────────────────────────────────── */
const euro   = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ─── Badge stock avec shadcn Badge ────────────────────────────
   Renvoie un Badge coloré selon le niveau de stock :
   - success  : quantite > seuil_alerte → tout va bien
   - warning  : quantite > 0 mais ≤ seuil → stock faible
   - destructive : quantite = 0 → rupture totale
──────────────────────────────────────────────────────────────── */
function BadgeStock({ quantite, seuil }) {
  if (quantite === 0) {
    return <Badge variant="destructive">Rupture</Badge>;
  }
  if (quantite <= seuil) {
    return <Badge variant="warning">{quantite} ex.</Badge>;
  }
  return <Badge variant="success">{quantite} ex.</Badge>;
}

/* ─── Page principale ──────────────────────────────────────── */
export default function StockIndex() {
  const navigate = useNavigate();

  /* ── Copie locale de la liste (permet de simuler les suppressions) ── */
  const [items, setItems] = useState(mockLivres);

  /* ── État des filtres ── */
  const [search,      setSearch]      = useState('');   // valeur debounced (pour filtrer)
  const [searchInput, setSearchInput] = useState('');   // valeur affichée dans l'input
  const [categorie,   setCategorie]   = useState('all'); // 'all' = toutes
  const [distribId,   setDistribId]   = useState('all'); // 'all' = tous
  const [statutStock, setStatutStock] = useState('all'); // 'rupture' | 'alerte' | 'ok' | 'all'

  /* ── Debounce : attend 400ms après la dernière frappe avant de filtrer ── */
  const debounceRef = useRef(null);
  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val.trim().toLowerCase()), 400);
  };

  /* ── Confirmation suppression ── */
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteConfirm = () => {
    setItems((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    window.__toast(`"${deleteTarget.titre}" retiré du catalogue.`, 'success');
    setDeleteTarget(null);
  };

  /* ── Calcul des KPIs sur TOUS les items (pas seulement les filtrés) ── */
  const totalTitres   = items.length;
  const titresRupture = items.filter((l) => l.quantite === 0).length;
  const titresAlerte  = items.filter((l) => l.quantite > 0 && l.quantite <= l.seuil_alerte).length;
  const valeurStock   = items.reduce((acc, l) => acc + l.quantite * l.prix_ttc, 0);

  /* ── Filtrage combiné ── */
  const filtered = items.filter((l) => {
    /* Filtre texte — titre, auteur ou ISBN */
    if (search) {
      const hay = `${l.titre} ${l.auteur} ${l.isbn}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    /* Filtre catégorie ('all' = aucun filtre) */
    if (categorie !== 'all' && l.categorie !== categorie) return false;
    /* Filtre fournisseur ('all' = aucun filtre) */
    if (distribId !== 'all' && String(l.distributeur.id) !== distribId) return false;
    /* Filtre statut stock */
    if (statutStock === 'rupture' && l.quantite !== 0)                              return false;
    if (statutStock === 'alerte'  && !(l.quantite > 0 && l.quantite <= l.seuil_alerte)) return false;
    if (statutStock === 'ok'      && l.quantite <= l.seuil_alerte)                   return false;
    return true;
  });

  return (
    <AppLayout title="Stock">

      {/* ── En-tête de page ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogue &amp; Stock</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} titre{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link to="/stock/creer">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un livre
          </Link>
        </Button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Nombre total de titres au catalogue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Titres au catalogue</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTitres}</div>
            <p className="text-xs text-muted-foreground mt-1">Références actives</p>
          </CardContent>
        </Card>

        {/* Titres en rupture totale (rouge si > 0) */}
        <Card className={titresRupture > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En rupture</CardTitle>
            <AlertCircle className={`h-4 w-4 ${titresRupture > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${titresRupture > 0 ? 'text-destructive' : ''}`}>
              {titresRupture}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stock = 0 exemplaire</p>
          </CardContent>
        </Card>

        {/* Titres sous le seuil d'alerte mais pas encore à 0 (orange si > 0) */}
        <Card className={titresAlerte > 0 ? 'border-warning/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sous le seuil</CardTitle>
            <TrendingDown className={`h-4 w-4 ${titresAlerte > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${titresAlerte > 0 ? 'text-warning' : ''}`}>
              {titresAlerte}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Commande conseillée</p>
          </CardContent>
        </Card>

        {/* Valeur totale du stock (quantite × prix TTC pour chaque titre) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valeur en stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{euro(valeurStock)}</div>
            <p className="text-xs text-muted-foreground mt-1">Prix de vente TTC · {totalTitres} réf.</p>
          </CardContent>
        </Card>

      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Champ de recherche libre */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Titre, auteur, ISBN…"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 w-64"
          />
        </div>

        {/* Filtre par catégorie */}
        <Select value={categorie} onValueChange={setCategorie}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            <SelectItem value="Roman">Roman</SelectItem>
            <SelectItem value="Classique">Classique</SelectItem>
            <SelectItem value="SF">SF</SelectItem>
            <SelectItem value="Jeunesse">Jeunesse</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtre par fournisseur/distributeur */}
        <Select value={distribId} onValueChange={setDistribId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les fournisseurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les fournisseurs</SelectItem>
            {distributeurs.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>{d.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtre par statut de stock */}
        <Select value={statutStock} onValueChange={setStatutStock}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les stocks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les stocks</SelectItem>
            <SelectItem value="rupture">Rupture (0 ex.)</SelectItem>
            <SelectItem value="alerte">Alerte (stock faible)</SelectItem>
            <SelectItem value="ok">OK (stock suffisant)</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* ── Tableau des livres ── */}
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ISBN</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead className="text-right">Prix TTC</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Seuil</TableHead>
              <TableHead className="text-right">Commandé</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              /* Message si aucun résultat ne correspond aux filtres */
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  Aucun livre ne correspond aux filtres.
                </TableCell>
              </TableRow>
            ) : filtered.map((l) => (
              /* Ligne cliquable → vers la fiche détail du livre */
              <TableRow
                key={l.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/stock/${l.id}`)}
              >
                {/* ISBN en police monospace pour faciliter la lecture */}
                <TableCell>
                  <span className="font-mono text-xs">{l.isbn}</span>
                </TableCell>
                <TableCell className="font-medium">{l.titre}</TableCell>
                <TableCell className="text-muted-foreground">{l.auteur}</TableCell>
                <TableCell>{l.categorie}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{l.distributeur.nom}</TableCell>
                <TableCell className="font-mono text-right">{euro(l.prix_ttc)}</TableCell>

                {/* Badge coloré selon le niveau de stock */}
                <TableCell className="text-center">
                  <BadgeStock quantite={l.quantite} seuil={l.seuil_alerte} />
                </TableCell>

                <TableCell className="font-mono text-right text-muted-foreground">
                  {l.seuil_alerte}
                </TableCell>

                {/* Quantité commandée : affichée en bleu si > 0 */}
                <TableCell className={`font-mono text-right ${l.quantite_commandee > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {l.quantite_commandee > 0 ? `+${l.quantite_commandee}` : '—'}
                </TableCell>

                {/* Actions de ligne — stopPropagation pour ne pas naviguer */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/stock/${l.id}/modifier`}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Modifier
                      </Link>
                    </Button>
                    {/* L'ajustement de stock nécessite le backend */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.__toast('Fonctionnalité réservée au backend', 'error')}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                      Ajuster
                    </Button>
                    {/* Suppression avec confirmation */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Retirer du catalogue"
                      onClick={() => setDeleteTarget(l)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ── Confirmation suppression ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        danger
        message={`Retirer "${deleteTarget?.titre}" du catalogue ? Cette action est irréversible.`}
        confirmLabel="Retirer"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

    </AppLayout>
  );
}
