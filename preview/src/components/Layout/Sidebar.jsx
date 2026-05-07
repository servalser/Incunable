import { NavLink } from 'react-router-dom';
import { config } from '../../data/mock.js';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Mail, BookOpen, Users, Package, List,
  BarChart2, Target, MessageSquare, Trash2, LifeBuoy, Settings,
} from 'lucide-react';

/* ── Section label ─────────────────────────────────────────────── */
function SbSection({ label }) {
  return (
    <div className="px-3 pt-5 pb-1.5">
      <span
        className="font-mono uppercase tracking-widest"
        style={{ fontSize: '9.5px', letterSpacing: '0.1em', color: 'hsl(var(--sidebar-foreground) / 0.4)' }}
      >
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
          'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-150',
          'border-l-2',
          isActive
            ? 'border-l-primary bg-sidebar-accent text-sidebar-accent-foreground'
            : 'border-l-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50')} />
          <span className="flex-1">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/* ── Sidebar principale ─────────────────────────────────────────── */
export function Sidebar() {
  return (
    <aside
      className="flex h-full w-[210px] shrink-0 flex-col"
      style={{ background: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsl(var(--sidebar-border))' }}
    >
      {/* Wordmark éditorial */}
      <div className="px-4 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className="font-serif italic leading-tight"
          style={{ fontSize: '22px', color: 'hsl(var(--sidebar-accent-foreground))' }}
        >
          Incunable
        </div>
        <div
          className="font-mono uppercase mt-1"
          style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'hsl(var(--sidebar-foreground) / 0.5)' }}
        >
          {config.nom_librairie}
        </div>
      </div>

      {/* Navigation scrollable */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">

        <SbSection label="Vue générale" />
        <SbLink to="/"              icon={LayoutDashboard} label="Tableau de bord"     end />

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

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* Pied de sidebar — utilisateur */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold shrink-0"
          style={{ background: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-accent-foreground))' }}
        >
          ML
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: 'hsl(var(--sidebar-accent-foreground))' }}>
            Marie Leblanc
          </div>
          <div className="font-mono" style={{ fontSize: '10px', color: 'hsl(var(--sidebar-foreground) / 0.5)' }}>
            gérante
          </div>
        </div>
      </div>

    </aside>
  );
}
