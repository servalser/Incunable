/**
 * Dashboard — vue d'ensemble financière.
 *
 * Props reçues depuis DashboardController (Inertia) :
 *   stats          { du_ce_mois, du_30j, en_retard, offices_alerte }
 *   prochaines     [{ id, reference, distributeur, montant_ttc, date_echeance, statut, jours_restants }]
 *   alertes_retard [{ id, reference, distributeur, montant_ttc, date_echeance }]
 *   alertes_proches [{ id, reference, distributeur, montant_ttc, date_echeance, jours_restants }]
 *   alertes_offices [{ id, reference, distributeur, date_retour_limite, jours_restants }]
 *   chart_data     [{ label, lettres, offices }]
 *   distrib_stats  [{ nom, total }]
 */

import { Head, Link, router }                       from '@inertiajs/react';
import { useState, useRef, useEffect }              from 'react';
import { motion, AnimatePresence }                  from 'framer-motion';
import { Lightbulb, Package, X, Wallet,
         TrendingUp, TrendingDown, Minus,
         ArrowRight, RotateCcw, Check }             from 'lucide-react';
import { AppLayout }                               from '../Components/Layout/AppLayout';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const euro = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const eurShort = (n) => {
    if (n >= 10000) return `${(n / 1000).toFixed(0)}k€`;
    if (n >= 1000)  return `${(n / 1000).toFixed(1)}k€`;
    return `${Math.round(n)}€`;
};

const dateFr = (str) => str
    ? new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

const todayFr = () => new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

const daysFrom = (dateStr) => {
    if (!dateStr) return 0;
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
};

/* Sparkline décorative basée sur la valeur finale */
const genSpark = (finalVal, len = 12) => {
    const v = Math.abs(finalVal || 0);
    return Array.from({ length: len }, (_, i) => {
        const t     = i / (len - 1);
        const noise = Math.sin(i * 1.9 + v * 0.0007) * 0.12 + 1;
        return (v * 0.65 + v * 0.35 * t) * noise;
    });
};

/* ── Sparkline SVG ────────────────────────────────────────────────────────── */
function Sparkline({ data, tone }) {
    const W = 240, H = 36;
    const max   = Math.max(...data, 1);
    const min   = Math.min(...data);
    const range = max - min || 1;
    const pts   = data.map((v, i) => [
        (i / (data.length - 1)) * W,
        H - ((v - min) / range) * (H - 6) - 3,
    ]);
    const path = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
    const area = `${path} L${W},${H} L0,${H} Z`;
    const stroke = tone === 'alert' ? 'var(--status-overdue)'
                 : tone === 'warn'  ? 'var(--status-pending)'
                 : 'var(--accent)';
    return (
        <svg className="kpi-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <path d={area} fill={stroke} opacity="0.10"/>
            <path d={path} fill="none" stroke={stroke} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

/* ── Carte KPI ────────────────────────────────────────────────────────────── */
/* Remplace les flèches ASCII par des icônes lucide (ANTI-SLOP rule) */
function KpiCard({ label, value, foot, trend, spark, tone }) {
    const TrendIcon = trend?.dir === 'up'   ? TrendingUp
                    : trend?.dir === 'down' ? TrendingDown
                    : Minus;
    return (
        <div className={`kpi card${tone ? ` tone-${tone}` : ''}`}>
            <div className="kpi-row">
                <div className="kpi-label">{label}</div>
                {trend && (
                    <div className={`kpi-trend tone-${trend.tone}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <TrendIcon size={11} />
                        <span>{trend.text}</span>
                    </div>
                )}
            </div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-foot">{foot}</div>
            {spark && <Sparkline data={spark} tone={tone} />}
        </div>
    );
}

/* ── Graphique financier interactif ──────────────────────────────────────── */
function FinancialChart({ data }) {
    /* data = [{ m, bills, offices }] */
    const [range,   setRange]  = useState([Math.max(0, data.length - 6), data.length - 1]);
    const [hover,   setHover]  = useState(null);
    const [show,    setShow]   = useState({ bills: true, offices: true });
    const brushRef  = useRef(null);
    const dragRef   = useRef(null);

    const visible     = data.slice(range[0], range[1] + 1);
    const totalBills  = visible.reduce((s, d) => s + d.bills,   0);
    const totalOffices= visible.reduce((s, d) => s + d.offices, 0);

    const W = 1000, H = 280, pad = { l: 60, r: 16, t: 18, b: 36 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    const max    = Math.max(...visible.map(d =>
        (show.bills ? d.bills : 0) + (show.offices ? d.offices : 0)), 1);
    const niceMax = Math.ceil(max / 1000) * 1000 || 1000;
    const ticks   = [0, 0.25, 0.5, 0.75, 1].map(t => t * niceMax);
    const bw      = innerW / (visible.length || 1);
    const groupW  = bw * 0.62;
    const barW    = groupW / 2 - 1;

    /* Brush drag */
    const onBrushDown = (e, type) => {
        e.preventDefault(); e.stopPropagation();
        dragRef.current = { type, startX: e.clientX, origLeft: range[0], origRight: range[1] };
        window.addEventListener('pointermove', onBrushMove);
        window.addEventListener('pointerup',   onBrushUp);
    };
    const onBrushMove = (e) => {
        if (!dragRef.current || !brushRef.current) return;
        const rect  = brushRef.current.getBoundingClientRect();
        const dx    = e.clientX - dragRef.current.startX;
        const stepW = rect.width / data.length;
        const dStep = Math.round(dx / stepW);
        let { origLeft, origRight, type } = dragRef.current;
        let nl = origLeft, nr = origRight;
        if (type === 'left')  nl = Math.min(origRight - 1, Math.max(0, origLeft + dStep));
        else if (type === 'right') nr = Math.max(origLeft + 1, Math.min(data.length - 1, origRight + dStep));
        else if (type === 'move') {
            const span = origRight - origLeft;
            nl = Math.max(0, Math.min(data.length - 1 - span, origLeft + dStep));
            nr = nl + span;
        }
        setRange([nl, nr]);
    };
    const onBrushUp = () => {
        dragRef.current = null;
        window.removeEventListener('pointermove', onBrushMove);
        window.removeEventListener('pointerup',   onBrushUp);
    };

    const setLastN = (n) => setRange([Math.max(0, data.length - n), data.length - 1]);
    const presets  = [{ label: '3 mois', n: 3 }, { label: '6 mois', n: 6 },
                      { label: '12 mois', n: 12 }, { label: 'Tout', n: data.length }];

    const BW = 1000, BH = 56, bpad = { l: 8, r: 8, t: 6, b: 18 };
    const bbw    = (BW - bpad.l - bpad.r) / (data.length || 1);
    const bMax   = Math.max(...data.map(d => d.bills + d.offices), 1);
    const leftPx = bpad.l + range[0] * bbw;
    const rightPx= bpad.l + (range[1] + 1) * bbw;

    if (!data.length) return (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
            Aucune donnée disponible
        </div>
    );

    return (
        <>
            {/* En-tête */}
            <div className="card-head chart-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 className="section-title">Charge financière mensuelle</h2>
                    <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', marginRight: 6 }}/>
                            Lettres&nbsp;<b style={{ color: 'var(--ink)' }}>{euro(totalBills)}</b>
                        </span>
                        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, border: '1.5px solid var(--accent)', display: 'inline-block', marginRight: 6 }}/>
                            Offices&nbsp;<b style={{ color: 'var(--ink)' }}>{euro(totalOffices)}</b>
                        </span>
                        {visible.length > 0 && (
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {visible[0].m} → {visible[visible.length - 1].m}
                            </span>
                        )}
                    </div>
                </div>
                {/* Presets */}
                <div style={{
                    display: 'inline-flex', border: '1px solid var(--hairline)',
                    borderRadius: 7, padding: 3, background: 'var(--paper)', gap: 2,
                }}>
                    {presets.map(p => {
                        const active = range[1] - range[0] + 1 === p.n && range[1] === data.length - 1;
                        return (
                            <button key={p.label}
                                onClick={() => setLastN(p.n)}
                                style={{
                                    padding: '5px 12px', borderRadius: 5, fontSize: 12.5,
                                    background: active ? 'var(--surface)' : 'transparent',
                                    color: active ? 'var(--accent)' : 'var(--ink-2)',
                                    fontWeight: active ? 500 : 400,
                                    boxShadow: active ? '0 1px 2px rgba(0,0,0,.05)' : 'none',
                                    transition: 'all .12s',
                                }}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Corps du graphique */}
            <div className="card-body">
                {/* Légendes interactives */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    {[
                        { key: 'bills',   label: 'Lettres de change', color: 'var(--accent)' },
                        { key: 'offices', label: 'Offices',           color: 'var(--accent-soft)', border: true },
                    ].map(({ key, label, color, border }) => (
                        <button key={key}
                            onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '4px 10px', borderRadius: 999,
                                border: '1px solid var(--hairline)',
                                background: show[key] ? 'var(--surface)' : 'var(--surface-2)',
                                fontSize: 12, color: show[key] ? 'var(--ink)' : 'var(--muted)',
                                transition: 'all .12s',
                            }}
                        >
                            <span style={{
                                width: 8, height: 8, borderRadius: border ? 2 : '50%',
                                background: show[key] ? color : 'var(--muted-2)',
                                border: border ? '1.5px solid var(--accent)' : 'none',
                                flexShrink: 0,
                            }}/>
                            {label}
                        </button>
                    ))}
                </div>

                {/* SVG du graphique */}
                <div style={{ overflowX: 'auto' }}>
                    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="280"
                        style={{ display: 'block' }}>
                        <defs>
                            <linearGradient id="gBills" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--accent)" stopOpacity="1"/>
                                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.82"/>
                            </linearGradient>
                            <linearGradient id="gOffices" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--accent-soft)" stopOpacity="1"/>
                                <stop offset="100%" stopColor="var(--accent-soft)" stopOpacity="0.7"/>
                            </linearGradient>
                        </defs>

                        {/* Grille Y */}
                        {ticks.map((t, i) => {
                            const y = pad.t + innerH - (t / niceMax) * innerH;
                            return (
                                <g key={i}>
                                    <line x1={pad.l} x2={W - pad.r} y1={y} y2={y}
                                        stroke="var(--hairline)" strokeWidth="1"
                                        strokeDasharray={i === 0 ? '' : '2 3'}/>
                                    <text x={pad.l - 10} y={y + 3.5} fontSize="10.5"
                                        fill="var(--muted)" textAnchor="end"
                                        fontFamily="var(--font-mono)">
                                        {eurShort(t)}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Barres */}
                        {visible.map((d, i) => {
                            const cx = pad.l + i * bw + bw / 2;
                            const x  = cx - groupW / 2;
                            const hb = show.bills   ? (d.bills   / niceMax) * innerH : 0;
                            const ho = show.offices ? (d.offices / niceMax) * innerH : 0;
                            const isH = hover === i;
                            return (
                                <g key={i}
                                    onMouseEnter={() => setHover(i)}
                                    onMouseLeave={() => setHover(null)}>
                                    <rect x={pad.l + i * bw} y={pad.t} width={bw} height={innerH} fill="transparent"/>
                                    {show.bills && (
                                        <rect x={x} y={pad.t + innerH - hb}
                                            width={barW} height={hb}
                                            fill="url(#gBills)" rx="2"/>
                                    )}
                                    {show.offices && (
                                        <rect x={x + barW + 2} y={pad.t + innerH - ho}
                                            width={barW} height={ho}
                                            fill="url(#gOffices)"
                                            stroke="var(--accent)" strokeWidth="1" rx="2"/>
                                    )}
                                    <text x={cx} y={H - 14} fontSize="10.5" textAnchor="middle"
                                        fill={isH ? 'var(--ink)' : 'var(--muted)'}
                                        fontFamily="var(--font-ui)"
                                        style={{ fontWeight: isH ? 600 : 400 }}>
                                        {d.m}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Tooltip au survol */}
                        {hover !== null && (() => {
                            const d     = visible[hover];
                            const cx    = pad.l + hover * bw + bw / 2;
                            const total = (show.bills ? d.bills : 0) + (show.offices ? d.offices : 0);
                            const tipW  = 152, tipH = 66;
                            const tipY  = pad.t + innerH - (total / niceMax) * innerH - 14;
                            const tipX  = Math.max(pad.l + 4, Math.min(W - pad.r - tipW - 4, cx - tipW / 2));
                            return (
                                <g pointerEvents="none">
                                    <line x1={cx} x2={cx} y1={pad.t} y2={pad.t + innerH}
                                        stroke="var(--accent)" strokeWidth="1"
                                        strokeDasharray="2 3" opacity="0.5"/>
                                    <rect x={tipX} y={tipY - tipH} width={tipW} height={tipH}
                                        rx="6" fill="var(--surface)"
                                        stroke="var(--hairline-strong)" strokeWidth="1"
                                        filter="drop-shadow(0 4px 8px rgba(0,0,0,.08))"/>
                                    <text x={tipX + 12} y={tipY - tipH + 18} fontSize="10.5"
                                        fill="var(--muted)" fontFamily="var(--font-mono)"
                                        letterSpacing="0.06em">
                                        {d.m.toUpperCase()}
                                    </text>
                                    <text x={tipX + 12} y={tipY - tipH + 36} fontSize="11.5" fill="var(--ink)" fontFamily="var(--font-ui)">
                                        <tspan fill="var(--accent)" fontWeight="600">●</tspan>
                                        {' '}Lettres{' '}
                                        <tspan x={tipX + tipW - 12} textAnchor="end"
                                            fontFamily="var(--font-mono)" fontWeight="600">
                                            {eurShort(d.bills)}
                                        </tspan>
                                    </text>
                                    <text x={tipX + 12} y={tipY - tipH + 53} fontSize="11.5" fill="var(--ink)" fontFamily="var(--font-ui)">
                                        <tspan fill="var(--accent-ink)" fontWeight="600">○</tspan>
                                        {' '}Offices{' '}
                                        <tspan x={tipX + tipW - 12} textAnchor="end"
                                            fontFamily="var(--font-mono)" fontWeight="600">
                                            {eurShort(d.offices)}
                                        </tspan>
                                    </text>
                                </g>
                            );
                        })()}
                    </svg>
                </div>

                {/* Brush — sélecteur de plage */}
                <div className="chart-brush" ref={brushRef}
                    style={{ position: 'relative', marginTop: 8, userSelect: 'none' }}>
                    <svg viewBox={`0 0 ${BW} ${BH}`} width="100%" height={BH}
                        preserveAspectRatio="none" style={{ display: 'block' }}>
                        <line x1={bpad.l} x2={BW - bpad.r} y1={BH - bpad.b} y2={BH - bpad.b}
                            stroke="var(--hairline)" strokeWidth="1"/>
                        {data.map((d, i) => {
                            const total   = d.bills + d.offices;
                            const h       = (total / bMax) * (BH - bpad.t - bpad.b);
                            const x       = bpad.l + i * bbw + 1;
                            const inRange = i >= range[0] && i <= range[1];
                            return (
                                <g key={i}>
                                    <rect x={x} y={BH - bpad.b - h} width={bbw - 2} height={h}
                                        fill={inRange ? 'var(--accent)' : 'var(--hairline-strong)'}
                                        opacity={inRange ? 0.9 : 0.5} rx="1"/>
                                    {(i === 0 || i === data.length - 1 || i % 2 === 0) && (
                                        <text x={x + bbw / 2 - 1} y={BH - 4} fontSize="9"
                                            fill="var(--muted)" textAnchor="middle"
                                            fontFamily="var(--font-mono)">
                                            {d.m.split(' ')[0]}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                    {/* Masques hors sélection */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, bottom: bpad.b,
                        width: `${(leftPx / BW) * 100}%`,
                        background: 'var(--paper)', opacity: 0.55, pointerEvents: 'none',
                    }}/>
                    <div style={{
                        position: 'absolute', top: 0, bottom: bpad.b,
                        left: `${(rightPx / BW) * 100}%`,
                        right: 0,
                        background: 'var(--paper)', opacity: 0.55, pointerEvents: 'none',
                    }}/>
                    {/* Zone de sélection draggable */}
                    <div
                        style={{
                            position: 'absolute', top: 0, bottom: bpad.b,
                            left: `${(leftPx / BW) * 100}%`,
                            width: `${((rightPx - leftPx) / BW) * 100}%`,
                            border: '1.5px solid var(--accent)', borderRadius: 3,
                            cursor: 'grab',
                        }}
                        onPointerDown={(e) => onBrushDown(e, 'move')}
                    >
                        <div style={{
                            position: 'absolute', left: -5, top: 0, bottom: 0,
                            width: 10, cursor: 'ew-resize',
                        }} onPointerDown={(e) => onBrushDown(e, 'left')}/>
                        <div style={{
                            position: 'absolute', right: -5, top: 0, bottom: 0,
                            width: 10, cursor: 'ew-resize',
                        }} onPointerDown={(e) => onBrushDown(e, 'right')}/>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Widget Questions intelligentes ─────────────────────────────────────── */

/**
 * WidgetQuestions — affiche les questions intelligentes générées par l'IA.
 *
 * Fonctionnement :
 *  - Au montage : GET /dashboard/questions → tableau de questions
 *  - Affiche une question à la fois, navigation par dots
 *  - Bouton "Hors contexte" → POST /dashboard/questions/ignorer → retire la question
 *  - Si aucune question (ou erreur réseau) → widget masqué (return null)
 */
function WidgetQuestions() {
    const [questions, setQuestions] = useState([]);
    const [index,     setIndex]     = useState(0);
    const [loading,   setLoading]   = useState(true);

    /* Chargement initial des questions au montage du composant */
    useEffect(() => {
        fetch('/dashboard/questions', {
            headers: {
                'Accept':       'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
            },
        })
            .then(r => r.json())
            .then(d => { setQuestions(d.questions ?? []); setLoading(false); })
            .catch(() => setLoading(false)); /* En cas d'erreur réseau → masquer */
    }, []);

    /* Ignorer une question : POST puis retirer du tableau local */
    const ignorer = async (q) => {
        await fetch('/dashboard/questions/ignorer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept':       'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
            },
            body: JSON.stringify({
                question_id: q.id,
                entite_type: q.entite_type,
                entite_id:   q.entite_id,
            }),
        });
        /* Mettre à jour la liste locale sans recharger */
        const restantes = questions.filter((_, i) => i !== index);
        setQuestions(restantes);
        /* S'assurer que l'index reste valide après suppression */
        setIndex(Math.min(index, restantes.length - 1));
    };

    /* Masquer le widget si chargement en cours ou aucune question */
    if (loading || questions.length === 0) return null;

    const q = questions[index]; /* Question actuellement affichée */

    return (
        /* Animation fluide d'apparition du widget */
        <motion.div
            className="card"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
                borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                background:  'color-mix(in srgb, var(--accent)  5%, var(--surface))',
                marginBottom: 24,
            }}
        >
            <div className="card-body" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    {/* Icône + texte de la question */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                        <Lightbulb size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>
                                À réfléchir
                            </p>
                            <p style={{ fontWeight: 500, color: 'var(--ink)', margin: 0 }}>
                                {q.question}
                            </p>
                            {/* Contexte optionnel sous la question */}
                            {q.contexte && (
                                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, margin: '4px 0 0 0' }}>
                                    {q.contexte}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Bouton "Hors contexte" */}
                    <button
                        onClick={() => ignorer(q)}
                        style={{
                            display:    'flex', alignItems: 'center', gap: 4,
                            fontSize:   12, color: 'var(--muted)', flexShrink: 0,
                            whiteSpace: 'nowrap', background: 'none', border: 'none',
                            cursor: 'pointer', padding: '2px 4px',
                        }}
                        title="Marquer comme hors contexte pour ce produit"
                    >
                        Hors contexte <X size={12} />
                    </button>
                </div>

                {/* Dots de navigation — visibles seulement si plusieurs questions */}
                {questions.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                        {questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndex(i)}
                                style={{
                                    width: 6, height: 6, borderRadius: '50%', border: 'none', padding: 0,
                                    background:  i === index ? 'var(--accent)' : 'var(--muted-2)',
                                    cursor:      'pointer',
                                    transition:  'background .15s',
                                    flexShrink:  0,
                                }}
                                aria-label={`Question ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_WIDGETS = { kpis: true, alerts: true, chart: true, suppliers: true, deadlines: true };

/* ── Widget Budget Mensuel (affiché en priorité en haut du dashboard) ───── */
function BudgetWidget({ budget }) {
    if (!budget) return null;

    const { total_prevu, total_reel, restant, progression_mois, progression_budget, categories, mois_label } = budget;
    const depasse = restant < 0;
    const alerte  = progression_budget > progression_mois + 15; // consommation > avancement du mois + marge

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ marginBottom: 24 }}
        >
            <div className={`card${depasse ? ' tone-alert' : ''}`} style={{
                border: depasse ? '1.5px solid var(--status-overdue)' : alerte ? '1.5px solid var(--status-pending)' : undefined,
            }}>
                <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        <Wallet size={16} />
                        Budget — <span style={{ textTransform: 'capitalize' }}>{mois_label}</span>
                    </h2>
                    <Link href="/budget" className="btn ghost sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        Détails <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                    {/* Résumé principal */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Budget prévu</div>
                            <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
                                {euro(total_prevu)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Dépensé</div>
                            <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: alerte ? 'var(--status-pending)' : 'var(--ink)' }}>
                                {euro(total_reel)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                                {depasse ? 'Dépassement' : 'Restant'}
                            </div>
                            <div className="mono" style={{
                                fontSize: 22, fontWeight: 700,
                                color: depasse ? 'var(--status-overdue)' : 'var(--status-paid)',
                            }}>
                                {depasse ? '+' : ''}{euro(Math.abs(restant))}
                            </div>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div style={{ position: 'relative', height: 10, borderRadius: 6, background: 'var(--surface-2)', overflow: 'hidden' }}>
                        {/* Barre consommation budget */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, height: '100%',
                            width: `${Math.min(progression_budget, 100)}%`,
                            background: depasse ? 'var(--status-overdue)' : alerte ? 'var(--status-pending)' : 'var(--accent)',
                            borderRadius: 6,
                            transition: 'width .4s ease',
                        }} />
                        {/* Marqueur avancement du mois */}
                        <div style={{
                            position: 'absolute', top: -2, height: 14,
                            left: `${progression_mois}%`,
                            width: 2, background: 'var(--ink)', opacity: 0.4,
                            borderRadius: 1,
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                        <span>{progression_budget}% du budget consommé</span>
                        <span>{progression_mois}% du mois écoulé</span>
                    </div>

                    {/* Détail par catégorie */}
                    {categories && categories.length > 0 && (
                        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {categories.map((c, i) => (
                                <div key={i} style={{
                                    flex: '1 1 calc(50% - 8px)', minWidth: 180,
                                    padding: '8px 12px', borderRadius: 6,
                                    border: '1px solid var(--hairline)',
                                    background: 'var(--surface)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>
                                            {c.categorie}
                                        </span>
                                        <span className="mono" style={{
                                            fontSize: 12,
                                            color: c.restant < 0 ? 'var(--status-overdue)' : 'var(--muted)',
                                        }}>
                                            {euro(c.restant)}
                                        </span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-2)' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 2,
                                            width: `${Math.min(c.pourcent, 100)}%`,
                                            background: c.pourcent > 90 ? 'var(--status-overdue)' : c.pourcent > 70 ? 'var(--status-pending)' : 'var(--accent)',
                                            transition: 'width .3s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function Dashboard({
    stats,
    budget_mois = null,
    prochaines,
    alertes_retard,
    alertes_proches,
    alertes_offices,
    chart_data,
    distrib_stats,
    /* Props Stock — optionnelles, null si le module Stock n'est pas actif */
    stock_kpis      = null,
    top5_produits   = [],
    produits_dormants = [],
}) {
    const [editMode, setEditMode] = useState(false);
    const [widgets,  setWidgets]  = useState(() => {
        try { return { ...DEFAULT_WIDGETS, ...JSON.parse(localStorage.getItem('incunable.widgets') || '{}') }; }
        catch { return DEFAULT_WIDGETS; }
    });

    const toggleWidget = (k) => {
        const next = { ...widgets, [k]: !widgets[k] };
        setWidgets(next);
        localStorage.setItem('incunable.widgets', JSON.stringify(next));
    };
    const resetWidgets = () => {
        setWidgets(DEFAULT_WIDGETS);
        localStorage.setItem('incunable.widgets', JSON.stringify(DEFAULT_WIDGETS));
    };

    /* Wrapper widget — gère le mode édition */
    const Widget = ({ id, children, style }) => {
        if (!editMode && !widgets[id]) return null;
        if (editMode) {
            return (
                <div className={`dash-widget${widgets[id] ? '' : ' hidden'}`} style={style}>
                    <div className="dash-widget-bar">
                        <label className="dash-widget-toggle">
                            <input type="checkbox" checked={widgets[id]}
                                onChange={() => toggleWidget(id)}/>
                            <span>{widgets[id] ? 'Visible' : 'Masqué'}</span>
                        </label>
                    </div>
                    <div className="dash-widget-body">{children}</div>
                </div>
            );
        }
        return <div style={style}>{children}</div>;
    };

    /* Données du graphique */
    const chartData = (chart_data ?? []).map(d => ({
        m:       d.label,
        bills:   d.lettres  ?? 0,
        offices: d.offices  ?? 0,
    }));

    const totalAlertes = (alertes_retard?.length ?? 0)
                       + (alertes_proches?.length ?? 0)
                       + (alertes_offices?.length ?? 0);

    const enRetardCount = alertes_retard?.length ?? 0;

    return (
        <AppLayout title="Tableau de bord">
            <Head title="Tableau de bord" />

            {/* ── En-tête de page ── */}
            <div className={`page-head${editMode ? ' dash-editing' : ''}`}>
                <div>
                    <h1 className="page-title">Tableau de bord</h1>
                    <div className="page-sub" style={{ textTransform: 'capitalize' }}>{todayFr()}</div>
                </div>
                <div className="row">
                    {editMode ? (
                        <>
                            <button className="btn" onClick={resetWidgets}>
                                <RotateCcw size={14} />
                                Réinitialiser
                            </button>
                            <button className="btn primary" onClick={() => setEditMode(false)}>
                                <Check size={14} />
                                Terminer
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn" onClick={() => setEditMode(true)}>
                                Modifier la vue
                            </button>
                            <Link href="/lettres/create" className="btn primary">
                                Nouvelle LCR
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* ── Budget mensuel — mis en avant avant tout ── */}
            <BudgetWidget budget={budget_mois} />

            {/* ── KPIs — animés en cascade (stagger) au chargement ── */}
            <Widget id="kpis" style={{ marginBottom: 24 }}>
                {/* motion.div parent orchestre le stagger sur les enfants */}
                <motion.div
                    className="kpi-grid"
                    variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
                    initial="initial"
                    animate="animate"
                >
                    {[
                        {
                            label: 'Échéance ce mois',
                            value: euro(stats?.du_ce_mois),
                            foot: 'LCR en cours ce mois',
                            trend: { dir: 'flat', text: 'ce mois', tone: 'neutral' },
                            spark: genSpark(stats?.du_ce_mois),
                        },
                        {
                            label: 'À 30 jours',
                            value: euro(stats?.du_30j),
                            foot: 'Échéances à venir',
                            trend: { dir: 'flat', text: 'à venir', tone: 'neutral' },
                            spark: genSpark(stats?.du_30j),
                        },
                        {
                            tone: enRetardCount > 0 ? 'alert' : undefined,
                            label: 'En retard',
                            value: euro(stats?.en_retard),
                            foot: `${enRetardCount} lettre${enRetardCount > 1 ? 's' : ''} dépassée${enRetardCount > 1 ? 's' : ''}`,
                            trend: enRetardCount > 0
                                ? { dir: 'up', text: `+${enRetardCount}`, tone: 'alert' }
                                : { dir: 'flat', text: 'aucun', tone: 'neutral' },
                            spark: genSpark(stats?.en_retard),
                        },
                        {
                            tone: (stats?.offices_alerte ?? 0) > 0 ? 'warn' : undefined,
                            label: 'Offices à rendre',
                            value: String(stats?.offices_alerte ?? 0),
                            foot: 'Retour dans 30 jours',
                            trend: (stats?.offices_alerte ?? 0) > 0
                                ? { dir: 'up', text: `${stats.offices_alerte} urgents`, tone: 'warn' }
                                : { dir: 'flat', text: 'aucun', tone: 'neutral' },
                            spark: genSpark((stats?.offices_alerte ?? 0) * 1000),
                        },
                    ].map((props, i) => (
                        /* Chaque KPI entre avec un décalage (stagger défini sur le parent) */
                        <motion.div
                            key={i}
                            variants={{
                                initial: { opacity: 0, y: 12 },
                                animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0.7, 0.2, 1] } },
                            }}
                        >
                            <KpiCard {...props} />
                        </motion.div>
                    ))}
                </motion.div>
            </Widget>

            {/* ── KPIs Stock ── */}
            {/* Affiché uniquement si le contrôleur fournit la prop stock_kpis */}
            {stock_kpis && (
                <div style={{ marginBottom: 24 }}>
                    {/* Titre de section avec icône Package */}
                    <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={15} /> Stock
                    </h2>
                    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        {/* Total produits */}
                        <div className="kpi card">
                            <div className="kpi-label">Total produits</div>
                            <div className="kpi-value">{stock_kpis.total_produits ?? 0}</div>
                            <div className="kpi-foot">références en catalogue</div>
                        </div>
                        {/* En alerte — rouge si > 0 */}
                        <div className={`kpi card${(stock_kpis.en_alerte ?? 0) > 0 ? ' tone-alert' : ''}`}>
                            <div className="kpi-label">En alerte</div>
                            <div className="kpi-value">{stock_kpis.en_alerte ?? 0}</div>
                            <div className="kpi-foot">stock sous le seuil</div>
                        </div>
                        {/* Ruptures — rouge si > 0 */}
                        <div className={`kpi card${(stock_kpis.ruptures ?? 0) > 0 ? ' tone-alert' : ''}`}>
                            <div className="kpi-label">Ruptures</div>
                            <div className="kpi-value">{stock_kpis.ruptures ?? 0}</div>
                            <div className="kpi-foot">stock à zéro</div>
                        </div>
                        {/* Nouveautés — vert */}
                        <div className={`kpi card${(stock_kpis.nouveautes ?? 0) > 0 ? ' tone-ok' : ''}`}>
                            <div className="kpi-label">Nouveautés</div>
                            <div className="kpi-value">{stock_kpis.nouveautes ?? 0}</div>
                            <div className="kpi-foot">arrivées ce mois</div>
                        </div>
                        {/* Valeur totale du stock */}
                        <div className="kpi card">
                            <div className="kpi-label">Valeur stock</div>
                            <div className="kpi-value">{euro(stock_kpis.valeur_stock)}</div>
                            <div className="kpi-foot">coût d'achat estimé</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Widget questions intelligentes ── */}
            {/* Placé avant les alertes pour être vu en premier */}
            <WidgetQuestions />

            {/* ── Alertes ── */}
            {totalAlertes > 0 && (
                <Widget id="alerts" style={{ marginBottom: 24 }}>
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title">Alertes</h2>
                            <span className="muted" style={{ fontSize: 12.5 }}>
                                {totalAlertes} action{totalAlertes > 1 ? 's' : ''} à traiter
                            </span>
                        </div>
                        <div>
                            {alertes_retard?.slice(0, 4).map(b => (
                                <div key={b.id} className="alert-row overdue">
                                    <div className="dot"/>
                                    <span className="ref">{b.reference}</span>
                                    <span className="desc">
                                        <b style={{ color: 'var(--ink)' }}>{b.distributeur}</b>
                                        {' '}— échéance dépassée de {Math.abs(daysFrom(b.date_echeance))} j
                                    </span>
                                    <span className="meta">{euro(b.montant_ttc)}</span>
                                    <Link href={`/lettres/${b.id}`} className="btn sm">Voir</Link>
                                </div>
                            ))}
                            {alertes_proches?.slice(0, 3).map(b => (
                                <div key={b.id} className="alert-row due">
                                    <div className="dot"/>
                                    <span className="ref">{b.reference}</span>
                                    <span className="desc">
                                        <b style={{ color: 'var(--ink)' }}>{b.distributeur}</b>
                                        {' '}— échéance dans {b.jours_restants} j
                                    </span>
                                    <span className="meta">{euro(b.montant_ttc)}</span>
                                    <Link href={`/lettres/${b.id}`} className="btn sm">Voir</Link>
                                </div>
                            ))}
                            {alertes_offices?.slice(0, 3).map(o => (
                                <div key={o.id} className="alert-row return">
                                    <div className="dot"/>
                                    <span className="ref">{o.reference}</span>
                                    <span className="desc">
                                        <b style={{ color: 'var(--ink)' }}>{o.distributeur}</b>
                                        {' '}— retour limite dans {o.jours_restants} j
                                    </span>
                                    <span className="meta">{dateFr(o.date_retour_limite)}</span>
                                    <Link href={`/offices/${o.id}`} className="btn sm">Voir</Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </Widget>
            )}

            {/* ── Graphique ── */}
            {chartData.length > 0 && (
                <Widget id="chart" style={{ marginBottom: 24 }}>
                    <div className="card">
                        <FinancialChart data={chartData} />
                    </div>
                </Widget>
            )}

            {/* ── Tableaux — grille éditoriale asymétrique (DESIGN_VARIANCE: 8) ── */}
            <div className="grid-editorial">

                {/* Encours par fournisseur */}
                <Widget id="suppliers">
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title">Encours par fournisseur</h2>
                            <Link href="/distributeurs" className="btn ghost sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>Tous <ArrowRight size={12} /></Link>
                        </div>
                        <div className="card-body flush">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Fournisseur</th>
                                        <th className="right">Encours LCR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {distrib_stats?.filter(d => d.total > 0).length === 0 ? (
                                        <tr>
                                            <td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 16px' }}>
                                                Aucun encours
                                            </td>
                                        </tr>
                                    ) : distrib_stats?.filter(d => d.total > 0).slice(0, 7).map((d, i) => (
                                        <tr key={i} onClick={() => router.visit('/distributeurs')}>
                                            <td><b style={{ color: 'var(--ink)' }}>{d.nom}</b></td>
                                            <td className="right num">{euro(d.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Widget>

                {/* Échéances à 7 jours */}
                <Widget id="deadlines">
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title">Échéances · 7 jours</h2>
                            <Link href="/lettres" className="btn ghost sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>Tout voir <ArrowRight size={12} /></Link>
                        </div>
                        <div className="card-body flush">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Réf.</th>
                                        <th>Fournisseur</th>
                                        <th className="right">Montant</th>
                                        <th className="right">Dans</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prochaines?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 16px' }}>
                                                Aucune échéance proche
                                            </td>
                                        </tr>
                                    ) : prochaines?.slice(0, 6).map(l => (
                                        <tr key={l.id} onClick={() => router.visit(`/lettres/${l.id}`)}>
                                            <td><span className="ref">{l.reference}</span></td>
                                            <td>{l.distributeur}</td>
                                            <td className="right num">{euro(l.montant_ttc)}</td>
                                            <td className="right num">
                                                {l.jours_restants < 0
                                                    ? <span style={{ color: 'var(--status-overdue)' }}>−{Math.abs(l.jours_restants)}j</span>
                                                    : <span style={{ color: 'var(--status-pending)' }}>+{l.jours_restants}j</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Widget>

            </div>

            {/* ── Top 5 produits en stock ── */}
            {/* Affiché uniquement si le contrôleur fournit des données */}
            {top5_produits && top5_produits.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Package size={15} /> Top produits en stock
                            </h2>
                        </div>
                        <div className="card-body flush">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Titre</th>
                                        <th className="right">Stock</th>
                                        <th className="right">Valeur</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top5_produits.map((p, i) => (
                                        <tr key={i}>
                                            <td><b style={{ color: 'var(--ink)' }}>{p.titre ?? p.nom ?? '—'}</b></td>
                                            <td className="right num">{p.stock ?? 0}</td>
                                            <td className="right num">{euro(p.valeur)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Produits dormants ── */}
            {/* Produits sans mouvement depuis longtemps — signale un risque de surstock */}
            {produits_dormants && produits_dormants.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <div className="card">
                        <div className="card-head">
                            <h2 className="section-title">Produits dormants</h2>
                            <span className="muted" style={{ fontSize: 12.5 }}>
                                {produits_dormants.length} produit{produits_dormants.length > 1 ? 's' : ''} sans mouvement
                            </span>
                        </div>
                        <div className="card-body flush">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Titre</th>
                                        <th className="right">Stock</th>
                                        <th className="right">Dernier mouvement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produits_dormants.map((p, i) => (
                                        <tr key={i}>
                                            <td><b style={{ color: 'var(--ink)' }}>{p.titre ?? p.nom ?? '—'}</b></td>
                                            <td className="right num">{p.stock ?? 0}</td>
                                            <td className="right" style={{ color: 'var(--muted)' }}>
                                                {p.dernier_mouvement ? dateFr(p.dernier_mouvement) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}
