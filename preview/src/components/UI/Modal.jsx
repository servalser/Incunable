import * as React from 'react';
import { X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './dialog.jsx';

/* Compatibilité avec l'ancien composant Modal */
export function Modal({ open, onClose, title, children, size }) {
  const widthClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-lg';
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className={widthClass}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* Zones internes réutilisables */
export function ModalBody({ children, className }) {
  return <div className={`py-2 ${className ?? ''}`}>{children}</div>;
}

export function ModalFooter({ children }) {
  return <DialogFooter className="gap-2 pt-2">{children}</DialogFooter>;
}
