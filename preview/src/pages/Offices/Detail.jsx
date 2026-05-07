import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Pencil, Trash2, CheckCircle, RotateCcw } from 'lucide-react';

import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Modal, ModalBody, ModalFooter } from '../../components/ui/Modal.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui/table.jsx';

import { offices } from '../../data/mock.js';

/* ─── Helpers ──────────────────────────────────────────────── */
const euro   = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* Statuts qui permettent d'enregistrer un retour */
const STATUTS_RETOUR = ['en_attente', 'retour_partiel', 'en_retard'];
/* Statuts qui permettent de marquer payée */
const STATUTS_NON_PAYES = ['en_attente', 'retour_partiel', 'en_retard', 'retourne'];

export default function OfficesDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* Cherche l'office dans les données mock */
  const office = offices.find((o) => String(o.id) === id);

  /* ── État local des modals / dialogs ── */
  const [retourOpen,    setRetourOpen]    = useState(false);
  const [montantRetour, setMontantRetour] = useState('');
  const [payerOpen,     setPayerOpen]     = useState(false);
  const [deleteOpen,    setDeleteOpen]    = useState(false);

  /* Office introuvable */
  if (!office) {
    return (
      <AppLayout title="Office introuvable">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Office introuvable</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">L'office demandée n'existe pas.</p>
            <Button variant="outline" asChild>
              <Link to="/offices">Retour aux offices</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  /* ── Calcul montant net affiché ── */
  const montantNet = (office.montant_ttc ?? 0) - (office.montant_retourne ?? 0);

  /* ── Jours restants lisible ── */
  const joursLabel = () => {
    if (office.jours_restants > 0)   return `${office.jours_restants} j. restant${office.jours_restants > 1 ? 's' : ''}`;
    if (office.jours_restants === 0) return 'Échéance aujourd\'hui';
    return `${Math.abs(office.jours_restants)} j. de retard`;
  };

  /* ── Handlers ── */
  const handleRetourConfirm = () => {
    const montant = parseFloat(montantRetour);
    if (isNaN(montant) || montant <= 0) {
      window.__toast('Montant invalide.', 'error');
      return;
    }
    window.__toast(`Retour de ${euro(montant)} enregistré pour ${office.reference}.`, 'success');
    setRetourOpen(false);
    setMontantRetour('');
  };

  const handlePayerConfirm = () => {
    window.__toast(`Office ${office.reference} marquée comme payée.`, 'success');
    setPayerOpen(false);
  };

  const handleDeleteConfirm = () => {
    window.__toast(`Office ${office.reference} supprimée.`, 'success');
    setDeleteOpen(false);
    navigate('/offices');
  };

  return (
    <AppLayout title={office.reference}>

      {/* ── Fil d'Ariane ── */}
      <div className="flex items-center gap-1.5 text-sm mb-6">
        <Link className="text-muted-foreground hover:text-foreground transition-colors" to="/offices">
          Offices
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-foreground">{office.reference}</span>
      </div>

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{office.reference}</h1>
            <Badge kind="type"   value={office.type} />
            <Badge kind="office" value={office.statut} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Enregistrer un retour — visible seulement si statut le permet */}
          {STATUTS_RETOUR.includes(office.statut) && (
            <Button variant="outline" onClick={() => setRetourOpen(true)}>
              <RotateCcw className="h-4 w-4" />
              Enregistrer un retour
            </Button>
          )}

          {/* Marquer payée — visible seulement si pas déjà payée ou retournée */}
          {STATUTS_NON_PAYES.includes(office.statut) && (
            <Button variant="outline" onClick={() => setPayerOpen(true)}>
              <CheckCircle className="h-4 w-4" />
              Marquer payée
            </Button>
          )}

          <Button variant="outline" asChild>
            <Link to={`/offices/${office.id}/modifier`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* ── Carte d'informations ── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">

            <div>
              <dt className="text-muted-foreground mb-0.5">Fournisseur</dt>
              <dd>
                <Link to="/distributeurs" className="text-primary hover:underline">
                  {office.distributeur.nom}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Montant TTC</dt>
              <dd className="text-xl font-bold font-mono">{euro(office.montant_ttc)}</dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Montant retourné</dt>
              <dd className="font-mono">{euro(office.montant_retourne)}</dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Montant net</dt>
              {/* Couleur verte si le montant net est positif */}
              <dd className={`text-xl font-bold font-mono ${montantNet > 0 ? 'text-success' : ''}`}>
                {euro(montantNet)}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Date de réception</dt>
              <dd>{dateFr(office.date_reception)}</dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Date limite de retour</dt>
              <dd>{dateFr(office.date_retour_limite)}</dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Jours restants</dt>
              {/* Texte rouge si en retard */}
              <dd className={office.jours_restants < 0 ? 'text-destructive font-semibold' : ''}>
                {joursLabel()}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Statut</dt>
              <dd><Badge kind="office" value={office.statut} /></dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Type</dt>
              <dd><Badge kind="type" value={office.type} /></dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-0.5">Créé par</dt>
              <dd>{office.cree_par?.nom ?? '—'}</dd>
            </div>

            {office.notes && (
              <div className="col-span-2 lg:col-span-3">
                <dt className="text-muted-foreground mb-0.5">Notes</dt>
                <dd className="whitespace-pre-line">{office.notes}</dd>
              </div>
            )}

          </dl>
        </CardContent>
      </Card>

      {/* ── Lignes d'office (si présentes) ── */}
      {office.lignes && office.lignes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lignes ({office.lignes.length})</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead className="text-right">Reçu</TableHead>
                <TableHead className="text-right">Retourné</TableHead>
                <TableHead className="text-right">Disponible</TableHead>
                <TableHead className="text-right">Prix TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {office.lignes.map((ligne) => (
                <TableRow key={ligne.id}>
                  <TableCell className="font-semibold">{ligne.titre}</TableCell>
                  <TableCell>
                    <span className="font-mono text-muted-foreground text-xs">{ligne.isbn}</span>
                  </TableCell>
                  <TableCell className="text-right">{ligne.quantite_recue}</TableCell>
                  <TableCell className="text-right">{ligne.quantite_retournee}</TableCell>
                  <TableCell className="text-right">{ligne.quantite_disponible}</TableCell>
                  <TableCell className="text-right font-mono">{euro(ligne.prix_unitaire_ttc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── Modal : Enregistrer un retour ── */}
      <Modal
        open={retourOpen}
        onClose={() => { setRetourOpen(false); setMontantRetour(''); }}
        title="Enregistrer un retour"
      >
        <ModalBody>
          <div className="space-y-1.5">
            <Label htmlFor="montant-retour">Montant retourné (€)</Label>
            <Input
              id="montant-retour"
              type="number"
              min="0"
              step="0.01"
              className="font-mono"
              placeholder="0,00"
              value={montantRetour}
              onChange={(e) => setMontantRetour(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Montant déjà retourné : {euro(office.montant_retourne)} —{' '}
              Montant total : {euro(office.montant_ttc)}
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRetourOpen(false); setMontantRetour(''); }}
          >
            Annuler
          </Button>
          <Button size="sm" onClick={handleRetourConfirm}>
            Enregistrer
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Confirmation : Marquer payée ── */}
      <ConfirmDialog
        open={payerOpen}
        message={`Marquer l'office ${office.reference} comme payée ? Cette action ne peut pas être annulée.`}
        confirmLabel="Marquer payée"
        onConfirm={handlePayerConfirm}
        onCancel={() => setPayerOpen(false)}
      />

      {/* ── Confirmation : Supprimer ── */}
      <ConfirmDialog
        open={deleteOpen}
        message={`Supprimer définitivement l'office ${office.reference} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />

    </AppLayout>
  );
}
