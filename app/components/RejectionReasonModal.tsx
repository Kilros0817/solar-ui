'use client'

import { createPortal } from 'react-dom';
import { Button } from './ui/button';

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string | null | undefined;
  title?: string;
}

export function RejectionReasonModal({ 
  isOpen, 
  onClose, 
  reason,
  title = "Rejection Reason"
}: RejectionReasonModalProps) {
  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-reason-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reject-reason-modal-title" className="text-lg font-semibold mb-4">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {reason || 'No reason provided.'}
        </p>
        <div className="flex justify-end mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
