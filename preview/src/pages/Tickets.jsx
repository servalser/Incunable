import { useState } from 'react';
import { AppLayout }     from '../components/Layout/AppLayout.jsx';
import { Badge }         from '../components/UI/Badge.jsx';
import { ConfirmDialog } from '../components/UI/ConfirmDialog.jsx';
import { Modal, ModalBody, ModalFooter } from '../components/UI/Modal.jsx';
import { Button }        from '../components/ui/button.jsx';
import { Input }         from '../components/ui/input.jsx';
import { Label }         from '../components/ui/label.jsx';
import { Textarea }      from '../components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { tickets }       from '../data/mock.js';
import { Trash2, Plus, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Formate une date ISO → "22 avr. 2025 à 08:15" ─────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Classe de bordure gauche selon la priorité du ticket ───────────── */
const borderPriorite = {
  haute:   'border-l-4 border-l-destructive',
  normale: 'border-l-4 border-l-warning',
  urgente: 'border-l-4 border-l-destructive',
  faible:  'border-l-4 border-l-muted-foreground/40',
};

/* ══════════════════════════════════════════════════
   Composant principal
══════════════════════════════════════════════════ */
export default function Tickets() {
  /* Copie locale des tickets */
  const [ticketsList, setTicketsList] = useState([...tickets]);

  /* ── Modal de création ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState({ sujet: '', description: '', priorite: 'normale' });

  /* ── ConfirmDialog de suppression ── */
  const [confirmId, setConfirmId] = useState(null);

  /* ── Helpers ── */

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({ sujet: '', description: '', priorite: 'normale' });
  };

  /* Crée un ticket et l'ajoute en tête de liste */
  const handleCreate = () => {
    if (!form.sujet.trim()) {
      window.__toast('Le sujet est obligatoire.', 'error');
      return;
    }
    setTicketsList(prev => [{
      id:          Date.now(),
      sujet:       form.sujet.trim(),
      description: form.description.trim(),
      priorite:    form.priorite,
      statut:      'ouvert',
      cree_par:    { nom: 'Marie Dupont' },
      created_at:  new Date().toISOString(),
    }, ...prev]);
    closeModal();
    window.__toast('Ticket créé.', 'success');
  };

  /* Change le statut d'un ticket */
  const changerStatut = (id, nouveauStatut) => {
    setTicketsList(prev =>
      prev.map(t => t.id === id ? { ...t, statut: nouveauStatut } : t)
    );
    const labels = { en_cours: 'Ticket passé en cours.', ferme: 'Ticket fermé.' };
    window.__toast(labels[nouveauStatut] ?? 'Statut mis à jour.', 'success');
  };

  /* Supprime le ticket confirmId */
  const supprimerTicket = () => {
    setTicketsList(prev => prev.filter(t => t.id !== confirmId));
    setConfirmId(null);
    window.__toast('Ticket supprimé.', 'success');
  };

  /* ── Rendu ── */
  return (
    <AppLayout title="Support">

      {/* En-tête de page */}
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      {/* ── Liste des tickets ─────────────────────────────────────── */}
      {ticketsList.length === 0 ? (
        /* État vide */
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">Aucun ticket pour le moment.</p>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
              Créer un ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {ticketsList.map(ticket => (
            <Card
              key={ticket.id}
              className={cn('overflow-hidden', borderPriorite[ticket.priorite] ?? '')}
            >
              <CardContent className="py-4 flex items-start justify-between gap-4 flex-wrap">

                {/* ── Contenu textuel ── */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Sujet */}
                  <p className="font-semibold text-sm leading-tight">{ticket.sujet}</p>

                  {/* Description (si elle existe) */}
                  {ticket.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ticket.description}
                    </p>
                  )}

                  {/* Méta-infos : badges + date */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge kind="ticket_statut" value={ticket.statut}  />
                    <Badge kind="ticket_prio"   value={ticket.priorite} />
                    <span className="text-xs text-muted-foreground">
                      {ticket.cree_par.nom} · {formatDate(ticket.created_at)}
                    </span>
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">

                  {/* Passer "en cours" (seulement si pas déjà en cours) */}
                  {ticket.statut !== 'en_cours' && ticket.statut !== 'ferme' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changerStatut(ticket.id, 'en_cours')}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      En cours
                    </Button>
                  )}

                  {/* Fermer (seulement si pas déjà fermé) */}
                  {ticket.statut !== 'ferme' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => changerStatut(ticket.id, 'ferme')}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Fermer
                    </Button>
                  )}

                  {/* Suppression */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Supprimer le ticket"
                    onClick={() => setConfirmId(ticket.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Modale de création ─────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={closeModal} title="Nouveau ticket">
        <ModalBody>
          <div className="space-y-4">

            {/* Sujet */}
            <div className="space-y-1.5">
              <Label htmlFor="tk-sujet">
                Sujet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tk-sujet"
                name="sujet"
                placeholder="Décrivez le problème en quelques mots…"
                maxLength={200}
                value={form.sujet}
                onChange={handleFormChange}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="tk-desc">Description</Label>
              <Textarea
                id="tk-desc"
                name="description"
                rows={4}
                placeholder="Détails supplémentaires (facultatif)…"
                value={form.description}
                onChange={handleFormChange}
              />
            </div>

            {/* Priorité */}
            <div className="space-y-1.5">
              <Label htmlFor="tk-priorite">Priorité</Label>
              <Select
                value={form.priorite}
                onValueChange={(v) => setForm(prev => ({ ...prev, priorite: v }))}
              >
                <SelectTrigger id="tk-priorite">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" size="sm" onClick={closeModal}>Annuler</Button>
          <Button size="sm" onClick={handleCreate}>Créer le ticket</Button>
        </ModalFooter>
      </Modal>

      {/* ── Dialogue de confirmation de suppression ────────────────── */}
      <ConfirmDialog
        open={confirmId !== null}
        message="Supprimer ce ticket définitivement ? Cette action est irréversible."
        confirmLabel="Supprimer"
        danger
        onConfirm={supprimerTicket}
        onCancel={() => setConfirmId(null)}
      />

    </AppLayout>
  );
}
