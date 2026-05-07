/**
 * main.jsx — entrée de la démo.
 *
 * Remplace Laravel + Inertia par :
 *  - HashRouter (navigation sans serveur)
 *  - AppProvider (props partagées : auth, appConfig, flash)
 *  - Chaque route reçoit ses données depuis mockData.js
 */

import { createRoot }     from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect }      from 'react';

// CSS du design system original
import '@css/app.css';

// Contexte partagé
import { AppProvider }    from './AppContext';
import { _setNavigate }   from './inertia-shim';

// Données fictives
import {
  distributeurs,
  lettres,
  offices,
  dashboardStats,
  tickets as ticketsData,
  corbeille,
  configuration,
} from './mockData';

// Pages — on importe directement les originaux (sauf Index qui ont window.location.href)
import Dashboard           from '@Pages/Dashboard';
import LettresIndex        from './Pages/Lettres/Index';
import LettreDetail        from '@Pages/Lettres/Detail';
import LettresForm         from '@Pages/Lettres/Form';
import OfficesIndex        from './Pages/Offices/Index';
import OfficeDetail        from '@Pages/Offices/Detail';
import OfficesForm         from '@Pages/Offices/Form';
import DistributeursIndex  from '@Pages/Distributeurs/Index';
import Tickets             from '@Pages/Tickets';
import Corbeille           from '@Pages/Corbeille';
import Configuration       from '@Pages/Configuration';
import Login               from '@Pages/Auth/Login';

// ── Composant qui stocke navigate() dans le shim ──────────────────────────────
// Nécessaire car router.get() du shim doit déclencher la navigation React Router.
function NavigateBridge() {
  const navigate = useNavigate();
  useEffect(() => { _setNavigate(navigate); }, [navigate]);
  return null;
}

// ── Données d'un office par id ────────────────────────────────────────────────
function OfficeDetailRoute() {
  const { id } = useParams();
  const office = offices.data.find(o => o.id === parseInt(id)) ?? offices.data[0];
  return <OfficeDetail office={office} />;
}

// ── Données d'une lettre par id ───────────────────────────────────────────────
function LettreDetailRoute() {
  const { id } = useParams();
  const lettre = lettres.data.find(l => l.id === parseInt(id)) ?? lettres.data[0];
  return <LettreDetail lettre={lettre} />;
}

// ── Formulaire lettre vide ────────────────────────────────────────────────────
const emptyLettre = {
  id: null, reference: '', distributeur_id: '', montant_ht: '', taux_tva: 20,
  montant_ttc: '', date_emission: '', date_echeance: '', notes: '', lignes: [],
};

const emptyOffice = {
  id: null, reference: '', distributeur_id: '', type: 'facon',
  montant_ttc: '', date_reception: '', date_retour_limite: '', notes: '', lignes: [],
};

// ── Application principale ────────────────────────────────────────────────────
function App() {
  return (
    <AppProvider>
      <HashRouter>
        <NavigateBridge />
        <Routes>

          {/* Connexion (page publique) */}
          <Route path="/login" element={<Login />} />

          {/* Redirection racine */}
          <Route path="/" element={<Dashboard {...dashboardStats} />} />

          {/* Lettres de change */}
          <Route path="/lettres" element={
            <LettresIndex lettres={lettres} distributeurs={distributeurs} filters={{}} />
          } />
          <Route path="/lettres/creer" element={
            <LettresForm lettre={null} distributeurs={distributeurs} />
          } />
          <Route path="/lettres/:id" element={<LettreDetailRoute />} />
          <Route path="/lettres/:id/modifier" element={
            <LettresForm lettre={lettres.data[0]} distributeurs={distributeurs} />
          } />

          {/* Offices */}
          <Route path="/offices" element={
            <OfficesIndex offices={offices} distributeurs={distributeurs} filters={{}} />
          } />
          <Route path="/offices/creer" element={
            <OfficesForm office={null} distributeurs={distributeurs} />
          } />
          <Route path="/offices/:id" element={<OfficeDetailRoute />} />
          <Route path="/offices/:id/modifier" element={
            <OfficesForm office={offices.data[0]} distributeurs={distributeurs} />
          } />

          {/* Distributeurs */}
          <Route path="/distributeurs" element={
            <DistributeursIndex distributeurs={distributeurs} />
          } />

          {/* Outils */}
          <Route path="/corbeille"     element={<Corbeille {...corbeille} />} />
          <Route path="/tickets"       element={<Tickets tickets={ticketsData} />} />
          <Route path="/configuration" element={<Configuration config={configuration} />} />

          {/* Fallback → dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

createRoot(document.getElementById('app')).render(<App />);
