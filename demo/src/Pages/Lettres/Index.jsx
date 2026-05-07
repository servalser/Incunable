/**
 * Lettres/Index — version démo (window.location.href remplacé par useNavigate).
 */

import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout }     from '@Components/Layout/AppLayout';
import { Badge }         from '@Components/UI/Badge';
import { ConfirmDialog } from '@Components/UI/ConfirmDialog';

const euro   = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
const dateFr = (str) => str ? new Date(str).toLocaleDateString('fr-FR') : '—';

export default function LettresIndex({ lettres, distributeurs, filters = {} }) {
  const navigate = useNavigate();
  const [confirm, setConfirm]   = useState(null);
  const [searchVal, setSearchVal] = useState(filters.q ?? '');
  const debounceRef = useRef(null);

  const handleSearch = (val) => {
    setSearchVal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 500); // no-op en démo
  };

  return (
    <AppLayout title="Lettres de change">
      <Head title="Lettres de change" />

      <div className="page-header">
        <h1 className="page-title">Lettres de change</h1>
        <Link href="/lettres/creer" className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle LCR
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
            placeholder="Rechercher (référence, distributeur…)"
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="filters-sep" />
        <select className="filters-select">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="en_retard">En retard</option>
          <option value="paye">Payé</option>
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
                <th>Montant TTC</th>
                <th>Émission</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lettres.data.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state">Aucune lettre trouvée.</div></td></tr>
              )}
              {lettres.data.map(l => (
                <tr key={l.id} className="row-link" onClick={() => navigate(`/lettres/${l.id}`)}>
                  <td className="mono">{l.reference}</td>
                  <td>{l.distributeur?.nom}</td>
                  <td className="mono">{euro(l.montant_ttc)}</td>
                  <td>{dateFr(l.date_emission)}</td>
                  <td>{dateFr(l.date_echeance)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Badge kind="lcr" value={l.statut} />
                  </td>
                  <td onClick={(e) => e.stopPropagation()} className="td-actions">
                    <Link href={`/lettres/${l.id}/modifier`} className="btn-icon" title="Modifier">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <button className="btn-icon btn-icon-danger" title="Supprimer" onClick={() => setConfirm(l)}>
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
        message={`Déplacer la lettre ${confirm?.reference} en corbeille ?`}
        confirmLabel="Supprimer"
        danger
        onConfirm={() => { router.delete(); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </AppLayout>
  );
}
