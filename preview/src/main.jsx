import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

/* HashRouter (/#/lettres, /#/offices...) — compatible GitHub Pages
   qui ne supporte pas le routing côté serveur */
ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
);
