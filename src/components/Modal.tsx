import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.classList.remove('modal-open'); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal-card ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><h2 id="modal-title">{title}</h2><button aria-label="Close" className="icon-button" onClick={onClose}><X size={18} /></button></div>{children}</section></div>;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, busy }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; busy?: boolean }) {
  return <Modal open={open} onClose={onClose} title={title}><div className="confirm-body"><p>{message}</p><div className="modal-actions"><button className="btn-quiet" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="btn-danger" type="button" onClick={onConfirm} disabled={busy}>{busy ? 'Removing…' : 'Remove'}</button></div></div></Modal>;
}
