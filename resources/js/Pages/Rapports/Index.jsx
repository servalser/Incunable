/**
 * Rapports/Index — synthèse financière mensuelle.
 *
 * Props reçues via Inertia :
 *   annee, mois, kpis, lcr_emises, lcr_dues, offices_recus, par_distributeur, chart_data
 */

import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { AppLayout }  from '../../Components/Layout/AppLayout';
import { Badge }      from '../../Components/UI/Badge';
import { ChevronLeft, ChevronRight, Printer, TrendingUp, TrendingDown, AlertCircle, BookOpen } from 'lucide-react';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const euro = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

const MOIS_FR = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/* ── Graphique tendance (Chart.js CDN) ─────────────────────────────────────── */
function TendanceChart({ data }) {
    const canvasRef = useRef(null);
    const chartRef  = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !window.Chart) return;
        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new window.Chart(canvasRef.current, {
            type: 'bar',
            data: {
                labels: data.map(d => d.label),
                datasets: [
                    {
                        label: 'LCR émises',
                        data: data.map(d => d.lettres),
                        backgroundColor: 'hsl(8 30% 40% / 0.75)', // accent oxblood
                        borderRadius: 4,
                    },
                    {
                        label: 'Offices reçus',
                        data: data.map(d => d.offices),
                        backgroundColor: 'hsl(142 40% 45% / 0.65)', // paid green
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { stacked: false, grid: { display: false } },
                    y: {
                        ticks: {
                            callback: (v) =>
                                new Intl.NumberFormat('fr-FR', {
                                    notation: 'compact', style: 'currency', currency: 'EUR',
                                }).format(v),
                        },
                    },
                },
            },
        });
        return () => chartRef.current?.destroy();
    }, [data]);

    return (
        <div style={{ height: 280 }}>
            <canvas ref={canvasRef} />
        </div>
    );
}

/* ── Navigation mois ───────────────────────────────────────────────────────── */
function NavMois({ annee, mois }) {
    const navigate = (delta) => {
        let m = mois + delta;
        let a = annee;
        if (m < 1)  { m = 12; a--; }
        if (m > 12) { m = 1;  a++; }
        router.get('/rapports', { annee: a, mois: m }, { preserveState: false });
    };

    const isFuture = annee === new Date().getFullYear() && mois === new Date().getMonth() + 1;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
                className="btn ghost"
                style={{ width: 32, height: 32, padding: 0, display: 'grid', placeItems: 'center' }}
                onClick={() => navigate(-1)}
                title="Mois précédent"
            >
                <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 15, minWidth: 160, textAlign: 'center', color: 'var(--ink)' }}>
                {MOIS_FR[mois]} {annee}
            </span>
            <button
                className="btn ghost"
                style={{ width: 32, height: 32, padding: 0, display: 'grid', placeItems: 'center' }}
                onClick={() => navigate(1)}
                disabled={isFuture}
                title="Mois suivant"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

/* ── KPI card ───────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, variant = 'default', sub }) {
    const colorVar = {
        default: 'var(--accent)',
        success: 'var(--status-paid)',
        warning: 'var(--status-pending)',
        danger:  'var(--status-overdue)',
    }[variant] ?? 'var(--accent)';

    const bgVar = {
        default: 'var(--accent-soft)',
        success: 'var(--status-paid-bg)',
        warning: 'var(--status-pending-bg)',
        danger:  'var(--status-overdue-bg)',
    }[variant] ?? 'var(--accent-soft)';

    return (
        <div className="kpi card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                    <div className="kpi-foot" style={{ marginBottom: 4 }}>{label}</div>
                    <div className="kpi-value" style={{ color: colorVar, fontSize: 22 }}>{value}</div>
                    {sub && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>}
                </div>
                <span style={{ background: bgVar, color: colorVar, borderRadius: 8, width: 36, height: 36, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon size={16} aria-hidden="true" />
                </span>
            </div>
        </div>
    );
}

/* ── Page principale ────────────────────────────────────────────────────────── */
export default function RapportsIndex({
    annee, mois, kpis,
    lcr_emises, lcr_dues, offices_recus,
    par_distributeur, chart_data,
}) {
    const [onglet, setOnglet] = useState('lcr_emises');

    const ONGLETS = [
        { key: 'lcr_emises',    label: `LCR émises (${lcr_emises.length})` },
        { key: 'lcr_dues',      label: `LCR à échéance (${lcr_dues.length})` },
        { key: 'offices_recus', label: `Offices reçus (${offices_recus.length})` },
        { key: 'distributeurs', label: 'Par distributeur' },
    ];

    return (
        <AppLayout title="Rapports">
            <Head title="Rapports" />

            {/* ── En-tête ── */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Rapports</h1>
                    <p className="page-sub">Synthèse financière mensuelle</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <NavMois annee={annee} mois={mois} />
                    <button className="btn ghost" onClick={() => window.print()}>
                        <Printer size={15} aria-hidden="true" />
                        Imprimer
                    </button>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="kpi-grid" style={{ marginBottom: 24 }}>
                <KpiCard
                    label="LCR émises"
                    value={euro(kpis.lcr_emises_total)}
                    icon={TrendingUp}
                    sub={`${kpis.lcr_emises_count} lettre${kpis.lcr_emises_count !== 1 ? 's' : ''}`}
                    variant="default"
                />
                <KpiCard
                    label="LCR à échéance"
                    value={euro(kpis.lcr_dues_total)}
                    icon={AlertCircle}
                    sub={kpis.lcr_en_retard > 0 ? `dont ${euro(kpis.lcr_en_retard)} en retard` : 'Aucun retard'}
                    variant={kpis.lcr_en_retard > 0 ? 'danger' : 'success'}
                />
                <KpiCard
                    label="Offices reçus"
                    value={euro(kpis.offices_total)}
                    icon={BookOpen}
                    sub={`${kpis.offices_count} office${kpis.offices_count !== 1 ? 's' : ''}`}
                    variant="default"
                />
                <KpiCard
                    label="Net offices"
                    value={euro(kpis.offices_net)}
                    icon={TrendingDown}
                    sub="Après retours"
                    variant="success"
                />
            </div>

            {/* ── Graphique 12 mois ── */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-head">
                    <h2 className="section-title" style={{ margin: 0 }}>Tendance 12 mois</h2>
                </div>
                <div style={{ padding: '0 20px 20px' }}>
                    <TendanceChart data={chart_data} />
                </div>
            </div>

            {/* ── Détail tabulaire ── */}
            <div className="card" style={{ marginBottom: 24 }}>
                {/* Onglets */}
                <div style={{ padding: '16px 20px 0', borderBottom: '1px solid var(--hairline)' }}>
                    <div className="tabs">
                        {ONGLETS.map(({ key, label }) => (
                            <button
                                key={key}
                                className={`tab${onglet === key ? ' active' : ''}`}
                                onClick={() => setOnglet(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LCR émises */}
                {onglet === 'lcr_emises' && (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Référence</th>
                                    <th>Distributeur</th>
                                    <th>Émission</th>
                                    <th>Échéance</th>
                                    <th className="right">Montant TTC</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lcr_emises.length === 0 ? (
                                    <tr><td colSpan={6} className="empty-state">Aucune LCR émise ce mois.</td></tr>
                                ) : lcr_emises.map(l => (
                                    <tr key={l.id}>
                                        <td><span className="ref">{l.reference}</span></td>
                                        <td>{l.distributeur}</td>
                                        <td style={{ color: 'var(--muted)' }}>{dateFr(l.date_emission)}</td>
                                        <td style={{ color: 'var(--muted)' }}>{dateFr(l.date_echeance)}</td>
                                        <td className="right num">{euro(l.montant_ttc)}</td>
                                        <td><Badge kind="lcr" value={l.statut} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* LCR dues */}
                {onglet === 'lcr_dues' && (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Référence</th>
                                    <th>Distributeur</th>
                                    <th>Échéance</th>
                                    <th className="right">Montant TTC</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lcr_dues.length === 0 ? (
                                    <tr><td colSpan={5} className="empty-state">Aucune LCR à échéance ce mois.</td></tr>
                                ) : lcr_dues.map(l => (
                                    <tr key={l.id}>
                                        <td><span className="ref">{l.reference}</span></td>
                                        <td>{l.distributeur}</td>
                                        <td style={{ color: 'var(--muted)' }}>{dateFr(l.date_echeance)}</td>
                                        <td className="right num">{euro(l.montant_ttc)}</td>
                                        <td><Badge kind="lcr" value={l.statut} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Offices reçus */}
                {onglet === 'offices_recus' && (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Référence</th>
                                    <th>Distributeur</th>
                                    <th>Réception</th>
                                    <th>Retour limite</th>
                                    <th className="right">Montant TTC</th>
                                    <th className="right">Net</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offices_recus.length === 0 ? (
                                    <tr><td colSpan={7} className="empty-state">Aucun office reçu ce mois.</td></tr>
                                ) : offices_recus.map(o => (
                                    <tr key={o.id}>
                                        <td><span className="ref">{o.reference}</span></td>
                                        <td>{o.distributeur}</td>
                                        <td style={{ color: 'var(--muted)' }}>{dateFr(o.date_reception)}</td>
                                        <td style={{ color: 'var(--muted)' }}>{dateFr(o.date_retour_limite)}</td>
                                        <td className="right num">{euro(o.montant_ttc)}</td>
                                        <td className="right num">{euro(o.montant_ttc - o.montant_retourne)}</td>
                                        <td><Badge kind="office" value={o.statut} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Par distributeur */}
                {onglet === 'distributeurs' && (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Distributeur</th>
                                    <th className="right">Nb LCR</th>
                                    <th className="right">Total LCR émises</th>
                                </tr>
                            </thead>
                            <tbody>
                                {par_distributeur.length === 0 ? (
                                    <tr><td colSpan={3} className="empty-state">Aucune donnée ce mois.</td></tr>
                                ) : par_distributeur.map((d, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{d.nom}</td>
                                        <td className="right" style={{ color: 'var(--muted)' }}>{d.nb}</td>
                                        <td className="right num">{euro(d.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
