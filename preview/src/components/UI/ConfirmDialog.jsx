import { Button } from './button.jsx';
import { Modal, ModalBody, ModalFooter } from './Modal.jsx';

export function ConfirmDialog({ open, message, confirmLabel = 'Confirmer', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} title="Confirmation" size="sm">
      <ModalBody>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
        <Button variant={danger ? 'destructive' : 'default'} size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
