import { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/Layout/AppLayout.jsx';
import {
  stats, chart_data, distrib_stats,
  alertes_retard, alertes_proches, alertes_offices, lettres, offices,
} from '../data/mock.js';
import { ArrowRight, Plus } from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────── */
const euro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n ?? 0);

const euroFull = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateFr = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR') : '—';

/* ── Section rule ─────────────────────────────────────────────── */
function SectionRule({ label }) {
  return (
    <div className="section-rule">
      <span className="section-label">{label}</span>
    </div>
  );
}

/* ── Badge statut ──────────────────────────────────────────────── */
function StatusBadge({ variant = 'neutral', children }) {
  const colors = {
    overdue:  { bg: 'var(--overdue-bg)', text: 'hsl(var(--destructive))', dot: 'hsl(var(--destructive))' },
    pending:  { bg: 'var(--pending-bg)', text: 'hsl(var(--warning))',     dot: 'hsl(var(--warning))' },
    paid:     { bg: 'var(--paid-bg)',    text: 'hsl(var(--success))',     dot: 'hsl(var(--success))' },
    info:     { bg: 'var(--info-bg)',    text: 'hsl(var(--info))',        dot: 'hsl(var(--info))' },
    neutral:  { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', dot: 'hsl(var(--muted-foreground))' },
  };
  const c = colors[variant] || colors.neutral;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10.5px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: c.dot }} />
      {children}
    </span>
  );
}

/* ── Dashboard ────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const prochaines = lettres
    .filter((l) => l.jours_restants >= 0 && l.jours_restants <= 7)
    .sort((a, b) => a.jours_restants - b.jours_restants);

  const officesActifs = offices.filter(o => o.statut !== 'paye' && o.statut !== 'retourne');

  /* ── Encours total ── */
  const encours = lettres
    .filter(l => l.statut !== 'paye')
    .reduce((s, l) => s + l.montant_ttc, 0);

  /* ── Chart.js ── */
  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: chart_data.map((d) => d.label),
        datasets: [
          {
            label: 'LCR (€)',
            data: chart_data.map((d) => d.lettres),
            backgroundColor: 'hsla(4, 58%, 31%, 0.75)',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Offices (€)',
            data: chart_data.map((d) => d.offices),
            backgroundColor: 'hsla(140, 30%, 33%, 0.55)',
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#6b6157', font: { size: 11, family: 'Geist' }, boxRadius: 3 } },
          tooltip: { callbacks: { label: (ctx) => ` ${euroFull(ctx.raw)}` } },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6b6157', font: { size: 10, family: 'JetBrains Mono' } },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(26,22,18,0.08)' },
            ticks: {
              color: '#6b6157',
              font: { size: 10, family: 'JetBrains Mono' },
              callback: (v) => `${(v / 1000).toFixed(0)}k`,
            },
            border: { display: false },
          },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, []);

  return (
    <AppLayout title="Tableau de bord">

      {/* ── Topbar inline ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="font-mono text-[11px] text-muted-foreground capitalize tracking-wide">
          {todayLabel}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/assistant"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded text-xs text-foreground hover:bg-muted transition-colors"
          >
            Conseiller IA
          </Link>
          <Link
            to="/lettres/creer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" />
            Nouvelle LCR
          </Link>
        </div>
      </div>

      {/* ── HERO — encours ── */}
      <div className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
          Encours global — toutes LCR en cours
        </div>
        <div className="font-serif italic text-[72px] font-medium leading-none text-foreground tracking-tight">
          {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(encours)}
          <span className="not-italic text-muted-foreground text-[32px] font-light ml-1.5">€</span>
        </div>
        <div className="text-[12.5px] text-muted-foreground mt-1.5">
          dont <strong className="text-destructive font-semibold">{euro(stats.en_retard)} en retard</strong>
          {' '}· {lettres.filter(l => l.statut !== 'paye').length} lettres actives
          · {distrib_stats.length} distributeurs
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="grid grid-cols-4 border border-border rounded-md overflow-hidden mb-6">
        {[
          { label: 'En retard', value: euro(stats.en_retard), sub: `${alertes_retard.length} lettre(s) · retard moyen`, variant: 'overdue' },
          { label: 'Ce mois',   value: euro(stats.du_ce_mois), sub: `${prochaines.length} échéance(s) à venir`, variant: 'pending' },
          { label: 'Offices actifs', value: String(officesActifs.length), sub: `${offices.filter(o => o.statut === 'en_attente').length} en attente`, variant: 'info' },
          { label: 'Horizon 30j',   value: euro(stats.du_30j), sub: 'Toutes échéances confondues', variant: 'paid' },
        ].map((kpi, i) => (
          <div
            key={kpi.label}
            className={i < 3 ? 'border-r border-border' : ''}
            style={{
              padding: '14px 18px',
              background: kpi.variant === 'overdue' ? 'var(--overdue-bg)' :
                           kpi.variant === 'pending' ? 'var(--pending-bg)' :
                           kpi.variant === 'info'    ? 'var(--info-bg)' :
                           'var(--paid-bg)',
            }}
          >
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground mb-1.5">
              {kpi.label}
            </div>
            <div className="font-serif text-[26px] font-medium leading-none"
              style={kpi.variant === 'overdue' ? { color: 'hsl(var(--destructive))' } : {}}
            >
              {kpi.value}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── ALERTES ── */}
      {alertes_retard.length > 0 && (
        <>
          <SectionRule label="Alertes urgentes" />
          <div className="border border-border rounded-md overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                LCR en souffrance
              </span>
              <span className="font-mono text-[10px] font-semibold text-destructive">
                {alertes_retard.length} lettre(s) en retard
              </span>
            </div>
            {alertes_retard.map((l) => (
              <Link
                key={l.id}
                to={`/lettres/${l.id}`}
                className="flex items-center border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                style={{ background: 'var(--overdue-bg)' }}
              >
                <div className="flex items-center gap-3 flex-1 px-4 py-2 min-w-0">
                  <span className="font-mono text-[10.5px] text-destructive shrink-0">
                    {l.reference}
                  </span>
                  <span className="text-[12.5px] font-medium truncate">{l.distributeur}</span>
                </div>
                <span className="font-mono text-xs font-medium text-destructive px-4 py-2 shrink-0">
                  {euroFull(l.montant_ttc)}
                </span>
                <span className="px-4 py-2 shrink-0">
                  <StatusBadge variant="overdue">+{Math.abs(l.jours_restants)}j</StatusBadge>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── BODY 2 COLONNES ── */}
      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">

        {/* ── COLONNE GAUCHE ── */}
        <div>
          {/* Table LCR */}
          <SectionRule label="Toutes les lettres actives" />
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Référence', 'Distributeur', 'Émission', 'Échéance', 'Statut', 'Montant'].map((h, i) => (
                    <th
                      key={h}
                      className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground font-normal text-left pb-2 pr-3"
                      style={i === 5 ? { textAlign: 'right', paddingRight: 0 } : {}}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lettres.map((l) => {
                  const statut = l.statut === 'en_retard' ? 'overdue' : l.statut === 'paye' ? 'paid' : 'pending';
                  const label  = l.statut === 'en_retard' ? 'En retard' : l.statut === 'paye' ? 'Payée' : 'En attente';
                  return (
                    <tr
                      key={l.id}
                      className="border-b border-border hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/lettres/${l.id}`)}
                    >
                      <td className="py-2 pr-3 font-mono text-[10.5px] text-muted-foreground">{l.reference}</td>
                      <td className="py-2 pr-3 font-medium">{l.distributeur.nom}</td>
                      <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{dateFr(l.date_emission)}</td>
                      <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{dateFr(l.date_echeance)}</td>
                      <td className="py-2 pr-3"><StatusBadge variant={statut}>{label}</StatusBadge></td>
                      <td className={`py-2 font-mono text-[12.5px] font-medium text-right ${statut === 'overdue' ? 'text-destructive' : ''}`}>
                        {euroFull(l.montant_ttc)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Graphe */}
          <SectionRule label="Évolution sur 12 mois" />
          <div className="h-56 mb-6">
            <canvas ref={canvasRef} />
          </div>

          {/* Barres distributeurs */}
          <SectionRule label="Répartition par distributeur" />
          <div className="flex flex-col gap-3 mb-6">
            {distrib_stats.map((d) => {
              const max = Math.max(...distrib_stats.map(x => x.total));
              const pct = Math.round((d.total / max) * 100);
              return (
                <div key={d.nom}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-[12.5px] font-medium">{d.nom}</span>
                    <span className="font-mono text-[11.5px] text-muted-foreground">{euroFull(d.total)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: d.nom === distrib_stats[0].nom ? 'hsl(var(--destructive))' : 'hsl(var(--foreground) / 0.3)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div className="flex flex-col gap-5">

          {/* Panneau IA */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
            >
              <span className="font-serif italic text-sm">Conseil du jour</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-white/10 px-1.5 py-0.5 rounded">
                IA · Groq
              </span>
            </div>
            <div className="p-4">
              <p className="font-serif italic text-sm leading-relaxed text-foreground/80 mb-3">
                « Hachette Livre affiche 8 jours de retard sur LCR-2025-0042.
                Un rappel amiable adressé ce matin évite les pénalités contractuelles
                applicables dès le 14ᵉ jour. »
              </p>
              <div className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground mb-2">
                Questions suggérées
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  'Quelle est la tendance de mes retards sur 6 mois ?',
                  'Quel distributeur représente le plus de risque ?',
                  'Mon budget avril est-il en bonne voie ?',
                ].map((q) => (
                  <Link
                    key={q}
                    to="/assistant"
                    className="flex items-start gap-2 p-2 border border-border rounded hover:bg-muted/50 transition-colors"
                  >
                    <span className="w-[5px] h-[5px] rounded-full bg-destructive shrink-0 mt-1" />
                    <span className="text-xs leading-snug">{q}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Offices en cours */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                Offices en cours
              </span>
              <Link to="/offices" className="text-[11px] text-destructive hover:underline">Voir tout →</Link>
            </div>
            {officesActifs.slice(0, 4).map((o) => {
              const v = o.statut === 'en_retard' ? 'overdue' : o.statut === 'retour_partiel' ? 'pending' : 'info';
              const label = o.statut === 'en_retard' ? 'En retard' : o.statut === 'retour_partiel' ? 'Partiel' : 'En attente';
              return (
                <Link
                  key={o.id}
                  to={`/offices/${o.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{o.reference}</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {o.distributeur.nom} · retour {dateFr(o.date_retour_limite)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="mb-1"><StatusBadge variant={v}>{label}</StatusBadge></div>
                    <div className="font-mono text-[11.5px] font-medium" style={v === 'overdue' ? { color: 'hsl(var(--destructive))' } : {}}>
                      {euroFull(o.montant_net)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Prochaines échéances */}
          {prochaines.length > 0 && (
            <div className="border border-border rounded-md overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  Échéances imminentes
                </span>
                <Link to="/lettres" className="text-[11px] text-destructive hover:underline">Voir tout →</Link>
              </div>
              {prochaines.slice(0, 4).map((l) => {
                const isToday = l.jours_restants === 0;
                const label   = isToday ? "Aujourd'hui" : `${l.jours_restants}j`;
                return (
                  <Link
                    key={l.id}
                    to={`/lettres/${l.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
                    style={l.jours_restants <= 2 ? { background: 'var(--pending-bg)' } : {}}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10.5px] text-muted-foreground">{l.reference}</div>
                      <div className="text-xs font-medium mt-0.5">{l.distributeur.nom}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[11.5px] font-medium">{euroFull(l.montant_ttc)}</div>
                      <div className="mt-0.5">
                        <StatusBadge variant={l.jours_restants <= 2 ? 'overdue' : 'pending'}>{label}</StatusBadge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </div>

    </AppLayout>
  );
}
