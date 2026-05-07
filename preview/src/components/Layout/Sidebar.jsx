import { NavLink } from 'react-router-dom';
import { config } from '../../data/mock.js';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Mail, BookOpen, Users, Package, List,
  BarChart2, Target, MessageSquare, Trash2, LifeBuoy, Settings, LogOut,
} from 'lucide-react';

/* ── Section label ─────────────────────────────────────────────── */
function SbSection({ label }) {
  return (
    <div className="px-3 pt-5 pb-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        {label}
      </span>
    </div>
  );
}

/* ── Lien sidebar ───────────────────────────────────────────────── */
function SbLink({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50')} />
          <span className="flex-1">{label}</span>
          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
        </>
      )}
    </NavLink>
  );
}

/* ── Sidebar principale ─────────────────────────────────────────── */
export function Sidebar() {
  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col"
      style={{ background: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsl(var(--sidebar-border))' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 shrink-0">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'hsl(var(--sidebar-primary) / 0.2)' }}
        >
          <BookOpen className="h-4 w-4" style={{ color: 'hsl(var(--sidebar-primary))' }} />
        </div>
        <div>
          <div
            className="text-sm font-bold leading-tight"
            style={{ color: 'hsl(var(--sidebar-accent-foreground))' }}
          >
            {config.nom_librairie}
          </div>
          <div className="text-[10px]" style={{ color: 'hsl(var(--sidebar-foreground) / 0.5)' }}>
            Gestion librairie
          </div>
        </div>
      </div>

      <div className="h-px shrink-0" style={{ background: 'hsl(var(--sidebar-border))' }} />

      {/* Navigation scrollable */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">

        <SbSection label="Tableau de bord" />
        <SbLink to="/"              icon={LayoutDashboard} label="Vue d'ensemble"    end />

        <SbSection label="Financier" />
        <SbLink to="/lettres"       icon={Mail}            label="Lettres de change" />
        <SbLink to="/offices"       icon={BookOpen}        label="Offices"           />
        <SbLink to="/distributeurs" icon={Users}           label="Fournisseurs"      />

        <SbSection label="Catalogue" />
        <SbLink to="/stock"         icon={Package}         label="Stock"             />
        <SbLink to="/dilicom"       icon={List}            label="Dilicom / FEL"     />

        <SbSection label="Analyse" />
        <SbLink to="/rapports"      icon={BarChart2}       label="Rapports"          />
        <SbLink to="/fiches-missions" icon={Target}        label="Fiches missions"   />
        <SbLink to="/assistant"     icon={MessageSquare}   label="Conseiller"        />

        <SbSection label="Outils" />
        <SbLink to="/corbeille"     icon={Trash2}          label="Corbeille"         />
        <SbLink to="/tickets"       icon={LifeBuoy}        label="Support"           />
        <SbLink to="/configuration" icon={Settings}        label="Configuration"     />

      </nav>

      <div className="h-px shrink-0" style={{ background: 'hsl(var(--sidebar-border))' }} />

      {/* Pied de sidebar — utilisateur */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0"
          style={{
            background: 'hsl(var(--sidebar-primary) / 0.2)',
            color: 'hsl(var(--sidebar-primary))',
          }}
        >
          M
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium truncate"
            style={{ color: 'hsl(var(--sidebar-accent-foreground))' }}
          >
            Marie Dupont
          </div>
          <div className="text-xs" style={{ color: 'hsl(var(--sidebar-foreground) / 0.5)' }}>
            Administratrice
          </div>
        </div>
        <button
          title="Se déconnecter"
          className="rounded-md p-1.5 transition-colors"
          style={{ color: 'hsl(var(--sidebar-foreground) / 0.4)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--sidebar-accent))'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

    </aside>
  );
}
