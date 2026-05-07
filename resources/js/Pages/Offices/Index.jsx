/**
 * Offices/Index — liste paginée des offices avec filtres.
 *
 * Props :
 *   offices       — objet paginé Laravel { data, links, last_page }
 *   distributeurs — tableau { id, nom } pour le filtre fournisseur
 *   filters       — { q, statut, type, distributeur_id } valeurs actives
 */

import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import { AppLayout }     from '../../Components/Layout/AppLayout';
import { Badge }         from '../../Components/UI/Badge';
import { ConfirmDialog } from '../../Components/UI/ConfirmDialog';

/* ── Helpers de formatage ─────────────────────────────────────────────────── */

const euro = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Icônes SVG ───────────────────────────────────────────────────────────── */

const IcoSearch = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="15" height="15" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
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
        <path d="M9 6V4h6v2" />
    </svg>
);

/* ── Composant principal ──────────────────────────────────────────────────── */

export default function OfficesIndex({ offices, distributeurs, filters }) {
    const [confirm, setConfirm] = useState(null);
    const [searchVal, setSearchVal] = useState(filters.q ?? '');
    const debounceRef = useRef(null);

    const applyFilter = useCallback((newFilters) => {
        router.get('/offices', { ...filters, ...newFilters }, {
            preserveState: true, replace: true,
        });
    }, [filters]);

    const handleSearch = (val) => {
        setSearchVal(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilter({ q: val, page: 1 }), 500);
    };

    const handleConfirmDelete = () => {
        router.delete(`/offices/${confirm.id}`, { onFinish: () => setConfirm(null) });
    };

    return (
        <AppLayout title="Offices">
            <Head title="Offices" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Offices</h1>
                    <p className="page-sub">Gestion des offices et retours fournisseurs</p>
                </div>
                <Link href="/offices/creer" className="btn primary">
                    <Plus size={15} />
                    Nouvelle office
                </Link>
            </div>

            {/* ── Filtres ── */}
            <div className="toolbar">
                <div className="input-group" style={{ flex: '1 1 280px', maxWidth: 440 }}>
                    <span className="icon-left"><IcoSearch /></span>
                    <input
                        type="text"
                        className="input"
                        placeholder="Rechercher (référence, fournisseur…)"
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
                    <option value="retour_partiel">Retour partiel</option>
                    <option value="retourne">Retourné</option>
                    <option value="paye">Payé</option>
                    <option value="en_retard">En retard</option>
                </select>
                <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={filters.type || ''}
                    onChange={(e) => applyFilter({ type: e.target.value, page: 1 })}
                >
                    <option value="">Tous les types</option>
                    <option value="facon">À façon</option>
                    <option value="grille">Sur grille</option>
                    <option value="exceptionnel">Exceptionnel</option>
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
                                <th>Type</th>
                                <th className="right">Montant TTC</th>
                                <th>Réception</th>
                                <th>Retour limite</th>
                                <th>Statut</th>
                                <th style={{ width: 72 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {offices.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="empty-state">
                                        Aucun office trouvé.
                                    </td>
                                </tr>
                            ) : offices.data.map((o) => (
                                <tr key={o.id} onClick={() => router.visit(`/offices/${o.id}`)}>
                                    <td><span className="ref">{o.reference}</span></td>
                                    <td>{o.distributeur?.nom ?? '—'}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <Badge kind="type" value={o.type} />
                                    </td>
                                    <td className="right num">{euro(o.montant_ttc)}</td>
                                    <td>{dateFr(o.date_reception)}</td>
                                    <td>{dateFr(o.date_retour_limite)}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <Badge kind="office" value={o.statut} />
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="actions">
                                            <Link
                                                href={`/offices/${o.id}/modifier`}
                                                className="action-btn"
                                                title="Modifier"
                                            >
                                                <IcoEdit />
                                            </Link>
                                            <button
                                                className="action-btn danger"
                                                title="Supprimer"
                                                onClick={() => setConfirm(o)}
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
                {offices.last_page > 1 && (
                    <div className="pagination">
                        <div className="pages">
                            {offices.links.map((link, i) => (
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
                message={`Déplacer l'office ${confirm?.reference} en corbeille ? Cette action est réversible.`}
                confirmLabel="Supprimer"
                danger
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirm(null)}
            />
        </AppLayout>
    );
}
