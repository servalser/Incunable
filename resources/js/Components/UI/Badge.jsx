/**
 * Badge — composant de statut sémantique.
 *
 * Usage sémantique  : <Badge kind="lcr" value="en_attente" />
 * Usage générique   : <Badge variant="success">Texte</Badge>
 * Sans point        : <Badge kind="office" value="paye" dot={false} />
 *
 * Rendu entièrement via CSS vars du système Comptoir — aucune classe Tailwind.
 */

/* ── Palettes par variante ──────────────────────────────────────────────────── */
const PALETTE = {
    default:     { bg: 'var(--accent-soft)',      text: 'var(--accent-ink)',    dot: 'var(--accent)'          },
    success:     { bg: 'var(--status-paid-bg)',    text: 'var(--status-paid)',    dot: 'var(--status-paid)'     },
    warning:     { bg: 'var(--status-pending-bg)', text: 'var(--status-pending)', dot: 'var(--status-pending)'  },
    destructive: { bg: 'var(--status-overdue-bg)', text: 'var(--status-overdue)', dot: 'var(--status-overdue)'  },
    info:        { bg: 'var(--status-info-bg)',    text: 'var(--status-info)',    dot: 'var(--status-info)'     },
    neutral:     { bg: 'var(--surface-2)',         text: 'var(--muted)',          dot: 'var(--muted)'           },
    outline:     { bg: 'transparent',              text: 'var(--ink)',            dot: 'var(--ink-2)'           },
    accent:      { bg: 'var(--accent-soft)',       text: 'var(--accent-ink)',    dot: 'var(--accent)'          },
    purple:      { bg: 'var(--accent-soft)',       text: 'var(--accent-ink)',    dot: 'var(--accent)'          },
};

/* ── Correspondances métier ─────────────────────────────────────────────────── */
const MAPS = {
    lcr: {
        en_attente: { variant: 'info',        label: 'En attente' },
        en_retard:  { variant: 'destructive', label: 'En retard'  },
        paye:       { variant: 'success',     label: 'Payée'      },
    },
    office: {
        en_attente:     { variant: 'info',        label: 'En attente'     },
        retour_partiel: { variant: 'warning',     label: 'Retour partiel' },
        retourne:       { variant: 'neutral',     label: 'Retourné'       },
        paye:           { variant: 'success',     label: 'Payée'          },
        en_retard:      { variant: 'destructive', label: 'En retard'      },
    },
    type: {
        facon:        { variant: 'accent',      label: 'À façon'      },
        grille:       { variant: 'info',        label: 'Sur grille'   },
        exceptionnel: { variant: 'warning',     label: 'Exceptionnel' },
    },
    ticket_statut: {
        ouvert:   { variant: 'info',    label: 'Ouvert'   },
        en_cours: { variant: 'warning', label: 'En cours' },
        ferme:    { variant: 'neutral', label: 'Fermé'    },
    },
    ticket_prio: {
        faible:  { variant: 'neutral',     label: 'Faible'  },
        normale: { variant: 'info',        label: 'Normale' },
        haute:   { variant: 'warning',     label: 'Haute'   },
        urgente: { variant: 'destructive', label: 'Urgente' },
    },
};

/* ── Composant ──────────────────────────────────────────────────────────────── */
export function Badge({ kind, value, variant, dot = true, style: styleProp, children, ...props }) {
    /* Résolution du variant et du label */
    let v     = variant ?? 'neutral';
    let label = children ?? value ?? '—';

    if (kind && value) {
        const cfg = MAPS[kind]?.[value];
        if (cfg) { v = cfg.variant; label = cfg.label; }
    }

    const palette = PALETTE[v] ?? PALETTE.neutral;

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 5,
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                background: palette.bg,
                color: palette.text,
                border: `1px solid ${palette.bg === 'transparent' ? 'var(--hairline-strong)' : 'transparent'}`,
                ...styleProp,
            }}
            {...props}
        >
            {dot && (
                <span
                    aria-hidden="true"
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: palette.dot,
                    }}
                />
            )}
            {label}
        </span>
    );
}

export { MAPS as BADGE_MAPS };
