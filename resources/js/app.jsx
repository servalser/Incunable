/**
 * app.jsx — Point d'entrée Inertia + React
 *
 * Inertia fonctionne comme un "router SPA magique" :
 * - Laravel envoie le nom du composant React à rendre (ex: "Dashboard")
 * - Inertia importe et rend automatiquement le bon composant depuis /Pages/
 * - La navigation entre pages se fait sans rechargement complet (comme React Router)
 */

import { createInertiaApp } from '@inertiajs/react';
import { createRoot }        from 'react-dom/client';

// Import de toutes les pages via Vite's import.meta.glob
// Cela crée automatiquement un mapping { 'Pages/Dashboard': () => import('./Pages/Dashboard') }
const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
    // Titre de l'onglet : "Ma Page — Incunable"
    title: (title) => `${title} — Incunable`,

    // Résout le nom de composant envoyé par Laravel vers le fichier JSX correspondant
    resolve: (name) => {
        const importFn = pages[`./Pages/${name}.jsx`];
        if (!importFn) throw new Error(`Page introuvable : ${name}`);
        return importFn();
    },

    // Monte l'application React dans le <div id="app"> du template Blade
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
