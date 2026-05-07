/**
 * Stock/Index — liste paginée des produits (livres + goodies) avec filtres,
 * KPI cards, et modal de mouvement de stock.
 *
 * Props reçues depuis ProduitController.index() via Inertia :
 *   produits — { data: [...], links: [...], meta: {...} }
 *   filters  — { q, type, statut }
 *   config   — { seuil_alerte_stock_global, delai_nouveautes_semaines }
 *   stats    — { total, en_alerte, en_rupture, nb_nouveautes, valeur_stock_total }
 */

import { useRef, useState, useCallback } from 'react';
import { Head, Link, router }            from '@inertiajs/react';
import { Plus }                          from 'lucide-react';

import { AppLayout }     from '../../Components/Layout/AppLayout';
import { Badge }         from '../../Components/UI/Badge';
import { ConfirmDialog } from '../../Components/UI/ConfirmDialog';
import { Modal, ModalBody, ModalFooter } from '../../Components/UI/Modal';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const euro = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

/* ── Icônes ───────────────────────────────────────────────────────────────── */

const IcoSearch = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="15" height="15" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
);

const IcoEdit = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="14" height="14" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const IcoTrash = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="14" height="14" aria-hidden="true">
        <polyline strokeLinecap="round" strokeLinejoin="round" points="3 6 5 6 21 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6V4h6v2" />
    </svg>
);

const IcoArrows = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="14" height="14" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
);

/* ── KPI card avec icône ──────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, tone }) {
    const iconColor = tone === 'alert' ? 'var(--status-overdue)'
                    : tone === 'warn'  ? 'var(--status-pending)'
                    : tone === 'ok'    ? 'var(--status-paid)'
                    : 'var(--accent)';
    return (
        <div className={`kpi card${tone ? ` tone-${tone}` : ''}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ color: iconColor, flexShrink: 0, marginTop: 2 }}>
                    {icon}
                </span>
                <div>
                    <div className="kpi-value" style={{ fontSize: 24 }}>{value}</div>
                    <div className="kpi-foot">{label}</div>
                </div>
            </div>
        </div>
    );
}

/* ── Modal de mouvement de stock ──────────────────────────────────────────── */
function ModalMouvement({ produit, onClose }) {
    const [form, setForm] = useState({
        type_mouvement: 'entree',
        quantite: '',
        motif: '',
    });
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        setForm({ type_mouvement: 'entree', quantite: '', motif: '' });
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.quantite || Number(form.quantite) <= 0) return;
        setLoading(true);
        router.post(`/stock/${produit.id}/mouvement`, form, {
            onFinish: () => { setLoading(false); handleClose(); },
        });
    };

    return (
        <Modal
            open={!!produit}
            onClose={handleClose}
            title={`Mouvement de stock — ${produit?.titre ?? ''}`}
            size="sm"
        >
            <form onSubmit={handleSubmit}>
                <ModalBody>
                    <div className="col" style={{ gap: 16 }}>
                        <div className="field">
                            <label className="label">Type de mouvement</label>
                            <select
                                className="select"
                                value={form.type_mouvement}
                                onChange={(e) => setForm(prev => ({ ...prev, type_mouvement: e.target.value }))}
                            >
                                <option value="entree">Entrée (réception)</option>
                                <option value="sortie">Sortie (vente / retrait)</option>
                                <option value="ajustement">Ajustement (correction)</option>
                            </select>
                        </div>
                        <div className="field">
                            <label className="label">
                                Quantité{form.type_mouvement === 'ajustement' &&
                                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}> (nouveau stock total)</span>}
                            </label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={form.quantite}
                                onChange={(e) => setForm(prev => ({ ...prev, quantite: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="field">
                            <label className="label">
                                Motif <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optionnel)</span>
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ex. : réception commande, inventaire…"
                                value={form.motif}
                                onChange={(e) => setForm(prev => ({ ...prev, motif: e.target.value }))}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <button type="button" className="btn" onClick={handleClose} disabled={loading}>
                        Annuler
                    </button>
                    <button type="submit" className="btn primary" disabled={loading || !form.quantite}>
                        {loading ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

/* ── Icônes KPI ───────────────────────────────────────────────────────────── */
const IcoPackage = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="22" height="22" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10" />
    </svg>
);
const IcoAlert = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="22" height="22" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
);
const IcoBook = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="22" height="22" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 17h16" />
    </svg>
);
const IcoEuro = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         width="22" height="22" aria-hidden="true">
        <path strokeLinecap="round" d="M14 11H7m7 2H7M19 7a8 8 0 100 10" />
    </svg>
);

/* ── Couleur du stock selon le niveau ─────────────────────────────────────── */
const stockStyle = (p) => {
    if (p.en_rupture) return { color: 'var(--status-overdue)', fontWeight: 700 };
    if (p.en_alerte)  return { color: 'var(--status-pending)', fontWeight: 600 };
    return { color: 'var(--status-paid)', fontWeight: 500 };
};

/* ── Composant principal ──────────────────────────────────────────────────── */

export default function StockIndex({ produits, filters, config, stats }) {
    const [confirm, setConfirm]     = useState(null);
    const [mouvement, setMouvement] = useState(null);
    const [searchVal, setSearchVal] = useState(filters.q ?? '');
    const debounceRef = useRef(null);

    const applyFilter = useCallback((newFilters) => {
        router.get('/stock', { ...filters, ...newFilters }, {
            preserveState: true, replace: true,
        });
    }, [filters]);

    const handleSearch = (val) => {
        setSearchVal(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilter({ q: val, page: 1 }), 400);
    };

    const handleConfirmDelete = () => {
        router.delete(`/stock/${confirm.id}`, { onFinish: () => setConfirm(null) });
    };

    return (
        <AppLayout title="Stock">
            <Head title="Stock" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Stock</h1>
                    <p className="page-sub">Gestion des livres et goodies</p>
                </div>
                <Link href="/stock/creer" className="btn primary">
                    <Plus size={15} />
                    Ajouter un produit
                </Link>
            </div>

            {/* ── KPI Cards ── */}
            <div className="kpi-grid" style={{ marginBottom: 24 }}>
                <KpiCard icon={<IcoPackage />} label="références totales"   value={stats.total}                   />
                <KpiCard icon={<IcoAlert />}   label="en alerte stock"      value={stats.en_alerte}  tone="warn"  />
                <KpiCard icon={<IcoAlert />}   label="en rupture"           value={stats.en_rupture} tone="alert" />
                <KpiCard icon={<IcoBook />}    label="nouveautés"           value={stats.nb_nouveautes} tone="ok" />
                <KpiCard icon={<IcoEuro />}    label="valeur totale du stock" value={euro(stats.valeur_stock_total)} />
            </div>

            {/* ── Filtres ── */}
            <div className="toolbar">
                <div className="input-group" style={{ flex: '1 1 280px', maxWidth: 480 }}>
                    <span className="icon-left"><IcoSearch /></span>
                    <input
                        type="text"
                        className="input"
                        placeholder="Rechercher (titre, auteur, référence, EAN…)"
                        value={searchVal}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={filters.type || ''}
                    onChange={(e) => applyFilter({ type: e.target.value, page: 1 })}
                >
                    <option value="">Tous les types</option>
                    <option value="livre">Livres</option>
                    <option value="goodie">Goodies</option>
                </select>
                <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={filters.statut || ''}
                    onChange={(e) => applyFilter({ statut: e.target.value, page: 1 })}
                >
                    <option value="">Tous les statuts</option>
                    <option value="alerte">En alerte</option>
                    <option value="rupture">En rupture</option>
                    <option value="nouveaute">Nouveautés</option>
                </select>
            </div>

            {/* ── Tableau ── */}
            <div className="card">
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Référence / EAN</th>
                                <th>Genre</th>
                                <th className="right">Prix TTC</th>
                                <th className="center">Stock</th>
                                <th className="right">Valeur stock</th>
                                <th className="center">Nouveauté</th>
                                <th style={{ width: 100 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {produits.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="empty-state">
                                        Aucun produit trouvé.
                                    </td>
                                </tr>
                            ) : produits.data.map((p) => (
                                <tr key={p.id}>
                                    {/* Produit */}
                                    <td>
                                        <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{p.titre}</div>
                                        {p.auteur && (
                                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{p.auteur}</div>
                                        )}
                                        <span className="type-badge"
                                            style={{
                                                background: p.type === 'livre' ? 'var(--accent-soft)' : 'var(--surface-2)',
                                                color: p.type === 'livre' ? 'var(--accent-ink)' : 'var(--muted)',
                                            }}>
                                            {p.type === 'livre' ? 'Livre' : 'Goodie'}
                                        </span>
                                    </td>

                                    {/* Référence */}
                                    <td>
                                        <span className="ref">{p.reference ?? '—'}</span>
                                        {p.ean && (
                                            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{p.ean}</div>
                                        )}
                                    </td>

                                    {/* Genre */}
                                    <td style={{ color: 'var(--muted)' }}>{p.genre ?? '—'}</td>

                                    {/* Prix */}
                                    <td className="right num">{euro(p.prix_ttc)}</td>

                                    {/* Stock */}
                                    <td className="center">
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <span className="mono" style={{ fontSize: 16, ...stockStyle(p) }}>
                                                {p.stock ?? 0}
                                            </span>
                                            {p.en_rupture && (
                                                <span className="badge-status overdue">Rupture</span>
                                            )}
                                            {!p.en_rupture && p.en_alerte && (
                                                <span className="badge-status pending">Alerte</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Valeur */}
                                    <td className="right num">{euro((p.stock ?? 0) * (p.prix_ttc ?? 0))}</td>

                                    {/* Nouveauté */}
                                    <td className="center">
                                        {p.est_nouveaute && (
                                            <span className="badge-status paid">Nouveau</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td>
                                        <div className="actions" style={{ opacity: 1 }}>
                                            <button
                                                className="action-btn"
                                                title="Mouvement de stock"
                                                onClick={() => setMouvement(p)}
                                            >
                                                <IcoArrows />
                                            </button>
                                            <Link href={`/stock/${p.id}/modifier`} className="action-btn" title="Modifier">
                                                <IcoEdit />
                                            </Link>
                                            <button
                                                className="action-btn danger"
                                                title="Supprimer"
                                                onClick={() => setConfirm(p)}
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
                {produits.meta?.last_page > 1 && (
                    <div className="pagination">
                        <div className="pages">
                            {produits.links.map((link, i) => (
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

            {/* ── Modal de mouvement de stock ── */}
            <ModalMouvement produit={mouvement} onClose={() => setMouvement(null)} />

            {/* ── Dialog de confirmation de suppression ── */}
            <ConfirmDialog
                open={!!confirm}
                message={`Déplacer « ${confirm?.titre} » en corbeille ? Cette action est réversible.`}
                confirmLabel="Supprimer"
                danger
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirm(null)}
            />
        </AppLayout>
    );
}
