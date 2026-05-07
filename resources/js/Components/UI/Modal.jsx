/**
 * Modal — composant natif (sans Radix/Shadcn).
 *
 * Props :
 *   open    — boolean
 *   onClose — callback
 *   title   — string
 *   size    — 'sm' | 'lg' | 'xl' | undefined (default ~560px)
 *
 * Sous-composants : ModalBody, ModalFooter
 */

import { useEffect }              from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X }                      from 'lucide-react';

export function Modal({ open, onClose, title, children, size }) {
    /* Bloquer le scroll du body quand la modale est ouverte */
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    /* Largeur maximale selon le size prop */
    const maxW = { sm: 400, lg: 672, xl: 896 }[size] ?? 560;

    return (
        <AnimatePresence>
            {open && (
                /* Overlay cliquable — ferme la modale */
                <motion.div
                    key="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 50,
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    {/* Panneau de la modale — stopPropagation évite la fermeture au clic interne */}
                    <motion.div
                        key="modal-panel"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 6 }}
                        transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%', maxWidth: maxW,
                            background: 'var(--surface)',
                            border: '1px solid var(--hairline)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-md)',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {/* En-tête */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--hairline)',
                        }}>
                            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                aria-label="Fermer"
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--muted)', padding: 4, borderRadius: 4,
                                    display: 'flex', alignItems: 'center',
                                    transition: 'color 0.12s',
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
                                onMouseOut={(e)  => { e.currentTarget.style.color = 'var(--muted)'; }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* Zone de contenu principale */
export function ModalBody({ children }) {
    return (
        <div style={{ padding: '16px 20px', flex: 1 }}>
            {children}
        </div>
    );
}

/* Zone des boutons d'action */
export function ModalFooter({ children }) {
    return (
        <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--hairline)',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
            {children}
        </div>
    );
}
