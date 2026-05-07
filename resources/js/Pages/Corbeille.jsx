/**
 * Corbeille — LCR et offices placés en soft-delete.
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - lettres  : tableau { id, reference, distributeur: { nom }, montant_ttc, statut, supprime_le }
 *   - offices  : même structure + champ `type`
 *
 * Actions disponibles :
 *   - Restaurer              → router.post  /corbeille/lettre/{id}/restaurer (ou office)
 *   - Supprimer définitivement → router.delete /corbeille/lettre/{id}/forcer (ou office)
 */

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '../Components/Layout/AppLayout';
import { Badge } from '../Components/UI/Badge';
import { ConfirmDialog } from '../Components/UI/ConfirmDialog';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

const euro = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

/* ── Sous-section tableau ─────────────────────────────────────────────────── */
function TrashSection({ title, items, kind, baseUrl, onRestore, onDelete }) {
    return (
        <section>
            {/* Titre avec compteur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
                <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    border: '1px solid var(--hairline)', borderRadius: 9999,
                    padding: '1px 8px', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                }}>
                    {items.length}
                </span>
            </div>

            {items.length === 0 ? (
                <div className="card">
                    <div className="empty-state">Aucun élément dans cette section.</div>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Référence</th>
                                    <th>Fournisseur</th>
                                    <th className="right">Montant TTC</th>
                                    <th>Statut</th>
                                    <th>Supprimé le</th>
                                    <th style={{ width: 160 }} />
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td><span className="ref">{item.reference}</span></td>
                                        <td>{item.distributeur?.nom ?? '—'}</td>
                                        <td className="right num">{euro(item.montant_ttc)}</td>
                                        <td><Badge kind={kind} value={item.statut} /></td>
                                        <td style={{ color: 'var(--muted)' }}>{dateFr(item.supprime_le)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn sm"
                                                    onClick={() => onRestore(item, baseUrl)}
                                                >
                                                    Restaurer
                                                </button>
                                                <button
                                                    className="btn sm"
                                                    style={{
                                                        background: 'var(--status-overdue)',
                                                        borderColor: 'var(--status-overdue)',
                                                        color: '#fff',
                                                    }}
                                                    onClick={() => onDelete(item, baseUrl)}
                                                >
                                                    Supprimer
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
        </section>
    );
}

/* ── Page principale ──────────────────────────────────────────────────────── */
export default function Corbeille({ lettres, offices }) {
    const [confirmRestore, setConfirmRestore] = useState(null);
    const [confirmDelete,  setConfirmDelete]  = useState(null);

    const handleRestore = (item, baseUrl) => setConfirmRestore({ item, baseUrl });
    const handleDelete  = (item, baseUrl) => setConfirmDelete({ item, baseUrl });

    const execRestore = () => {
        if (!confirmRestore) return;
        const { item, baseUrl } = confirmRestore;
        router.post(`${baseUrl}/${item.id}/restaurer`, {}, {
            onFinish: () => setConfirmRestore(null),
        });
    };

    const execDelete = () => {
        if (!confirmDelete) return;
        const { item, baseUrl } = confirmDelete;
        router.delete(`${baseUrl}/${item.id}`, {
            onFinish: () => setConfirmDelete(null),
        });
    };

    return (
        <AppLayout title="Corbeille">
            <Head title="Corbeille" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Corbeille</h1>
                    <p className="page-sub">
                        Les éléments supprimés sont conservés ici. Vous pouvez les restaurer ou les supprimer définitivement.
                    </p>
                </div>
            </div>

            {/* ── Section Lettres de change ── */}
            <TrashSection
                title="Lettres de change"
                items={lettres ?? []}
                kind="lcr"
                baseUrl="/corbeille/lettre"
                onRestore={handleRestore}
                onDelete={handleDelete}
            />

            <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid var(--hairline)' }} />

            {/* ── Section Offices ── */}
            <TrashSection
                title="Offices"
                items={offices ?? []}
                kind="office"
                baseUrl="/corbeille/office"
                onRestore={handleRestore}
                onDelete={handleDelete}
            />

            {/* ── Dialog confirmation : Restaurer ── */}
            <ConfirmDialog
                open={!!confirmRestore}
                message={`Restaurer ${confirmRestore?.item?.reference} ? L'élément redeviendra visible dans la liste principale.`}
                confirmLabel="Restaurer"
                danger={false}
                onConfirm={execRestore}
                onCancel={() => setConfirmRestore(null)}
            />

            {/* ── Dialog confirmation : Supprimer définitivement ── */}
            <ConfirmDialog
                open={!!confirmDelete}
                message={`Supprimer définitivement ${confirmDelete?.item?.reference} ? Cette action est irréversible.`}
                confirmLabel="Supprimer définitivement"
                danger
                onConfirm={execDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </AppLayout>
    );
}
