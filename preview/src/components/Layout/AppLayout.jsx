import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Toast } from '../ui/Toast.jsx';
import { config } from '../../data/mock.js';

export function AppLayout({ title, children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = (message, type = 'info') => {
    const id = ++idRef.current;
    setToasts(p => [...p, { id, message, type }]);
  };

  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  useEffect(() => { window.__toast = addToast; }, []);

  useEffect(() => {
    /* Pas de dark mode — DA "La Une" est light only */
    document.body.classList.remove('dark');
    if (title) document.title = `${title} — ${config.nom_librairie}`;
  }, [title]);

  return (
    <div className="layout-shell">
      <Sidebar />
      <main className="layout-main">
        <div className="layout-content">{children}</div>
      </main>

      {/* Pile de toasts (coin bas-droite) */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
}
