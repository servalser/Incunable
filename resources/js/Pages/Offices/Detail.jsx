/**
 * Offices/Detail — vue détail complète d'un office.
 *
 * Props :
 *   office — {
 *     id, reference, statut, type,
 *     distributeur: { id, nom },
 *     montant_ttc, montant_retourne, montant_net,
 *     date_reception, date_retour_limite,
 *     paye_le, jours_restants, notes,
 *     cree_par: { nom }, created_at,
 *     lignes: [{ id, titre, isbn, quantite_recue, quantite_retournee,
 *                quantite_disponible, prix_unitaire_ttc }]
 *   }
 */

import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { AppLayout }     from '../../Components/Layout/AppLayout';
import { Badge }         from '../../Components/UI/Badge';
import { ConfirmDialog } from '../../Components/UI/ConfirmDialog';
import { Modal, ModalBody, ModalFooter } from '../../Components/UI/Modal';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const euro   = (n)   => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Sous-composant : item de définition ─────────────────────────────────── */
function DefItem({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                {label}
            </span>
            <span style={{ fontSize: 13.5 }}>{children}</span>
        </div>
    );
}

/* ── Sous-composant : formulaire de retour ───────────────────────────────── */
function RetourForm({ office, onClose }) {
    const maxRetour = (
        parseFloat(office.montant_ttc ?? 0) -
        parseFloat(office.montant_retourne ?? 0)
    ).toFixed(2);

    const { data, setData, processing, errors } = useForm({ montant: '' });

    const submit = (e) => {
        e.preventDefault();
        router.post(`/offices/${office.id}/retour`, { montant: data.montant }, { onSuccess: onClose });
    };

    return (
        <form onSubmit={submit}>
            <ModalBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label htmlFor="retour-montant" className="label">Montant retourné (€)</label>
                    <input
                        id="retour-montant"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={maxRetour}
                        className="input mono"
                        value={data.montant}
                        onChange={(e) => setData('montant', e.target.value)}
                        autoFocus required
                        style={errors.montant ? { borderColor: 'var(--status-overdue)' } : {}}
                    />
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Maximum autorisé :{' '}
                        <span className="mono" style={{ fontWeight: 600 }}>{euro(maxRetour)}</span>
                    </p>
                    {errors.montant && (
                        <p style={{ color: 'var(--status-overdue)', fontSize: 12 }}>{errors.montant}</p>
                    )}
                </div>
            </ModalBody>
            <ModalFooter>
                <button type="button" className="btn" onClick={onClose}>Annuler</button>
                <button type="submit" className="btn primary" disabled={processing}>
                    {processing ? 'Enregistrement…' : 'Enregistrer le retour'}
                </button>
            </ModalFooter>
        </form>
    );
}

/* ── Composant principal ──────────────────────────────────────────────────── */
export default function OfficeDetail({ office }) {
    const [retourModal,   setRetourModal]   = useState(false);
    const [confirmPay,    setConfirmPay]    = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const canRetour = ['en_attente', 'retour_partiel', 'en_retard'].includes(office.statut);
    const canPay    = !['paye', 'retourne'].includes(office.statut);
    const montantNetPositif = parseFloat(office.montant_net ?? 0) > 0;

    const joursLabel = () => {
        const j = office.jours_restants;
        if (j == null) return '—';
        if (j > 0)     return `J−${j}`;
        if (j === 0)   return "Aujourd'hui";
        return `+${Math.abs(j)} j de retard`;
    };

    const joursStyle = (() => {
        const j = office.jours_restants;
        if (j == null) return {};
        if (j < 0)     return { color: 'var(--status-overdue)', fontWeight: 600 };
        if (j <= 7)    return { color: 'var(--status-pending)', fontWeight: 600 };
        return { color: 'var(--status-paid)' };
    })();

    const handlePay = () => {
        router.post(`/offices/${office.id}/payer`, {}, { onFinish: () => setConfirmPay(false) });
    };

    const handleDelete = () => {
        router.delete(`/offices/${office.id}`, { onFinish: () => setConfirmDelete(false) });
    };

    return (
        <AppLayout title={office.reference}>
            <Head title={office.reference} />

            {/* ── Bouton retour ── */}
            <Link
                href="/offices"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 20, textDecoration: 'none' }}
            >
                <ArrowLeft size={14} />
                Offices
            </Link>

            {/* ── En-tête ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
                <div>
                    <h1 className="page-title mono" style={{ marginBottom: 8 }}>{office.reference}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge kind="type"   value={office.type} />
                        <Badge kind="office" value={office.statut} />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/offices/${office.id}/modifier`} className="btn">Modifier</Link>
                    {canRetour && (
                        <button className="btn primary" onClick={() => setRetourModal(true)}>
                            Enregistrer un retour
                        </button>
                    )}
                    {canPay && (
                        <button className="btn" onClick={() => setConfirmPay(true)}>Marquer payée</button>
                    )}
                    <button
                        className="btn"
                        style={{ color: 'var(--status-overdue)', borderColor: 'var(--status-overdue)' }}
                        onClick={() => setConfirmDelete(true)}
                    >
                        Supprimer
                    </button>
                </div>
            </div>

            {/* ── Informations générales ── */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-head">
                    <h2 className="section-title" style={{ margin: 0 }}>Informations générales</h2>
                </div>
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px 24px' }}>
                    <DefItem label="Fournisseur">
                        <Link href={`/distributeurs/${office.distributeur?.id}`}
                            style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                            {office.distributeur?.nom ?? '—'}
                        </Link>
                    </DefItem>
                    <DefItem label="Montant TTC">
                        <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                            {euro(office.montant_ttc)}
                        </span>
                    </DefItem>
                    <DefItem label="Montant retourné">
                        <span className="mono">{euro(office.montant_retourne)}</span>
                    </DefItem>
                    <DefItem label="Montant net dû">
                        <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: montantNetPositif ? 'var(--ink)' : 'var(--status-paid)' }}>
                            {euro(office.montant_net)}
                        </span>
                    </DefItem>
                    <DefItem label="Date de réception">{dateFr(office.date_reception)}</DefItem>
                    <DefItem label="Date limite retour">
                        <span style={office.statut === 'en_retard' ? { color: 'var(--status-overdue)', fontWeight: 600 } : {}}>
                            {dateFr(office.date_retour_limite)}
                        </span>
                    </DefItem>
                    <DefItem label="Jours restants">
                        <span style={joursStyle}>{joursLabel()}</span>
                    </DefItem>
                    <DefItem label="Statut"><Badge kind="office" value={office.statut} /></DefItem>
                    <DefItem label="Type"><Badge kind="type" value={office.type} /></DefItem>
                    {office.paye_le && (
                        <DefItem label="Payé le">
                            <span style={{ color: 'var(--status-paid)' }}>{dateFr(office.paye_le)}</span>
                        </DefItem>
                    )}
                    <DefItem label="Créé par">{office.cree_par?.nom ?? '—'}</DefItem>
                    <DefItem label="Créé le">{dateFr(office.created_at)}</DefItem>
                </div>

                {office.notes && (
                    <div style={{ borderTop: '1px solid var(--hairline)', padding: '16px 20px' }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>Notes</p>
                        <p style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{office.notes}</p>
                    </div>
                )}
            </div>

            {/* ── Tableau des lignes (conditionnel) ── */}
            {office.lignes && office.lignes.length > 0 && (
                <div className="card">
                    <div className="card-head">
                        <h2 className="section-title" style={{ margin: 0 }}>Lignes de l'office</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Titre</th>
                                    <th>ISBN</th>
                                    <th className="right">Reçu</th>
                                    <th className="right">Retourné</th>
                                    <th className="right">Disponible</th>
                                    <th className="right">Prix unit. TTC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {office.lignes.map((l) => (
                                    <tr key={l.id}>
                                        <td>{l.titre}</td>
                                        <td className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{l.isbn ?? '—'}</td>
                                        <td className="right num">{l.quantite_recue}</td>
                                        <td className="right num">{l.quantite_retournee}</td>
                                        <td className="right num">{l.quantite_disponible}</td>
                                        <td className="right num">{euro(l.prix_unitaire_ttc)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Modale retour ── */}
            <Modal open={retourModal} onClose={() => setRetourModal(false)} title="Enregistrer un retour" size="sm">
                <RetourForm office={office} onClose={() => setRetourModal(false)} />
            </Modal>

            {/* ── Dialogs ── */}
            <ConfirmDialog
                open={confirmPay}
                message={`Marquer l'office ${office.reference} comme payé ? Cette action est définitive.`}
                confirmLabel="Marquer payée"
                onConfirm={handlePay}
                onCancel={() => setConfirmPay(false)}
            />
            <ConfirmDialog
                open={confirmDelete}
                message={`Déplacer l'office ${office.reference} en corbeille ? Cette action est réversible.`}
                confirmLabel="Supprimer"
                danger
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
        </AppLayout>
    );
}
