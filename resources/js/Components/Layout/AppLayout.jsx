import { usePage }                        from '@inertiajs/react';
import { useEffect, useRef, useState }    from 'react';
import { motion, AnimatePresence }        from 'framer-motion';
import { Menu }                           from 'lucide-react';
import { Sidebar }                        from './Sidebar';
import { Toast }                          from '../UI/Toast.jsx';

export function AppLayout({ title, children }) {
    const { flash, appConfig, auth } = usePage().props;
    const page = usePage();

    const [toasts, setToasts]       = useState([]);
    const [sidebarOpen, setSidebar] = useState(false);
    const toastIdRef                = useRef(0);

    const addToast    = (message, type) => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    /* Ferme la sidebar mobile à chaque navigation Inertia */
    useEffect(() => { setSidebar(false); }, [page.url]);

    /* Expose window.__toast pour les composants fils */
    useEffect(() => {
        window.__toast = (message, type = 'info') => addToast(message, type);
        return () => { delete window.__toast; };
    }, []);

    /* Flash Laravel → toast */
    useEffect(() => {
        if (flash?.success) addToast(flash.success, 'success');
        if (flash?.error)   addToast(flash.error,   'error');
        if (flash?.info)    addToast(flash.info,     'info');
    }, [flash]);

    /* Thème dynamique — accent-h suit theme_hue */
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--accent-h', String(appConfig?.theme_hue ?? 8));
        const isDark = appConfig?.theme_dark ?? false;
        document.body.classList.toggle('dark', isDark);
        if (isDark) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
    }, [appConfig]);

    /* Titre de l'onglet */
    useEffect(() => {
        if (title) document.title = `${title} — ${appConfig?.nom_librairie ?? 'Incunable'}`;
    }, [title]);

    const libName  = appConfig?.nom_librairie ?? 'Incunable';
    const user     = auth?.user;
    const initials = user?.nom
        ? user.nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <div className="layout-shell">

            {/* Overlay mobile — cliquable pour fermer la sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        className="sidebar-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={() => setSidebar(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar — reçoit l'état d'ouverture mobile */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebar(false)} />

            <div className="layout-main">

                {/* ── Topbar ─────────────────────────────────────────── */}
                <div className="topbar">
                    {/* Bouton hamburger — visible seulement sur mobile */}
                    <button
                        className="topbar-btn"
                        style={{ display: 'none' }}
                        id="sidebar-toggle"
                        onClick={() => setSidebar(o => !o)}
                        aria-label="Ouvrir le menu"
                    >
                        <Menu size={17} />
                    </button>

                    <div className="crumbs">
                        <a href="/">{libName}</a>
                        {title && (
                            <>
                                <span className="sep">/</span>
                                <span className="current">{title}</span>
                            </>
                        )}
                    </div>
                    <div className="spacer" />
                    <div className="user-chip">
                        <div className="avatar">{initials}</div>
                        <span style={{ fontSize: 12.5 }}>
                            {user?.nom?.split(' ')[0] ?? 'Profil'}
                        </span>
                    </div>
                </div>

                {/* ── Contenu — animé à chaque changement de page ────── */}
                <motion.div
                    key={page.url}
                    className="layout-content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
                >
                    {children}
                </motion.div>

            </div>

            {/* ── Pile de toasts ─────────────────────────────────────── */}
            <div
                style={{
                    position: 'fixed', bottom: 16, right: 16,
                    zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8,
                }}
                aria-live="polite"
            >
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: 20, scale: 0.96 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
                        >
                            <Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </div>
    );
}
