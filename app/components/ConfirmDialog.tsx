import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { ConfirmDialogProps } from '../data/interfaces';

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            {variant === 'destructive' && (
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            )}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-end gap-3">
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            className={variant === 'default' ? 'cursor-pointer bg-brand-secondary hover:bg-[var(--brand-secondary-hover)] text-white' : 'cursor-pointer'}
          >
            {confirmLabel}
          </Button>
          <Button variant="outline" onClick={onCancel} className="cursor-pointer">
            {cancelLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
