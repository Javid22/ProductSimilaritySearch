import { useEffect, useRef } from "react";
import { CloseIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** "side" slides in from the right on desktop; every sheet becomes a bottom sheet on mobile. */
  variant?: "side" | "bottom";
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, variant = "side", footer, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`sheet sheet-${variant}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel" role="dialog" aria-modal="true" tabIndex={-1} ref={panelRef}>
        <span className="sheet-grip" aria-hidden />
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <footer className="sheet-foot">{footer}</footer>}
      </div>
    </div>
  );
}
