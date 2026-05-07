/**
 * ConfirmDialog — boîte de confirmation native.
 *
 * Props :
 *   open         — boolean
 *   message      — string (texte de confirmation)
 *   confirmLabel — string (texte du bouton de confirmation, défaut : "Confirmer")
 *   danger       — boolean (rouge + icône alerte si destructif)
 *   onConfirm    — callback
 *   onCancel     — callback
 */

import { AlertCircle, HelpCircle } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from './Modal.jsx';

export function ConfirmDialog({ open, message, confirmLabel = 'Confirmer', danger = false, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <Modal open={open} onClose={onCancel} title="Confirmation" size="sm">
            <ModalBody>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {/* Icône contextuelle — rouge si danger, gris si neutre */}
                    <div style={{
                        flexShrink: 0, width: 36, height: 36, borderRadius: 8,
                        background: danger ? 'var(--status-overdue-bg)' : 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {danger
                            ? <AlertCircle size={18} style={{ color: 'var(--status-overdue)' }} aria-hidden="true" />
                            : <HelpCircle  size={18} style={{ color: 'var(--muted)' }}          aria-hidden="true" />
                        }
                    </div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', paddingTop: 7 }}>
                        {message}
                    </p>
                </div>
            </ModalBody>

            <ModalFooter>
                <button className="btn" onClick={onCancel}>
                    Annuler
                </button>
                <button
                    className="btn primary"
                    style={danger ? {
                        background: 'var(--status-overdue)',
                        borderColor: 'var(--status-overdue)',
                        color: '#fff',
                    } : {}}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </button>
            </ModalFooter>
        </Modal>
    );
}
