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

import { offices, distributeurs } from '../../data/mock.js';

/* ─── Helpers ──────────────────────────────────────────────── */
const euro   = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

export default function OfficesIndex() {
  const navigate = useNavigate();

  /* ── Filtres locaux ── */
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statut,      setStatut]      = useState('');
  const [type,        setType]        = useState('');
  const [distribId,   setDistribId]   = useState('');

  /* Debounce du champ de recherche */
  const debounceRef = useRef(null);
  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val.trim().toLowerCase()), 400);
  };

  /* ── Confirmation suppression ── */
  const [deleteTarget, setDeleteTarget] = useState(null); /* office à supprimer */
  const [items, setItems] = useState(offices);            /* liste locale (pour simuler la suppression) */

  /* ── Filtrage ── */
  const filtered = items.filter((o) => {
    if (statut    && o.statut                   !== statut)    return false;
    if (type      && o.type                     !== type)      return false;
    if (distribId && String(o.distributeur.id)  !== distribId) return false;
    if (search) {
      const hay = `${o.reference} ${o.distributeur.nom}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  /* ── Suppression simulée (déplacement en corbeille) ── */
  const handleDeleteConfirm = () => {
    setItems((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    window.__toast(`Office ${deleteTarget.reference} déplacée en corbeille.`, 'success');
    setDeleteTarget(null);
  };

  return (
    <AppLayout title="Offices">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} office{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link to="/offices/creer">
            <Plus className="h-4 w-4" />
            Nouvelle office
          </Link>
        </Button>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Référence, fournisseur…"
            className="w-64 pl-8"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Statut */}
        <Select value={statut || 'all'} onValueChange={(v) => setStatut(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="retour_partiel">Retour partiel</SelectItem>
            <SelectItem value="retourne">Retourné</SelectItem>
            <SelectItem value="paye">Payée</SelectItem>
            <SelectItem value="en_retard">En retard</SelectItem>
          </SelectContent>
        </Select>

        {/* Type */}
        <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="facon">À façon</SelectItem>
            <SelectItem value="grille">Sur grille</SelectItem>
            <SelectItem value="exceptionnel">Exceptionnel</SelectItem>
          </SelectContent>
        </Select>

        {/* Distributeur */}
        <Select value={distribId || 'all'} onValueChange={(v) => setDistribId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tous les fournisseurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les fournisseurs</SelectItem>
            {distributeurs.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>{d.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      {/* ── Tableau ── */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Montant TTC</TableHead>
              <TableHead>Date réception</TableHead>
              <TableHead>Retour limite</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <p className="text-center text-sm text-muted-foreground py-10">
                    Aucune office ne correspond aux filtres.
                  </p>
                </TableCell>
              </TableRow>
            ) : filtered.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => navigate(`/offices/${o.id}`)}
              >
                <TableCell>
                  <span className="font-mono">{o.reference}</span>
                </TableCell>
                <TableCell>{o.distributeur.nom}</TableCell>
                <TableCell><Badge kind="type" value={o.type} /></TableCell>
                <TableCell className="font-mono">{euro(o.montant_ttc)}</TableCell>
                <TableCell>{dateFr(o.date_reception)}</TableCell>
                <TableCell>{dateFr(o.date_retour_limite)}</TableCell>
                <TableCell><Badge kind="office" value={o.statut} /></TableCell>

                {/* Actions — on stoppe la propagation pour ne pas naviguer */}
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/offices/${o.id}/modifier`}>
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Supprimer"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(o)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Confirmation suppression ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        message={`Déplacer l'office ${deleteTarget?.reference} en corbeille ? Elle pourra être restaurée.`}
        confirmLabel="Déplacer en corbeille"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

    </AppLayout>
  );
}
