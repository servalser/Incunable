import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Pencil, Trash2, CheckCircle } from 'lucide-react';

import { AppLayout } from '../../components/Layout/AppLayout.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui/table.jsx';

import { lettres } from '../../data/mock.js';

/* ── Helpers de formatage ─────────────────────────────────────── */
const euro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Détail d'une lettre de change ───────────────────────────── */
export default function LettreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* Recherche de la lettre par id (les ids mock sont des entiers) */
  const lettre = lettres.find((l) => l.id === Number(id));

  /* ── États des dialogs de confirmation ──────────────────── */
  const [confirmPaye, setConfirmPaye]   = useState(false);
  const [confirmSuppr, setConfirmSuppr] = useState(false);

  /* ── Lettre introuvable ─────────────────────────────────── */
  if (!lettre) {
    return (
      <AppLayout title="Lettre introuvable">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Lettre introuvable</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Aucune lettre ne correspond à l'identifiant{' '}
              <span className="font-mono">#{id}</span>.
            </p>
            <Button variant="outline" asChild>
              <Link to="/lettres">← Retour à la liste</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  /* ── Classe de couleur des jours restants selon urgence ─── */
  const joursColorClass =
    lettre.jours_restants < 0
      ? 'text-destructive font-semibold'
      : lettre.jours_restants <= 3
      ? 'text-warning font-semibold'
      : 'text-success font-semibold';

  const joursLabel =
    lettre.jours_restants < 0
      ? `${Math.abs(lettre.jours_restants)} jour${Math.abs(lettre.jours_restants) !== 1 ? 's' : ''} de retard`
      : lettre.jours_restants === 0
      ? "Aujourd'hui"
      : `${lettre.jours_restants} jour${lettre.jours_restants !== 1 ? 's' : ''}`;

  /* ── Handlers simulés ───────────────────────────────────── */
  const handleMarquerPayee = () => {
    window.__toast('Lettre marquée comme payée', 'success');
    setConfirmPaye(false);
  };

  const handleSupprimer = () => {
    window.__toast('Lettre déplacée en corbeille', 'success');
    setConfirmSuppr(false);
    navigate('/lettres');
  };

  return (
    <AppLayout title={lettre.reference}>

      {/* ── Fil d'Ariane ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm mb-6">
        <Link className="text-muted-foreground hover:text-foreground transition-colors" to="/lettres">
          Lettres de change
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-foreground">{lettre.reference}</span>
      </div>

      {/* ── En-tête de page ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">{lettre.reference}</h1>
          {/* Badge de statut sous le titre */}
          <div className="mt-2">
            <Badge kind="lcr" value={lettre.statut} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton "Modifier" — toujours disponible */}
          <Button variant="outline" asChild>
            <Link to={`/lettres/${lettre.id}/modifier`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>

          {/* "Marquer payée" uniquement si pas encore payée */}
          {(lettre.statut === 'en_attente' || lettre.statut === 'en_retard') && (
            <Button onClick={() => setConfirmPaye(true)}>
              <CheckCircle className="h-4 w-4" />
              Marquer payée
            </Button>
          )}

          {/* Supprimer — variante destructive */}
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmSuppr(true)}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* ── Grille 2 colonnes : infos + détail lignes ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── Carte "Informations" ────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">

              {/* Fournisseur avec lien vers sa fiche */}
              <div>
                <dt className="text-muted-foreground mb-0.5">Fournisseur</dt>
                <dd>
                  <Link className="text-primary hover:underline" to="/distributeurs">
                    {lettre.distributeur.nom}
                  </Link>
                </dd>
              </div>

              {/* Montant mis en valeur (big + mono) */}
              <div>
                <dt className="text-muted-foreground mb-0.5">Montant TTC</dt>
                <dd className="text-xl font-bold font-mono">{euro(lettre.montant_ttc)}</dd>
              </div>

              <div>
                <dt className="text-muted-foreground mb-0.5">Date d'émission</dt>
                <dd>{dateFr(lettre.date_emission)}</dd>
              </div>

              <div>
                <dt className="text-muted-foreground mb-0.5">Date d'échéance</dt>
                <dd>{dateFr(lettre.date_echeance)}</dd>
              </div>

              {/* Jours restants avec couleur contextuelle */}
              <div>
                <dt className="text-muted-foreground mb-0.5">Jours restants</dt>
                <dd className={joursColorClass}>{joursLabel}</dd>
              </div>

              <div>
                <dt className="text-muted-foreground mb-0.5">Statut</dt>
                <dd><Badge kind="lcr" value={lettre.statut} /></dd>
              </div>

              {/* Date de paiement — affiché uniquement si payée */}
              {lettre.paye_le && (
                <div>
                  <dt className="text-muted-foreground mb-0.5">Payée le</dt>
                  <dd className="text-success">{dateFr(lettre.paye_le)}</dd>
                </div>
              )}

              <div>
                <dt className="text-muted-foreground mb-0.5">Créé par</dt>
                <dd>{lettre.cree_par?.nom ?? '—'}</dd>
              </div>

              {/* Notes — affiché uniquement si non vide */}
              {lettre.notes && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground mb-0.5">Notes</dt>
                  <dd className="whitespace-pre-line">{lettre.notes}</dd>
                </div>
              )}

            </dl>
          </CardContent>
        </Card>

        {/* ── Carte "Détail des lignes" ──────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Détail</CardTitle>
          </CardHeader>
          {lettre.lignes && lettre.lignes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Prix unit. HT</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lettre.lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell>{ligne.designation}</TableCell>
                    <TableCell className="text-right">{ligne.quantite}</TableCell>
                    <TableCell className="text-right font-mono">
                      {euro(ligne.prix_unitaire_ht)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {euro(ligne.montant_ht)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            /* Pas de lignes → message discret */
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aucune ligne de détail enregistrée pour cette lettre.
              </p>
            </CardContent>
          )}
        </Card>

      </div>

      {/* ── Dialogs de confirmation ──────────────────────────── */}

      {/* Marquer payée */}
      <ConfirmDialog
        open={confirmPaye}
        message={`Confirmer le paiement de la lettre ${lettre.reference} (${euro(lettre.montant_ttc)}) ?`}
        confirmLabel="Marquer payée"
        onConfirm={handleMarquerPayee}
        onCancel={() => setConfirmPaye(false)}
      />

      {/* Supprimer */}
      <ConfirmDialog
        open={confirmSuppr}
        danger
        message={`Déplacer la lettre ${lettre.reference} en corbeille ? Elle pourra être restaurée.`}
        confirmLabel="Déplacer en corbeille"
        onConfirm={handleSupprimer}
        onCancel={() => setConfirmSuppr(false)}
      />

    </AppLayout>
  );
}
