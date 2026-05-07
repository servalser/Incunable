/**
 * Lettres/Detail — vue détail d'une lettre de change.
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - lettre : {
 *       id, reference, statut, distributeur: { id, nom },
 *       montant_ttc, date_emission, date_echeance, paye_le, jours_restants,
 *       notes, cree_par: { nom }, created_at,
 *       lignes: [{ id, designation, quantite, prix_unitaire_ht, montant_ht }]
 *     }
 */

import { useState }           from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft }          from 'lucide-react';
import { AppLayout }          from '../../Components/Layout/AppLayout';
import { Badge }              from '../../Components/UI/Badge';
import { ConfirmDialog }      from '../../Components/UI/ConfirmDialog';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const euro   = (n)   => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Sous-composant : ligne label/valeur ──────────────────────────────────── */
function DetailRow({ label, children }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '9px 0', borderBottom: '1px solid var(--hairline)' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontSize: 13 }}>{children}</span>
        </div>
    );
}

/* ── Composant principal ──────────────────────────────────────────────────── */
export default function LettreDetail({ lettre }) {
    const [confirmPay,    setConfirmPay]    = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handlePay = () => {
        router.post(`/lettres/${lettre.id}/payer`, {}, {
            onFinish: () => setConfirmPay(false),
        });
    };

    const handleDelete = () => {
        router.delete(`/lettres/${lettre.id}`, {
            onFinish: () => setConfirmDelete(false),
        });
    };

    const isPayable = ['en_attente', 'en_retard'].includes(lettre.statut);

    const joursStyle = (() => {
        if (lettre.statut === 'paye') return {};
        if (lettre.jours_restants == null) return {};
        if (lettre.jours_restants < 0 || lettre.jours_restants <= 7) {
            return { color: 'var(--status-overdue)', fontWeight: 600 };
        }
        return { color: 'var(--status-paid)' };
    })();

    return (
        <AppLayout title={lettre.reference}>
            <Head title={lettre.reference} />

            {/* ── Bouton retour ── */}
            <Link
                href="/lettres"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 20, textDecoration: 'none' }}
            >
                <ArrowLeft size={14} />
                Lettres de change
            </Link>

            {/* ── En-tête ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
                <div>
                    <h1 className="page-title mono" style={{ marginBottom: 6 }}>{lettre.reference}</h1>
                    <Badge kind="lcr" value={lettre.statut} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/lettres/${lettre.id}/modifier`} className="btn">
                        Modifier
                    </Link>
                    {isPayable && (
                        <button className="btn primary" onClick={() => setConfirmPay(true)}>
                            Marquer payée
                        </button>
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

            {/* ── Corps : grille 2 colonnes ── */}
            <div className="detail-grid">

                {/* ── Card Informations ── */}
                <div className="card">
                    <div className="card-head">
                        <h2 className="section-title" style={{ margin: 0 }}>Informations</h2>
                    </div>

                    {/* Mini-timeline : Émise → Échue → Payée */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 8px' }}>
                        {[
                            { key: 'emise', label: 'Émise', active: true },
                            { key: 'echue', label: 'Échue', active: lettre.statut === 'en_retard' },
                            { key: 'payee', label: 'Payée', active: lettre.statut === 'paye' },
                        ].map((step, i, arr) => (
                            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{
                                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                        background: step.active ? 'var(--accent)' : 'var(--hairline)',
                                        border: `2px solid ${step.active ? 'var(--accent)' : 'var(--hairline)'}`,
                                    }} />
                                    <span style={{
                                        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
                                        color: step.active ? 'var(--accent-ink)' : 'var(--muted-2)',
                                        fontWeight: step.active ? 600 : 400, whiteSpace: 'nowrap',
                                    }}>{step.label}</span>
                                </div>
                                {i < arr.length - 1 && (
                                    <div style={{ height: 1, flex: 1, margin: '0 6px', marginBottom: 14, background: 'var(--hairline)' }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '0 20px 20px' }}>
                        <DetailRow label="Fournisseur">
                            <Link href={`/distributeurs/${lettre.distributeur?.id}`}
                                style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                                {lettre.distributeur?.nom ?? '—'}
                            </Link>
                        </DetailRow>
                        <DetailRow label="Montant TTC">
                            <span className="mono" style={{ fontWeight: 700, fontSize: 15 }}>
                                {euro(lettre.montant_ttc)}
                            </span>
                        </DetailRow>
                        <DetailRow label="Date d'émission">{dateFr(lettre.date_emission)}</DetailRow>
                        <DetailRow label="Date d'échéance">
                            <span style={lettre.statut === 'en_retard' ? { color: 'var(--status-overdue)' } : {}}>
                                {dateFr(lettre.date_echeance)}
                            </span>
                        </DetailRow>
                        <DetailRow label="Jours restants">
                            <span style={joursStyle}>
                                {lettre.statut === 'paye'
                                    ? '—'
                                    : lettre.jours_restants != null
                                        ? `${lettre.jours_restants} jour${Math.abs(lettre.jours_restants) > 1 ? 's' : ''}`
                                        : '—'
                                }
                            </span>
                        </DetailRow>
                        <DetailRow label="Statut">
                            <Badge kind="lcr" value={lettre.statut} />
                        </DetailRow>
                        {lettre.statut === 'paye' && (
                            <DetailRow label="Payée le">
                                <span style={{ color: 'var(--status-paid)' }}>{dateFr(lettre.paye_le)}</span>
                            </DetailRow>
                        )}
                        <DetailRow label="Créé par">{lettre.cree_par?.nom ?? '—'}</DetailRow>
                        <DetailRow label="Créé le">{dateFr(lettre.created_at)}</DetailRow>

                        {lettre.notes && (
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
                                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>Notes</p>
                                <p style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{lettre.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Card Lignes (conditionnelle) ── */}
                {lettre.lignes?.length > 0 && (
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title" style={{ margin: 0 }}>Détail des lignes</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Désignation</th>
                                        <th className="right">Qté</th>
                                        <th className="right">Prix unit. HT</th>
                                        <th className="right">Total HT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lettre.lignes.map((ligne) => (
                                        <tr key={ligne.id}>
                                            <td>{ligne.designation}</td>
                                            <td className="right num">{ligne.quantite}</td>
                                            <td className="right num">{euro(ligne.prix_unitaire_ht)}</td>
                                            <td className="right num" style={{ fontWeight: 600 }}>
                                                {euro(ligne.montant_ht ?? ligne.quantite * ligne.prix_unitaire_ht)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Dialogs ── */}
            <ConfirmDialog
                open={confirmPay}
                message={`Marquer la lettre ${lettre.reference} comme payée ? Cette action est définitive.`}
                confirmLabel="Marquer payée"
                onConfirm={handlePay}
                onCancel={() => setConfirmPay(false)}
            />
            <ConfirmDialog
                open={confirmDelete}
                message={`Déplacer la lettre ${lettre.reference} en corbeille ?`}
                confirmLabel="Supprimer"
                danger
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
        </AppLayout>
    );
}
