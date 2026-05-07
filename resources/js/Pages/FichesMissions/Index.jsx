/**
 * FichesMissions/Index — suivi des titres à prescrire / évaluer.
 *
 * Props reçues via Inertia :
 *   - fiches  : tableau { id, titre, auteur, isbn, editeur, prix_ttc, categorie, priorite, statut, notes, cree_par, created_at }
 *   - filtres : { q, statut, priorite }
 */

import { useState, useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { AppLayout }     from '../../Components/Layout/AppLayout';
import { Modal, ModalBody, ModalFooter } from '../../Components/UI/Modal';
import { ConfirmDialog } from '../../Components/UI/ConfirmDialog';
import { Plus, Search, BookOpen } from 'lucide-react';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const euro = (n) => n != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
    : '—';

/*
 * Styles inline pour les chips — jamais de classes Tailwind dynamiques
 * (risque de purge en production). Variables CSS sémantiques uniquement.
 */
const STATUT_LABELS = {
    a_evaluer:  { label: 'À évaluer',   style: { background: 'var(--surface-2)', color: 'var(--muted-2)' } },
    lu:         { label: 'Lu',           style: { background: 'var(--status-info-bg)',    color: 'var(--status-info)' } },
    recommande: { label: 'Recommandé',  style: { background: 'var(--status-paid-bg)',    color: 'var(--status-paid)' } },
    refuse:     { label: 'Refusé',      style: { background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)' } },
};

const PRIORITE_LABELS = {
    faible:  { label: 'Faible',  style: { background: 'var(--surface-2)', color: 'var(--muted-2)' } },
    normale: { label: 'Normale', style: { background: 'var(--status-info-bg)',    color: 'var(--status-info)' } },
    haute:   { label: 'Haute',   style: { background: 'var(--status-pending-bg)', color: 'var(--status-pending)' } },
};

function Chip({ map, value }) {
    const entry = map[value] ?? { label: value, style: { background: 'var(--surface-2)', color: 'var(--muted-2)' } };
    return (
        <span style={{
            ...entry.style,
            display: 'inline-flex', alignItems: 'center',
            borderRadius: 9999, padding: '2px 9px',
            fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
        }}>
            {entry.label}
        </span>
    );
}

/* ── Icônes SVG ───────────────────────────────────────────────────────────── */
const IcoEdit = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="14" height="14" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const IcoTrash = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="14" height="14" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
    </svg>
);

/* ── Formulaire création / édition ─────────────────────────────────────────── */
function FicheForm({ fiche, onClose }) {
    const isEdit = !!fiche;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        titre:     fiche?.titre     ?? '',
        auteur:    fiche?.auteur    ?? '',
        isbn:      fiche?.isbn      ?? '',
        editeur:   fiche?.editeur   ?? '',
        prix_ttc:  fiche?.prix_ttc  ?? '',
        categorie: fiche?.categorie ?? '',
        priorite:  fiche?.priorite  ?? 'normale',
        statut:    fiche?.statut    ?? 'a_evaluer',
        notes:     fiche?.notes     ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => { reset(); onClose(); } };
        isEdit
            ? put(`/fiches-missions/${fiche.id}`, opts)
            : post('/fiches-missions', opts);
    };

    return (
        <form onSubmit={submit}>
            <ModalBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Titre */}
                    <div>
                        <label htmlFor="fm-titre" className="label">
                            Titre <span style={{ color: 'var(--status-overdue)' }}>*</span>
                        </label>
                        <input
                            id="fm-titre"
                            className="input"
                            value={data.titre}
                            onChange={e => setData('titre', e.target.value)}
                            autoFocus required
                            style={errors.titre ? { borderColor: 'var(--status-overdue)' } : {}}
                        />
                        {errors.titre && (
                            <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                {errors.titre}
                            </p>
                        )}
                    </div>

                    {/* Auteur / ISBN */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label htmlFor="fm-auteur" className="label">Auteur</label>
                            <input id="fm-auteur" className="input" value={data.auteur}
                                onChange={e => setData('auteur', e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="fm-isbn" className="label">ISBN</label>
                            <input id="fm-isbn" className="input mono" value={data.isbn}
                                maxLength={13} placeholder="9782…"
                                onChange={e => setData('isbn', e.target.value)} />
                        </div>
                    </div>

                    {/* Éditeur / Prix */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label htmlFor="fm-editeur" className="label">Éditeur</label>
                            <input id="fm-editeur" className="input" value={data.editeur}
                                onChange={e => setData('editeur', e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="fm-prix" className="label">Prix TTC (€)</label>
                            <input id="fm-prix" type="number" step="0.01" min="0"
                                className="input" value={data.prix_ttc}
                                onChange={e => setData('prix_ttc', e.target.value)} />
                        </div>
                    </div>

                    {/* Catégorie / Priorité */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label htmlFor="fm-categorie" className="label">Catégorie</label>
                            <input id="fm-categorie" className="input" value={data.categorie}
                                placeholder="Roman, BD, Jeunesse…"
                                onChange={e => setData('categorie', e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="fm-priorite" className="label">Priorité</label>
                            <select id="fm-priorite" className="select" value={data.priorite}
                                onChange={e => setData('priorite', e.target.value)}>
                                <option value="faible">Faible</option>
                                <option value="normale">Normale</option>
                                <option value="haute">Haute</option>
                            </select>
                        </div>
                    </div>

                    {/* Statut */}
                    <div>
                        <label htmlFor="fm-statut" className="label">Statut</label>
                        <select id="fm-statut" className="select" value={data.statut}
                            onChange={e => setData('statut', e.target.value)}>
                            <option value="a_evaluer">À évaluer</option>
                            <option value="lu">Lu</option>
                            <option value="recommande">Recommandé</option>
                            <option value="refuse">Refusé</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="fm-notes" className="label">Notes</label>
                        <textarea id="fm-notes" className="textarea" value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            rows={3} placeholder="Critique, remarques, contexte…" />
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <button type="button" className="btn" onClick={onClose} disabled={processing}>
                    Annuler
                </button>
                <button type="submit" className="btn primary" disabled={processing}>
                    {processing ? 'Enregistrement…' : 'Enregistrer'}
                </button>
            </ModalFooter>
        </form>
    );
}

/* ── Page principale ────────────────────────────────────────────────────────── */
export default function FichesMissionsIndex({ fiches, filtres }) {
    const [editModal,     setEditModal]     = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const debounce = useRef(null);

    const handleSearch = (val) => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() =>
            router.get('/fiches-missions', { ...filtres, q: val }, { preserveState: true }),
        400);
    };

    const handleFilter = (key, val) => {
        router.get('/fiches-missions', { ...filtres, [key]: val || undefined }, { preserveState: true });
    };

    const execDelete = () => {
        if (!confirmDelete) return;
        router.delete(`/fiches-missions/${confirmDelete.id}`, {
            onFinish: () => setConfirmDelete(null),
        });
    };

    const isNew = editModal === 'new';

    return (
        <AppLayout title="Fiches missions">
            <Head title="Fiches missions" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Fiches missions</h1>
                    <p className="page-sub">
                        {fiches.length} fiche{fiches.length !== 1 ? 's' : ''} enregistrée{fiches.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="btn primary" onClick={() => setEditModal('new')}>
                    <Plus size={15} />
                    Ajouter un titre
                </button>
            </div>

            {/* ── Filtres ── */}
            <div className="toolbar">
                <div className="input-group" style={{ flex: '1 1 280px', maxWidth: 440 }}>
                    <span className="icon-left">
                        <Search size={15} aria-hidden="true" />
                    </span>
                    <input
                        type="text"
                        className="input"
                        placeholder="Rechercher titre, auteur, ISBN…"
                        defaultValue={filtres?.q ?? ''}
                        onChange={e => handleSearch(e.target.value)}
                    />
                </div>
                <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={filtres?.statut ?? ''}
                    onChange={e => handleFilter('statut', e.target.value)}
                >
                    <option value="">Tous les statuts</option>
                    <option value="a_evaluer">À évaluer</option>
                    <option value="lu">Lu</option>
                    <option value="recommande">Recommandé</option>
                    <option value="refuse">Refusé</option>
                </select>
                <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={filtres?.priorite ?? ''}
                    onChange={e => handleFilter('priorite', e.target.value)}
                >
                    <option value="">Toutes priorités</option>
                    <option value="haute">Haute</option>
                    <option value="normale">Normale</option>
                    <option value="faible">Faible</option>
                </select>
            </div>

            {/* ── Tableau ou état vide ── */}
            {fiches.length === 0 ? (
                <div className="card">
                    <div className="empty-state" style={{ paddingTop: 64, paddingBottom: 64 }}>
                        <BookOpen size={36} style={{ color: 'var(--muted-2)', margin: '0 auto 12px' }} />
                        <p>Aucune fiche pour ces critères.</p>
                        <button className="btn primary sm" style={{ marginTop: 16 }}
                            onClick={() => setEditModal('new')}>
                            <Plus size={14} /> Ajouter un titre
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Titre</th>
                                    <th>Auteur</th>
                                    <th>Éditeur</th>
                                    <th>Catégorie</th>
                                    <th className="right">Prix TTC</th>
                                    <th>Priorité</th>
                                    <th>Statut</th>
                                    <th style={{ width: 80 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {fiches.map(f => (
                                    <tr key={f.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{f.titre}</div>
                                            {f.isbn && (
                                                <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                                                    {f.isbn}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--muted)' }}>{f.auteur || '—'}</td>
                                        <td style={{ color: 'var(--muted)' }}>{f.editeur || '—'}</td>
                                        <td style={{ color: 'var(--muted)' }}>{f.categorie || '—'}</td>
                                        <td className="right num">{euro(f.prix_ttc)}</td>
                                        <td><Chip map={PRIORITE_LABELS} value={f.priorite} /></td>
                                        <td><Chip map={STATUT_LABELS}   value={f.statut}   /></td>
                                        <td>
                                            <div className="actions" style={{ opacity: 1 }}>
                                                <button
                                                    className="action-btn"
                                                    title="Modifier"
                                                    onClick={() => setEditModal(f)}
                                                >
                                                    <IcoEdit />
                                                </button>
                                                <button
                                                    className="action-btn danger"
                                                    title="Supprimer"
                                                    onClick={() => setConfirmDelete(f)}
                                                >
                                                    <IcoTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Modale formulaire ── */}
            <Modal
                open={!!editModal}
                onClose={() => setEditModal(null)}
                title={isNew ? 'Ajouter un titre' : `Modifier — ${editModal?.titre}`}
            >
                {editModal && (
                    <FicheForm
                        fiche={isNew ? null : editModal}
                        onClose={() => setEditModal(null)}
                    />
                )}
            </Modal>

            {/* ── Confirmation suppression ── */}
            <ConfirmDialog
                open={!!confirmDelete}
                message={`Supprimer la fiche « ${confirmDelete?.titre} » ? Cette action est irréversible.`}
                confirmLabel="Supprimer"
                danger
                onConfirm={execDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </AppLayout>
    );
}
