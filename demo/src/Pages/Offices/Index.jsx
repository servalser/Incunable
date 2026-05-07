/**
 * Offices/Index — version démo (window.location.href remplacé par useNavigate).
 */

import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState }   from 'react';
import { useNavigate }         from 'react-router-dom';
import { AppLayout }     from '@Components/Layout/AppLayout';
import { Badge }         from '@Components/UI/Badge';
import { ConfirmDialog } from '@Components/UI/ConfirmDialog';

const euro   = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

export default function OfficesIndex({ offices, distributeurs, filters = {} }) {
  const navigate = useNavigate();
  const [confirm, setConfirm]     = useState(null);
  const [searchVal, setSearchVal] = useState(filters.q ?? '');
  const debounceRef = useRef(null);

  return (
    <AppLayout title="Offices">
      <Head title="Offices" />

      <div className="page-header">
        <h1 className="page-title">Offices</h1>
        <Link href="/offices/creer" className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Nouvel office
        </Link>
      </div>

      {/* Filtres */}
      <div className="filters">
        <div className="filters-search-wrap">
          <svg className="filters-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="filters-search"
            placeholder="Rechercher…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>
        <div className="filters-sep" />
        <select className="filters-select">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="retour_partiel">Retour partiel</option>
          <option value="retourne">Retourné</option>
          <option value="paye">Payé</option>
          <option value="en_retard">En retard</option>
        </select>
        <select className="filters-select">
          <option value="">Tous les types</option>
          <option value="facon">À façon</option>
          <option value="grille">Sur grille</option>
          <option value="exceptionnel">Exceptionnel</option>
        </select>
        <select className="filters-select">
          <option value="">Tous les distributeurs</option>
          {distributeurs.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Distributeur</th>
                <th>Type</th>
                <th>Montant TTC</th>
                <th>Réception</th>
                <th>Retour limite</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {offices.data.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state">Aucun office trouvé.</div></td></tr>
              )}
              {offices.data.map(o => (
                <tr key={o.id} className="row-link" onClick={() => navigate(`/offices/${o.id}`)}>
                  <td className="mono">{o.reference}</td>
                  <td>{o.distributeur?.nom}</td>
                  <td onClick={(e) => e.stopPropagation()}><Badge kind="type" value={o.type} /></td>
                  <td className="mono">{euro(o.montant_ttc)}</td>
                  <td>{dateFr(o.date_reception)}</td>
                  <td>{dateFr(o.date_retour_limite)}</td>
                  <td onClick={(e) => e.stopPropagation()}><Badge kind="office" value={o.statut} /></td>
                  <td onClick={(e) => e.stopPropagation()} className="td-actions">
                    <Link href={`/offices/${o.id}/modifier`} className="btn-icon" title="Modifier">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button className="btn-icon btn-icon-danger" title="Supprimer" onClick={() => setConfirm(o)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                        <polyline strokeLinecap="round" strokeLinejoin="round" points="3 6 5 6 21 6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        message={`Déplacer l'office ${confirm?.reference} en corbeille ?`}
        confirmLabel="Supprimer"
        danger
        onConfirm={() => { router.delete(); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </AppLayout>
  );
}
