'use client';
import { useEffect, useRef, type ReactNode } from 'react';
export default function RoomDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (open && !d?.open) d?.showModal(); else if (!open && d?.open) d.close(); }, [open]);
  return <dialog ref={ref} className="room-dialog" aria-label="Kết quả và đánh giá ván chơi" onCancel={onClose} onClose={onClose}><div className="dialog-top"><span>HỒ SƠ SAU VÁN</span><button type="button" className="button small secondary" onClick={onClose}>Đóng ×</button></div>{children}</dialog>;
}
