import { useState } from 'react';
import { AppLayout }     from '../components/Layout/AppLayout.jsx';
import { Badge }         from '../components/UI/Badge.jsx';
import { ConfirmDialog } from '../components/UI/ConfirmDialog.jsx';
import { Button }        from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { lettres_supprimees, offices_supprimes } from '../data/mock.js';
import { Trash2, RotateCcw } from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────────── */
const euro   = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

export default function Corbeille() {

  /* ── Copies locales pour simuler la restauration / suppression ── */
  const [lettres,  setLettres]  = useState(() => lettres_supprimees.map((l) => ({ ...l })));
  const [offices,  setOffices]  = useState(() => offices_supprimes.map((o)  => ({ ...o })));

  /* ── Quel élément est ciblé, et quelle action ?
     dialog = { id, reference, kind: 'lcr'|'office', action: 'restore'|'delete' } */
  const [dialog, setDialog] = useState(null);

  /* ── Ouverture des dialogs ──────────────────────────────────────── */
  const openRestore = (item, kind) =>
    setDialog({ id: item.id, reference: item.reference, kind, action: 'restore' });

  const openDelete = (item, kind) =>
    setDialog({ id: item.id, reference: item.reference, kind, action: 'delete' });

  /* ── Confirmation de l'action ───────────────────────────────────── */
  const handleConfirm = () => {
    const { id, reference, kind, action } = dialog;

    /* Dans les deux cas on retire l'élément de la liste locale */
    if (kind === 'lcr')    setLettres((p) => p.filter((l) => l.id !== id));
    if (kind === 'office') setOffices((p) => p.filter((o) => o.id !== id));

    if (action === 'restore') {
      window.__toast(`${reference} restauré${kind === 'office' ? 'e' : ''} avec succès.`, 'success');
    } else {
      window.__toast('Supprimé définitivement.', 'success');
    }

    setDialog(null);
  };

  /* ── Message du dialog selon l'action ──────────────────────────── */
  const dialogMessage = () => {
    if (!dialog) return '';
    if (dialog.action === 'restore')
      return `Restaurer ${dialog.reference} ? L'élément redeviendra visible dans son module.`;
    return `Supprimer définitivement ${dialog.reference} ? Cette action est irréversible et les données seront perdues.`;
  };

  return (
    <AppLayout title="Corbeille">

      {/* ── En-tête ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Corbeille</h1>
      </div>

      {/* ════════════════════════════════════════════════════════
          Section 1 : Lettres de change supprimées
         ════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold">Lettres de change</h2>
          <Badge variant="neutral">{lettres.length}</Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Supprimé le</TableHead>
                  <TableHead className="w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lettres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune lettre de change dans la corbeille.
                    </TableCell>
                  </TableRow>
                ) : lettres.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-sm">{l.reference}</TableCell>
                    <TableCell>{l.distributeur?.nom ?? '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{euro(l.montant_ttc)}</TableCell>
                    <TableCell><Badge kind="lcr" value={l.statut} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{dateFr(l.supprime_le)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRestore(l, 'lcr')}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Restaurer
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDelete(l, 'lcr')}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════
          Section 2 : Offices supprimées
         ════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold">Offices</h2>
          <Badge variant="neutral">{offices.length}</Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Supprimé le</TableHead>
                  <TableHead className="w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune office dans la corbeille.
                    </TableCell>
                  </TableRow>
                ) : offices.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">{o.reference}</TableCell>
                    <TableCell>{o.distributeur?.nom ?? '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{euro(o.montant_ttc)}</TableCell>
                    <TableCell><Badge kind="office" value={o.statut} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{dateFr(o.supprime_le)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRestore(o, 'office')}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Restaurer
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDelete(o, 'office')}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Dialog de confirmation (restaurer ou supprimer) ────────── */}
      <ConfirmDialog
        open={!!dialog}
        message={dialogMessage()}
        confirmLabel={dialog?.action === 'restore' ? 'Restaurer' : 'Supprimer définitivement'}
        danger={dialog?.action === 'delete'}
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      />

    </AppLayout>
  );
}
