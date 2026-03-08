import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const shortcuts = [
  { keys: ['Ctrl', 'N'], description: 'New chapter' },
  { keys: ['Ctrl', 'Shift', 'N'], description: 'New whiteboard' },
  { keys: ['Ctrl', 'Shift', 'F'], description: 'Toggle focus mode' },
  { keys: ['Esc'], description: 'Exit focus mode' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Ctrl', 'E'], description: 'Export novel as JSON' },
  { keys: ['Ctrl', 'K'], description: 'Open search' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
