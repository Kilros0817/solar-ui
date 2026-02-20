'use client'

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Loader2, X } from 'lucide-react';

type RejectReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (reason: string) => void | Promise<void>;
  isSubmitting?: boolean;
};

export function RejectReasonDialog({
  open,
  onOpenChange,
  title,
  description = 'Please provide a reason for the rejection.',
  placeholder = 'Enter reason...',
  submitLabel = 'Reject',
  onSubmit,
  isSubmitting = false,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setReason('');
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting || isSubmitting) return;
    setReason('');
    onOpenChange(false);
  };

  const busy = submitting || isSubmitting;

  const modal = open && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-dialog-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={handleClose}
      />
      {/* Content */}
      <div
        className="relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="reject-dialog-title" className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Textarea
          placeholder={placeholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={100}
          rows={3}
          className="resize-y mb-1"
          disabled={busy}
        />
        <p className="text-xs text-muted-foreground mb-6 text-right">{reason.length}/100</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || busy}
            className="gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Rejecting...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
