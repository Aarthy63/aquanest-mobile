import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/** Bottom sheet that stays inside the phone frame (absolute, not portaled). */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-foreground/40 animate-in fade-in" onClick={onClose} />
      <div className="relative max-h-[85%] overflow-y-auto rounded-t-3xl bg-card pb-safe shadow-lift animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 flex items-center justify-between bg-card px-5 pb-2 pt-4">
          <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-border" />
          <h2 className="text-base font-semibold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
