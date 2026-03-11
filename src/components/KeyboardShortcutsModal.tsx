/*
FILE PURPOSE:
This file renders the keyboard shortcuts help dialog.

ROLE IN THE APP:
It gives users a visible reference for the global shortcuts supported by the writing workspace.

USED BY:
- pages/Index.tsx opens and closes this modal
- sidebar actions can also trigger it

EXPORTS:
- KeyboardShortcutsModal: dialog component that lists shortcut keys and descriptions
*/

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: KeyboardShortcutsModal
// ═══════════════════════════════════════════════════════════════════════════════
// FILE PURPOSE:
// Displays a help dialog showing all available keyboard shortcuts in the app.
//
// ROLE IN THE APP:
// Provides users with a reference guide for keyboard navigation and global shortcuts.
// Triggered by pressing "?" or from the sidebar menu.
//
// USED BY:
// - Index.tsx: Opens when user presses "?" or clicks "?" button in sidebar
// - SidebarContent: Menu option to open shortcuts
//
// EXPORTS:
// - KeyboardShortcutsModal: React component that renders a dialog with shortcut list
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Data: All keyboard shortcuts ──────────────────────────────────────────────
// This array defines every keyboard shortcut available in the app.
// Each shortcut has:
// - keys: Array of key names to press (e.g., ['Ctrl', 'N'] for Ctrl+N)
// - description: What the shortcut does
const shortcuts = [
  { keys: ['Ctrl', 'N'], description: 'New chapter' },
  { keys: ['Ctrl', 'Shift', 'N'], description: 'New whiteboard' },
  { keys: ['Ctrl', 'Shift', 'F'], description: 'Toggle focus mode' },
  { keys: ['Esc'], description: 'Exit focus mode' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Ctrl', 'E'], description: 'Export novel as JSON' },
  { keys: ['Import'], description: 'Restore a JSON backup from the sidebar' },
  { keys: ['Ctrl', 'K'], description: 'Open search' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * KeyboardShortcutsModal Component
 *
 * INPUT:
 * - open (boolean): Whether the dialog is open
 * - onOpenChange (function): Called when user opens/closes the dialog
 *
 * OUTPUT:
 * Renders a modal dialog with a formatted list of keyboard shortcuts
 *
 * WHEN IT RUNS:
 * - Renders whenever the component is mounted
 * - Opens/closes based on the 'open' prop
 */
export function KeyboardShortcutsModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-mono rounded bg-muted border border-border text-muted-foreground min-w-[24px]"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
