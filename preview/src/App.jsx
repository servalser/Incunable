import { Routes, Route, Navigate } from 'react-router-dom';

/* ── Pages existantes ── */
import Dashboard       from './pages/Dashboard.jsx';
import LettresIndex    from './pages/Lettres/Index.jsx';
import LettresDetail   from './pages/Lettres/Detail.jsx';
import LettresForm     from './pages/Lettres/Form.jsx';
import OfficesIndex    from './pages/Offices/Index.jsx';
import OfficesDetail   from './pages/Offices/Detail.jsx';
import OfficesForm     from './pages/Offices/Form.jsx';
import Distributeurs   from './pages/Distributeurs/Index.jsx';
import Corbeille       from './pages/Corbeille.jsx';
import Tickets         from './pages/Tickets.jsx';
import Configuration   from './pages/Configuration.jsx';

/* ── Nouvelles pages ── */
import StockIndex      from './pages/Stock/Index.jsx';
import StockDetail     from './pages/Stock/Detail.jsx';
import StockForm       from './pages/Stock/Form.jsx';
import DilicomIndex    from './pages/Dilicom/Index.jsx';
import RapportsIndex   from './pages/Rapports/Index.jsx';
import RapportsDetail  from './pages/Rapports/Detail.jsx';
import RapportsForm    from './pages/Rapports/Form.jsx';
import FichesMissionsIndex  from './pages/FichesMissions/Index.jsx';
import FichesMissionsDetail from './pages/FichesMissions/Detail.jsx';
import Assistant       from './pages/Assistant.jsx';

export default function App() {
  return (
    <Routes>
      {/* ── Dashboard ── */}
      <Route path="/"                              element={<Dashboard />} />

      {/* ── Lettres de change ── */}
      <Route path="/lettres"                       element={<LettresIndex />} />
      <Route path="/lettres/creer"                 element={<LettresForm />} />
      <Route path="/lettres/:id"                   element={<LettresDetail />} />
      <Route path="/lettres/:id/modifier"          element={<LettresForm />} />

      {/* ── Offices ── */}
      <Route path="/offices"                       element={<OfficesIndex />} />
      <Route path="/offices/creer"                 element={<OfficesForm />} />
      <Route path="/offices/:id"                   element={<OfficesDetail />} />
      <Route path="/offices/:id/modifier"          element={<OfficesForm />} />

      {/* ── Fournisseurs ── */}
      <Route path="/distributeurs"                 element={<Distributeurs />} />

      {/* ── Stock ── */}
      <Route path="/stock"                         element={<StockIndex />} />
      <Route path="/stock/creer"                   element={<StockForm />} />
      <Route path="/stock/:id"                     element={<StockDetail />} />
      <Route path="/stock/:id/modifier"            element={<StockForm />} />

      {/* ── Intégration Dilicom ── */}
      <Route path="/dilicom"                       element={<DilicomIndex />} />

      {/* ── Rapports ── */}
      <Route path="/rapports"                      element={<RapportsIndex />} />
      <Route path="/rapports/nouveau"              element={<RapportsForm />} />
      <Route path="/rapports/:id"                  element={<RapportsDetail />} />

      {/* ── Fiches Missions ── */}
      <Route path="/fiches-missions"               element={<FichesMissionsIndex />} />
      <Route path="/fiches-missions/:id"           element={<FichesMissionsDetail />} />

      {/* ── Assistant IA ── */}
      <Route path="/assistant"                     element={<Assistant />} />

      {/* ── Outils ── */}
      <Route path="/corbeille"                     element={<Corbeille />} />
      <Route path="/tickets"                       element={<Tickets />} />
      <Route path="/configuration"                 element={<Configuration />} />

      {/* Fallback */}
      <Route path="*"                              element={<Navigate to="/" />} />
    </Routes>
  );
}
