import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary/10 text-primary',
        success:     'border-success/20 bg-success/10 text-success',
        warning:     'border-warning/20 bg-warning/10 text-warning',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
        info:        'border-primary/20 bg-primary/10 text-primary',
        neutral:     'border-border bg-muted text-muted-foreground',
        outline:     'text-foreground border-border',
        accent:      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
        purple:      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

/* Dot optionnel */
function Dot({ variant }) {
  const colors = {
    default: 'bg-primary', success: 'bg-success', warning: 'bg-warning',
    destructive: 'bg-destructive', info: 'bg-primary', neutral: 'bg-muted-foreground',
    outline: 'bg-foreground', accent: 'bg-purple-600', purple: 'bg-purple-600',
  };
  return <span className={cn('h-1.5 w-1.5 rounded-full', colors[variant] ?? 'bg-muted-foreground')} />;
}

/* ── Composant sémantique métier (compatibilité avec l'ancien Badge) ── */
const MAPS = {
  lcr: {
    en_attente: { variant: 'info',        label: 'En attente' },
    en_retard:  { variant: 'destructive', label: 'En retard'  },
    paye:       { variant: 'success',     label: 'Payée'      },
  },
  office: {
    en_attente:     { variant: 'info',        label: 'En attente'    },
    retour_partiel: { variant: 'warning',     label: 'Retour partiel'},
    retourne:       { variant: 'neutral',     label: 'Retourné'      },
    paye:           { variant: 'success',     label: 'Payée'         },
    en_retard:      { variant: 'destructive', label: 'En retard'     },
  },
  type: {
    facon:        { variant: 'accent',   label: 'À façon'      },
    grille:       { variant: 'purple',   label: 'Sur grille'   },
    exceptionnel: { variant: 'warning',  label: 'Exceptionnel' },
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

/* Badge sémantique : <Badge kind="lcr" value="en_attente" /> */
export function Badge({ kind, value, variant, dot = true, className, children, ...props }) {
  let v = variant ?? 'neutral';
  let label = children ?? value ?? '—';

  if (kind && value) {
    const cfg = MAPS[kind]?.[value];
    if (cfg) { v = cfg.variant; label = cfg.label; }
  }

  return (
    <span className={cn(badgeVariants({ variant: v }), className)} {...props}>
      {dot && <Dot variant={v} />}
      {label}
    </span>
  );
}

export { badgeVariants };
