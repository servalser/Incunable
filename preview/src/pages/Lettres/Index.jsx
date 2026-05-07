import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui/table.jsx';

import { lettres as mockLettres, distributeurs } from '../../data/mock.js';

/* ── Helpers de formatage ─────────────────────────────────────── */
const euro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Liste des lettres de change ──────────────────────────────── */
export default function LettresIndex() {
  const navigate = useNavigate();

  /* ── Filtres ─────────────────────────────────────────────── */
  /* Valeur affichée immédiatement dans l'input (contrôlé) */
  const [searchVal, setSearchVal]     = useState('');
  /* Valeur effective utilisée pour filtrer (mise à jour après délai) */
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter]   = useState('');
  const [distribFilter, setDistribFilter] = useState('');

  /* Référence vers le timer de debounce (évite de filtrer à chaque frappe) */
  const debounceRef = useRef(null);

  /* Gestion de la recherche avec debounce de 500 ms */
  const handleSearch = (val) => {
    setSearchVal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val.toLowerCase().trim());
    }, 500);
  };

  /* ── Copie locale de la liste (permet de simuler la suppression) ── */
  const [items, setItems] = useState(() => mockLettres.map((l) => ({ ...l })));

  /* ── État de la dialog de confirmation de suppression ──── */
  /* Stocke la lettre cible ou null si fermée */
  const [confirm, setConfirm] = useState(null);

  /* ── Filtrage local du tableau mock ─────────────────────── */
  const filtered = items.filter((l) => {
    /* Recherche textuelle : référence ou nom du fournisseur */
    if (
      searchQuery &&
      !l.reference.toLowerCase().includes(searchQuery) &&
      !l.distributeur.nom.toLowerCase().includes(searchQuery)
    ) {
      return false;
    }
    /* Filtre par statut */
    if (statutFilter && l.statut !== statutFilter) return false;
    /* Filtre par distributeur */
    if (distribFilter && String(l.distributeur.id) !== distribFilter) return false;
    return true;
  });

  /* ── Suppression : retire de la liste locale (simulation corbeille) ── */
  const handleDelete = () => {
    setItems((prev) => prev.filter((l) => l.id !== confirm.id));
    window.__toast(`Lettre ${confirm.reference} déplacée en corbeille.`, 'success');
    setConfirm(null);
  };

  return (
    <AppLayout title="Lettres de change">

      {/* ── En-tête de page ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lettres de change</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} lettre{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link to="/lettres/creer">
            <Plus className="h-4 w-4" />
            Nouvelle LCR
          </Link>
        </Button>
      </div>

      {/* ── Barre de filtres ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Recherche textuelle */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Référence ou fournisseur…"
            className="w-64 pl-8"
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filtre par statut */}
        <Select value={statutFilter || 'all'} onValueChange={(v) => setStatutFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="en_retard">En retard</SelectItem>
            <SelectItem value="paye">Payée</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtre par distributeur */}
        <Select value={distribFilter || 'all'} onValueChange={(v) => setDistribFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les fournisseurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les fournisseurs</SelectItem>
            {distributeurs.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      {/* ── Tableau ───────────────────────────────────────────── */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Montant TTC</TableHead>
              <TableHead>Émission</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <p className="text-center text-sm text-muted-foreground py-10">
                    Aucune lettre ne correspond aux filtres.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer hover:bg-muted/40"
                  /* Clic sur la ligne = navigation vers le détail */
                  onClick={() => navigate(`/lettres/${l.id}`)}
                >
                  {/* Référence en police monospace + lien */}
                  <TableCell>
                    <Link
                      className="font-mono text-primary hover:underline"
                      to={`/lettres/${l.id}`}
                      /* Empêche la navigation double (ligne + lien) */
                      onClick={(e) => e.stopPropagation()}
                    >
                      {l.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{l.distributeur.nom}</TableCell>
                  <TableCell className="font-mono">{euro(l.montant_ttc)}</TableCell>
                  <TableCell>{dateFr(l.date_emission)}</TableCell>
                  <TableCell>{dateFr(l.date_echeance)}</TableCell>
                  <TableCell><Badge kind="lcr" value={l.statut} /></TableCell>

                  {/* Boutons d'action */}
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {/* Modifier */}
                      <Button variant="ghost" size="icon" asChild title="Modifier">
                        <Link to={`/lettres/${l.id}/modifier`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {/* Supprimer */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Déplacer en corbeille"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirm(l)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Dialog de confirmation de suppression ─────────────── */}
      <ConfirmDialog
        open={!!confirm}
        danger
        message={
          confirm
            ? `Déplacer la lettre ${confirm.reference} en corbeille ? Elle pourra être restaurée.`
            : ''
        }
        confirmLabel="Déplacer en corbeille"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />

    </AppLayout>
  );
}
