'use client';

import { useEffect, useRef } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-xl border border-[#E2E5E9] bg-white p-0 shadow-xl backdrop:bg-black/30 backdrop:backdrop-blur-sm w-full max-w-lg"
    >
      <div className="px-6 py-4 border-b border-[#E2E5E9]">
        <h2 className="text-lg font-semibold text-[#1A1D21]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
