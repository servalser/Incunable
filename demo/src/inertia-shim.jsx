/**
 * inertia-shim.jsx — remplace @inertiajs/react pour la démo statique.
 *
 * Ce fichier est aliasé dans vite.config.js : quand un composant fait
 * import { Link, router, usePage } from '@inertiajs/react'
 * il reçoit en réalité ce shim, qui utilise React Router + mock data.
 */

import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppContext } from './AppContext';

// ── usePage ───────────────────────────────────────────────────────────────────
// Retourne les props partagées (auth, appConfig, flash) depuis le contexte démo.
export function usePage() {
  const ctx = useAppContext();
  return { props: ctx?.props ?? { auth: {}, appConfig: {}, flash: {} } };
}

// ── Head ──────────────────────────────────────────────────────────────────────
// Modifie le titre de l'onglet (Inertia le fait côté serveur, ici on le fait côté client).
export function Head({ title }) {
  useEffect(() => {
    if (title) document.title = `${title} — Incunable Démo`;
  }, [title]);
  return null;
}

// ── Link ──────────────────────────────────────────────────────────────────────
// Traduit href → to (React Router), gère method="post" et as="button".
export function Link({ href, children, method, as, className, title, onClick, style }) {
  const navigate = useNavigate();

  // Les boutons de déconnexion ou d'action POST → bouton simple (rien ne se passe)
  if (method === 'post' || as === 'button') {
    return (
      <button
        type="button"
        className={className}
        title={title}
        style={style}
        onClick={onClick ?? (() => {})}
      >
        {children}
      </button>
    );
  }

  return (
    <RouterLink to={href ?? '#'} className={className} title={title} style={style} onClick={onClick}>
      {children}
    </RouterLink>
  );
}

// ── router ────────────────────────────────────────────────────────────────────
// Stub de navigation. Les mutations (post/put/delete) affichent une alerte démo.
// .get() navigue réellement via le hash router.

// navigate est stocké globalement car router est un objet, pas un hook
let _navigate = null;
export function _setNavigate(fn) { _navigate = fn; }

const demoAlert = () => {
  // Feedback visuel discret dans la démo
  const el = document.createElement('div');
  el.textContent = '✓ Action simulée (mode démo)';
  el.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:#2d6a4f; color:#fff; padding:12px 20px;
    border-radius:8px; font-family:'DM Sans',sans-serif; font-size:14px;
    box-shadow:0 4px 16px rgba(0,0,0,.18); animation:fadeIn .2s;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
};

export const router = {
  get:    (url)  => { if (_navigate) _navigate(url); },
  post:   ()     => demoAlert(),
  put:    ()     => demoAlert(),
  delete: ()     => demoAlert(),
  patch:  ()     => demoAlert(),
};

// ── useForm ───────────────────────────────────────────────────────────────────
// Remplace le hook Inertia useForm par un useState simple.
// Les soumissions de formulaires ne font rien (démo).
export function useForm(initialData) {
  const [data, setDataState] = useState(initialData ?? {});
  const [errors] = useState({});
  const [processing] = useState(false);

  // Setter compatible avec la signature Inertia : setData('key', value)
  const setData = (key, value) => {
    if (typeof key === 'object') {
      setDataState(key); // setData({ ... }) — remplacement complet
    } else {
      setDataState(prev => ({ ...prev, [key]: value }));
    }
  };

  return {
    data,
    setData,
    errors,
    processing,
    post:   demoAlert,
    put:    demoAlert,
    delete: demoAlert,
    patch:  demoAlert,
    reset:  () => setDataState(initialData ?? {}),
  };
}
