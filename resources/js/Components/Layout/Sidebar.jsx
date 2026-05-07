import { Link, router, usePage } from '@inertiajs/react';
import { X }         from 'lucide-react';
import { BookLogo }  from '../BookLogo';

/* ── Icônes de navigation (SVG paths inline) ───────────────────────────────── */
const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
    bill:      '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>',
    office:    '<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v8l9 4 9-4V7"/><path d="M12 11v8"/>',
    supplier:  '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2"/><path d="M14 20c0-2 2-3.5 4-3.5s3 1 3 3"/>',
    stock:     '<path d="M4 5h6v15H4zM10 5h4v15h-4z"/><path d="M14 5l4 1-2 14-4-1"/>',
    budget:    '<path d="M2 7h20M2 12h20M2 17h12"/><circle cx="18" cy="17" r="3"/><path d="m17 18 1 1 2-2"/>',
    search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    reports:   '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>',
    tasks:     '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 10l2 2 4-4"/><path d="M9 16h6"/>',
    ai:        '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/><circle cx="12" cy="12" r="4"/>',
    trash:     '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/><path d="M10 11v6M14 11v6"/>',
    ticket:    '<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9z"/><path d="M13 7v10"/>',
    config:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .67.4 1.27 1 1.51"/>',
    logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
};

function NavIcon({ name, size = 16 }) {
    return (
        <svg
            className="icon"
            width={size} height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
        />
    );
}

/* ── Sections ─────────────────────────────────────────────────────────────── */
const SECTIONS = [
    {
        label: 'Général',
        items: [{ href: '/', icon: 'dashboard', label: 'Tableau de bord', exact: true }],
    },
    {
        label: 'Financier',
        items: [
            { href: '/lettres',       icon: 'bill',     label: 'Lettres de change' },
            { href: '/offices',       icon: 'office',   label: 'Offices' },
            { href: '/distributeurs', icon: 'supplier', label: 'Fournisseurs' },
            { href: '/budget',        icon: 'budget',   label: 'Budget' },
        ],
    },
    {
        label: 'Catalogue',
        items: [
            { href: '/stock',   icon: 'stock',  label: 'Stock' },
            { href: '/dilicom', icon: 'search', label: 'Dilicom / FEL' },
        ],
    },
    {
        label: 'Analyse',
        items: [
            { href: '/rapports',        icon: 'reports', label: 'Rapports' },
            { href: '/fiches-missions', icon: 'tasks',   label: 'Fiches missions' },
            { href: '/assistant',       icon: 'ai',      label: 'Conseiller IA' },
        ],
    },
    {
        label: 'Outils',
        items: [
            { href: '/corbeille',     icon: 'trash',  label: 'Corbeille' },
            { href: '/tickets',       icon: 'ticket', label: 'Support' },
            { href: '/configuration', icon: 'config', label: 'Paramètres' },
        ],
    },
];

const ROLE_LABELS = { admin: 'Administrateur', comptable: 'Comptable', lecteur: 'Lecteur' };

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
/* open / onClose : état de la sidebar sur mobile (géré par AppLayout) */
export function Sidebar({ open = false, onClose }) {
    const page  = usePage();
    const url   = page.url;
    const { auth, appConfig } = page.props;
    const user = auth?.user;

    const libName  = appConfig?.nom_librairie ?? 'Incunable';
    const initials = user?.nom
        ? user.nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const isActive = (href, exact = false) =>
        exact
            ? url === href
            : url === href || url.startsWith(href + '/') || url.startsWith(href + '?');

    return (
        /* La classe "open" est appliquée sur mobile pour déclencher la translation CSS */
        <aside className={`sidebar${open ? ' open' : ''}`}>

            {/* ── Branding + bouton fermeture mobile ────────────────── */}
            <div className="brand" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <BookLogo state="open" size={30} color="var(--accent)" />
                    <div>
                        <div className="name">{libName}</div>
                        <div className="sub">Librairie</div>
                    </div>
                </div>
                {/* Bouton X — visible seulement sur mobile via CSS */}
                <button
                    id="sidebar-close"
                    onClick={onClose}
                    aria-label="Fermer le menu"
                    style={{ color: 'var(--muted)', borderRadius: 5, padding: 4 }}
                >
                    <X size={16} />
                </button>
            </div>

            {/* ── Navigation ────────────────────────────────────────── */}
            {SECTIONS.map(section => (
                <div className="nav-section" key={section.label}>
                    <div className="nav-section-label">{section.label}</div>
                    {section.items.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item${isActive(item.href, item.exact) ? ' active' : ''}`}
                        >
                            <NavIcon name={item.icon} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            ))}

            {/* ── Spacer ────────────────────────────────────────────── */}
            <div style={{ flex: 1 }} />

            {/* ── Footer utilisateur ────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 8px',
                borderTop: '1px solid var(--hairline)',
                marginTop: 8,
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--accent)', color: 'var(--on-accent)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 10.5, fontWeight: 600, flexShrink: 0,
                }}>
                    {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 12.5, fontWeight: 500, color: 'var(--ink)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {user?.nom ?? 'Utilisateur'}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                        {ROLE_LABELS[user?.role] ?? 'Lecteur'}
                    </div>
                </div>
                <button
                    onClick={() => router.post('/logout')}
                    title="Se déconnecter"
                    style={{
                        color: 'var(--muted)', padding: 4,
                        borderRadius: 5, flexShrink: 0,
                        transition: 'color .12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                >
                    <NavIcon name="logout" size={15} />
                </button>
            </div>

        </aside>
    );
}
