/**
 * Lettres/Index — liste paginée des lettres de change avec filtres.
 *
 * Props reçues depuis le contrôleur Laravel (via Inertia) :
 *   - lettres      : collection paginée { data, links, last_page, current_page }
 *   - distributeurs: tableau [{ id, nom }]
 *   - filters      : filtres actifs { q, statut, distributeur_id }
 */

import { useRef, useState, useCallback } from 'react';
import { Head, Link, router }             from '@inertiajs/react';
import { Plus }                           from 'lucide-react';
import { AppLayout }                      from '../../Components/Layout/AppLayout';
import { Badge }                          from '../../Components/UI/Badge';
import { ConfirmDialog }                  from '../../Components/UI/ConfirmDialog';

/* ── Helpers de formatage ─────────────────────────────────────────────────── */

const euro = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Icônes SVG ───────────────────────────────────────────────────────────── */

const IcoSearch = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         width="15" height="15" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

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
    </svg>
);

/* ── Composant principal ──────────────────────────────────────────────────── */

export default function LettresIndex({ lettres, distributeurs, filters }) {
    const [confirm, setConfirm] = useState(null);
    const [searchVal, setSearchVal] = useState(filters.q ?? '');
    const debounceRef = useRef(null);

    const applyFilter = useCallback((newFilters) => {
        router.get('/lettres', { ...filters, ...newFilters }, {
            preserveState: true, replace: true,
        });
    }, [filters]);

    const handleSearch = (val) => {
        setSearchVal(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilter({ q: val, page: 1 }), 500);
    };

    const confirmDelete = () => {
        router.delete(`/lettres/${confirm.id}`, { onFinish: () => setConfirm(null) });
    };

    return (
        <AppLayout title="Lettres de change">
            <Head title="Lettres de change" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Lettres de change</h1>
                    <p className="page-sub">Gestion des lettres de créance fournisseurs</p>
                </div>
                <Link href="/lettres/creer" className="btn primary">
                    <Plus size={15} />
                    Nouvelle LCR
                </Link>
            </div>

            {/* ── Filtres ── */}
            <div className="toolbar">
                <div className="input-group" style={{ flex: '1 1 320px', maxWidth: 480 }}>
                    <span className="icon-left"><IcoSearch /></span>
                    <input
                        type="text"
                        className="input"
                        placeholder="Rechercher (référence, distributeur…)"
                        value={searchVal}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={filters.statut || ''}
                    onChange={(e) => applyFilter({ statut: e.target.value, page: 1 })}
                >
                    <option value="">Tous les statuts</option>
                    <option value="en_attente">En attente</option>
                    <option value="en_retard">En retard</option>
                    <option value="paye">Payé</option>
                </select>
                <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={filters.distributeur_id ? String(filters.distributeur_id) : ''}
                    onChange={(e) => applyFilter({ distributeur_id: e.target.value, page: 1 })}
                >
                    <option value="">Tous les fournisseurs</option>
                    {distributeurs.map((d) => (
                        <option key={d.id} value={String(d.id)}>{d.nom}</option>
                    ))}
                </select>
            </div>

            {/* ── Tableau ── */}
            <div className="card">
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Référence</th>
                                <th>Fournisseur</th>
                                <th className="right">Montant TTC</th>
                                <th>Émission</th>
                                <th>Échéance</th>
                                <th>Statut</th>
                                <th style={{ width: 72 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {lettres.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty-state">
                                        Aucune lettre de change trouvée.
                                    </td>
                                </tr>
                            ) : lettres.data.map((l) => (
                                <tr key={l.id} onClick={() => router.visit(`/lettres/${l.id}`)}>
                                    <td><span className="ref">{l.reference}</span></td>
                                    <td>{l.distributeur?.nom ?? '—'}</td>
                                    <td className="right num">{euro(l.montant_ttc)}</td>
                                    <td>{dateFr(l.date_emission)}</td>
                                    <td>{dateFr(l.date_echeance)}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <Badge kind="lcr" value={l.statut} />
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="actions">
                                            <Link
                                                href={`/lettres/${l.id}/modifier`}
                                                className="action-btn"
                                                title="Modifier"
                                            >
                                                <IcoEdit />
                                            </Link>
                                            <button
                                                className="action-btn danger"
                                                title="Supprimer"
                                                onClick={() => setConfirm(l)}
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

                {/* ── Pagination ── */}
                {lettres.last_page > 1 && (
                    <div className="pagination">
                        <div className="pages">
                            {lettres.links.map((link, i) => (
                                <button
                                    key={i}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.get(link.url, {}, { preserveState: true })
                                    }
                                    className={`page-btn${link.active ? ' active' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Dialog de confirmation de suppression ── */}
            <ConfirmDialog
                open={!!confirm}
                message={`Déplacer la lettre ${confirm?.reference} en corbeille ?`}
                confirmLabel="Supprimer"
                danger
                onConfirm={confirmDelete}
                onCancel={() => setConfirm(null)}
            />
        </AppLayout>
    );
}
