import { Modal } from '@/components/Modal';
import { Button } from '@/components/Form';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="text-red-500 mt-0.5 shrink-0"><AlertTriangle size={20} /></div>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
