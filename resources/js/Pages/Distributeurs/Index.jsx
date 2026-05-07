/**
 * Distributeurs/Index — grille de cartes fournisseurs avec CRUD inline.
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - distributeurs : tableau d'objets fournisseur
 *       { id, nom, email, telephone, iban,
 *         delai_commandes_mois, delai_offices_mois, actif,
 *         nb_lettres_actives, nb_offices_actifs }
 */

import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { AppLayout }     from '../../Components/Layout/AppLayout';
import { Modal, ModalBody, ModalFooter } from '../../Components/UI/Modal';
import { ConfirmDialog } from '../../Components/UI/ConfirmDialog';

/* ── Palette de couleurs pour les avatars (inline styles, jamais de classes Tailwind dynamiques) */
const AVATAR_COLORS = [
    { bg: '#3b82f6', text: '#fff' }, // bleu
    { bg: '#8b5cf6', text: '#fff' }, // violet
    { bg: '#10b981', text: '#fff' }, // vert
    { bg: '#f59e0b', text: '#fff' }, // ambre
    { bg: '#f43f5e', text: '#fff' }, // rose
    { bg: '#06b6d4', text: '#fff' }, // cyan
    { bg: '#6366f1', text: '#fff' }, // indigo
    { bg: '#14b8a6', text: '#fff' }, // teal
];

const avatarStyle = (index) => {
    const c = AVATAR_COLORS[index % AVATAR_COLORS.length];
    return { background: c.bg, color: c.text };
};

/* ── Variantes Framer Motion pour le stagger des cartes ── */
const gridVariants = {
    animate: { transition: { staggerChildren: 0.05 } },
};
const cardVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.2, 0.7, 0.2, 1] } },
};

/* ── Formulaire dans la modale (création ou édition) ── */
function DistributeurForm({ distributeur, onClose }) {
    const isEdit = !!distributeur;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nom:                  distributeur?.nom                  ?? '',
        email:                distributeur?.email                ?? '',
        telephone:            distributeur?.telephone            ?? '',
        delai_commandes_mois: distributeur?.delai_commandes_mois ?? '',
        delai_offices_mois:   distributeur?.delai_offices_mois   ?? '',
        iban:                 distributeur?.iban                 ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => { reset(); onClose(); } };
        isEdit
            ? put(`/distributeurs/${distributeur.id}`, opts)
            : post('/distributeurs', opts);
    };

    return (
        <form onSubmit={submit}>
            <ModalBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Nom */}
                    <div>
                        <label htmlFor="dist-nom" className="label">
                            Nom <span style={{ color: 'var(--status-overdue)' }}>*</span>
                        </label>
                        <input
                            id="dist-nom"
                            type="text"
                            className="input"
                            value={data.nom}
                            onChange={(e) => setData('nom', e.target.value)}
                            required autoFocus
                            style={errors.nom ? { borderColor: 'var(--status-overdue)' } : {}}
                        />
                        {errors.nom && (
                            <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                {errors.nom}
                            </p>
                        )}
                    </div>

                    {/* Email + Téléphone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label htmlFor="dist-email" className="label">Email</label>
                            <input
                                id="dist-email"
                                type="email"
                                className="input"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                style={errors.email ? { borderColor: 'var(--status-overdue)' } : {}}
                            />
                            {errors.email && (
                                <p style={{ color: 'var(--status-overdue)', fontSize: 12, marginTop: 4 }}>
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="dist-tel" className="label">Téléphone</label>
                            <input
                                id="dist-tel"
                                type="tel"
                                className="input"
                                value={data.telephone}
                                onChange={(e) => setData('telephone', e.target.value)}
                                style={errors.telephone ? { borderColor: 'var(--status-overdue)' } : {}}
                            />
                        </div>
                    </div>

                    {/* Délais */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label htmlFor="dist-delai-lcr" className="label">Délai LCR (mois)</label>
                            <input
                                id="dist-delai-lcr"
                                type="number"
                                min="1" max="24"
                                className="input"
                                value={data.delai_commandes_mois}
                                onChange={(e) => setData('delai_commandes_mois', e.target.value)}
                                placeholder="Défaut global"
                                style={errors.delai_commandes_mois ? { borderColor: 'var(--status-overdue)' } : {}}
                            />
                        </div>
                        <div>
                            <label htmlFor="dist-delai-off" className="label">Délai offices (mois)</label>
                            <input
                                id="dist-delai-off"
                                type="number"
                                min="1" max="24"
                                className="input"
                                value={data.delai_offices_mois}
                                onChange={(e) => setData('delai_offices_mois', e.target.value)}
                                placeholder="Défaut global"
                                style={errors.delai_offices_mois ? { borderColor: 'var(--status-overdue)' } : {}}
                            />
                        </div>
                    </div>

                    {/* IBAN */}
                    <div>
                        <label htmlFor="dist-iban" className="label">IBAN</label>
                        <input
                            id="dist-iban"
                            type="text"
                            className="input mono"
                            value={data.iban}
                            onChange={(e) => setData('iban', e.target.value)}
                            placeholder="FR76…"
                            style={errors.iban ? { borderColor: 'var(--status-overdue)' } : {}}
                        />
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

/* ── Page principale ── */
export default function DistributeursIndex({ distributeurs }) {
    const [editModal,      setEditModal]      = useState(null);
    const [confirmToggle,  setConfirmToggle]  = useState(null);

    const isNew = editModal === 'new';

    const handleToggleActif = () => {
        if (!confirmToggle) return;
        const url = confirmToggle.actif
            ? `/distributeurs/${confirmToggle.id}/desactiver`
            : `/distributeurs/${confirmToggle.id}/reactiver`;
        router.put(url, {}, { onFinish: () => setConfirmToggle(null) });
    };

    return (
        <AppLayout title="Fournisseurs">
            <Head title="Fournisseurs" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Fournisseurs</h1>
                    <p className="page-sub">
                        {distributeurs.length} fournisseur{distributeurs.length !== 1 ? 's' : ''} enregistré{distributeurs.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="btn primary" onClick={() => setEditModal('new')}>
                    <Plus size={15} />
                    Ajouter un fournisseur
                </button>
            </div>

            {/* ── État vide ── */}
            {distributeurs.length === 0 && (
                <div className="card">
                    <div className="empty-state" style={{ paddingTop: 64, paddingBottom: 64 }}>
                        <p>Aucun fournisseur enregistré.</p>
                        <button className="btn primary sm" style={{ marginTop: 16 }}
                            onClick={() => setEditModal('new')}>
                            <Plus size={14} /> Ajouter un fournisseur
                        </button>
                    </div>
                </div>
            )}

            {/* ── Grille de cartes — responsive auto-fill ── */}
            <motion.div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
                variants={gridVariants}
                initial="initial"
                animate="animate"
            >
                {distributeurs.map((d, index) => (
                    <motion.div key={d.id} variants={cardVariants}>
                        <div
                            className="card"
                            style={{ opacity: d.actif ? 1 : 0.6, height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}
                        >
                            {/* Partie haute : avatar + nom + email */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 12px' }}>
                                <div
                                    style={{
                                        ...avatarStyle(index),
                                        flexShrink: 0,
                                        width: 40, height: 40, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 600, fontSize: 16,
                                    }}
                                    aria-hidden="true"
                                >
                                    {d.nom.charAt(0).toUpperCase()}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {d.nom}
                                    </p>
                                    {d.email && (
                                        <p style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                                            {d.email}
                                        </p>
                                    )}
                                </div>

                                {!d.actif && (
                                    <span style={{
                                        background: 'var(--surface-2)', color: 'var(--muted)',
                                        borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
                                    }}>
                                        Inactif
                                    </span>
                                )}
                            </div>

                            {/* Chips délais */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 20px 12px' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    background: 'var(--surface-2)', color: 'var(--muted)',
                                    borderRadius: 6, padding: '2px 8px', fontSize: 11,
                                }}>
                                    LCR : {d.delai_commandes_mois != null ? `${d.delai_commandes_mois} mois` : 'défaut'}
                                </span>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    background: 'var(--surface-2)', color: 'var(--muted)',
                                    borderRadius: 6, padding: '2px 8px', fontSize: 11,
                                }}>
                                    Office : {d.delai_offices_mois != null ? `${d.delai_offices_mois} mois` : 'défaut'}
                                </span>
                            </div>

                            {/* Compteurs LCR / offices */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 16,
                                borderTop: '1px solid var(--hairline)',
                                padding: '10px 20px', fontSize: 12, color: 'var(--muted)',
                            }}>
                                <span>
                                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                        {d.nb_lettres_actives ?? 0}
                                    </span>{' '}
                                    LCR active{(d.nb_lettres_actives ?? 0) !== 1 ? 's' : ''}
                                </span>
                                <span>
                                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                        {d.nb_offices_actifs ?? 0}
                                    </span>{' '}
                                    office{(d.nb_offices_actifs ?? 0) !== 1 ? 's' : ''} actif{(d.nb_offices_actifs ?? 0) !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Actions */}
                            <div style={{
                                display: 'flex', gap: 8, padding: '10px 20px 18px',
                            }}>
                                <button
                                    className="btn sm"
                                    style={{ flex: 1 }}
                                    onClick={() => setEditModal(d)}
                                >
                                    Modifier
                                </button>
                                <button
                                    className="btn ghost sm"
                                    style={{ flex: 1 }}
                                    onClick={() => setConfirmToggle(d)}
                                >
                                    {d.actif ? 'Désactiver' : 'Réactiver'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Modale création / édition ── */}
            <Modal
                open={!!editModal}
                onClose={() => setEditModal(null)}
                title={isNew ? 'Ajouter un fournisseur' : `Modifier — ${editModal?.nom}`}
            >
                {editModal && (
                    <DistributeurForm
                        distributeur={isNew ? null : editModal}
                        onClose={() => setEditModal(null)}
                    />
                )}
            </Modal>

            {/* ── Dialog confirmation désactivation / réactivation ── */}
            <ConfirmDialog
                open={!!confirmToggle}
                message={
                    confirmToggle?.actif
                        ? `Désactiver le fournisseur "${confirmToggle?.nom}" ? Il n'apparaîtra plus dans les formulaires de création.`
                        : `Réactiver le fournisseur "${confirmToggle?.nom}" ?`
                }
                confirmLabel={confirmToggle?.actif ? 'Désactiver' : 'Réactiver'}
                danger={confirmToggle?.actif}
                onConfirm={handleToggleActif}
                onCancel={() => setConfirmToggle(null)}
            />
        </AppLayout>
    );
}
