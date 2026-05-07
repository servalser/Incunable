/**
 * Tickets — liste des tickets de support interne.
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - tickets : tableau { id, sujet, description, priorite, statut,
 *                         cree_par: { nom }, created_at }
 *
 * Priorités : faible | normale | haute | urgente
 * Statuts   : ouvert | en_cours | ferme
 */

import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { AppLayout }     from '../Components/Layout/AppLayout';
import { Badge }         from '../Components/UI/Badge';
import { ConfirmDialog } from '../Components/UI/ConfirmDialog';
import { Modal, ModalBody, ModalFooter } from '../Components/UI/Modal';
import { Plus } from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const dateFr = (str) =>
    str
        ? new Date(str).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric',
          })
        : '—';

/* ── Icône corbeille ──────────────────────────────────────────────────────── */
const IcoTrash = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="14" height="14" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
    </svg>
);

/* ── Formulaire de création d'un ticket ─────────────────────────────────── */
function NouveauTicketForm({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        sujet:       '',
        description: '',
        priorite:    'normale',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/tickets', {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <form onSubmit={submit}>
            <ModalBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    <div>
                        <label htmlFor="ticket_sujet" className="label">
                            Sujet <span style={{ color: 'var(--status-overdue)' }}>*</span>
                        </label>
                        <input
                            id="ticket_sujet"
                            className="input"
                            maxLength={200}
                            autoFocus
                            placeholder="Décrivez brièvement le problème…"
                            value={data.sujet}
                            onChange={(e) => setData('sujet', e.target.value)}
                            style={errors.sujet ? { borderColor: 'var(--status-overdue)' } : {}}
                        />
                        {errors.sujet && (
                            <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                {errors.sujet}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="ticket_description" className="label">
                            Description <span style={{ color: 'var(--status-overdue)' }}>*</span>
                        </label>
                        <textarea
                            id="ticket_description"
                            className="textarea"
                            rows={5}
                            placeholder="Détaillez le problème, les étapes pour le reproduire…"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            style={errors.description ? { borderColor: 'var(--status-overdue)' } : {}}
                        />
                        {errors.description && (
                            <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="ticket_priorite" className="label">Priorité</label>
                        <select
                            id="ticket_priorite"
                            className="select"
                            value={data.priorite}
                            onChange={(e) => setData('priorite', e.target.value)}
                        >
                            <option value="faible">Faible</option>
                            <option value="normale">Normale</option>
                            <option value="haute">Haute</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <button type="button" className="btn" onClick={onClose} disabled={processing}>
                    Annuler
                </button>
                <button type="submit" className="btn primary" disabled={processing}>
                    {processing ? 'Envoi…' : 'Créer le ticket'}
                </button>
            </ModalFooter>
        </form>
    );
}

/* ── Page principale ──────────────────────────────────────────────────────── */
const PRIO_ORDER = { urgente: 0, haute: 1, normale: 2, faible: 3 };

export default function Tickets({ tickets }) {
    const [dialogOuvert,  setDialogOuvert]  = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const ticketsTries = [...tickets].sort(
        (a, b) => (PRIO_ORDER[a.priorite] ?? 99) - (PRIO_ORDER[b.priorite] ?? 99)
    );

    const execDelete = () => {
        if (!confirmDelete) return;
        router.delete(`/tickets/${confirmDelete.id}`, {
            onFinish: () => setConfirmDelete(null),
        });
    };

    const changeStatut = (ticket, nouveauStatut) => {
        router.put(`/tickets/${ticket.id}/statut`, { statut: nouveauStatut });
    };

    return (
        <AppLayout title="Support">
            <Head title="Support" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Support</h1>
                    <p className="page-sub">Tickets de support interne</p>
                </div>
                <button className="btn primary" onClick={() => setDialogOuvert(true)}>
                    <Plus size={15} />
                    Nouveau ticket
                </button>
            </div>

            {/* ── Liste ou état vide ── */}
            {ticketsTries.length === 0 ? (
                <div className="card">
                    <div className="empty-state">Aucun ticket ouvert. Tout fonctionne !</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ticketsTries.map((ticket) => (
                        /*
                         * ticket-item + priorite = classe CSS pour la bordure gauche colorée.
                         * On utilise un div natif, pas Card Shadcn, pour que
                         * les styles .ticket-item s'appliquent directement.
                         */
                        <div key={ticket.id} className={`ticket-item ${ticket.priorite}`}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

                                {/* Corps */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                                        {ticket.sujet}
                                    </p>
                                    <p className="ticket-desc">{ticket.description}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 }}>
                                        <Badge kind="ticket_statut" value={ticket.statut} />
                                        <Badge kind="ticket_prio"   value={ticket.priorite} />
                                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                            {dateFr(ticket.created_at)}
                                            {ticket.cree_par?.nom && <> · {ticket.cree_par.nom}</>}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    {ticket.statut !== 'en_cours' && (
                                        <button
                                            className="btn sm"
                                            onClick={() => changeStatut(ticket, 'en_cours')}
                                        >
                                            En cours
                                        </button>
                                    )}
                                    {ticket.statut !== 'ferme' && (
                                        <button
                                            className="btn ghost sm"
                                            onClick={() => changeStatut(ticket, 'ferme')}
                                        >
                                            Fermer
                                        </button>
                                    )}
                                    <button
                                        className="btn-icon danger"
                                        title="Supprimer ce ticket"
                                        onClick={() => setConfirmDelete(ticket)}
                                        aria-label={`Supprimer le ticket : ${ticket.sujet}`}
                                    >
                                        <IcoTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal — Nouveau ticket ── */}
            <Modal
                open={dialogOuvert}
                onClose={() => setDialogOuvert(false)}
                title="Nouveau ticket"
            >
                {dialogOuvert && (
                    <NouveauTicketForm onClose={() => setDialogOuvert(false)} />
                )}
            </Modal>

            {/* ── Dialog de confirmation de suppression ── */}
            <ConfirmDialog
                open={!!confirmDelete}
                message={`Supprimer le ticket "${confirmDelete?.sujet}" ? Cette action est irréversible.`}
                confirmLabel="Supprimer"
                danger
                onConfirm={execDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </AppLayout>
    );
}
