/*
FILE PURPOSE:
This file renders a reusable confirmation dialog for destructive or important actions.

ROLE IN THE APP:
It wraps the UI alert-dialog primitives into a simpler component used by the sidebar and other actions that need user confirmation.

USED BY:
- BookSidebar.tsx uses this before deleting boards, chapters, and folders

EXPORTS:
- ConfirmDialog: reusable confirmation modal component
*/

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// This interface defines the data needed to render a confirmation step.
// The caller owns the action logic and passes it in through onConfirm.
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

// This component is intentionally thin:
// it delegates all dialog behavior to the shared UI primitives
// and only maps app-specific props into that structure.
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Delete', destructive = true, onConfirm }: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
