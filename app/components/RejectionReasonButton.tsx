'use client'

import { MessageCircle } from 'lucide-react';

interface RejectionReasonButtonProps {
  onClick: () => void;
  className?: string;
}

export function RejectionReasonButton({ onClick, className }: RejectionReasonButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="View rejection reason"
      className={className || "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-destructive/50 cursor-pointer"}
    >
      <MessageCircle className="h-4 w-4 shrink-0" />
      <span>Rejection reason</span>
    </button>
  );
}
