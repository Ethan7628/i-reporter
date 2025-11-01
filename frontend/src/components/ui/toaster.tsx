import React from "react";
import { useToast } from "@/hooks/use-toast";

type ToastType = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
};

function ToastItem({
  toast,
  onDismiss,
  onRemove,
}: {
  toast: ToastType;
  onDismiss: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  React.useEffect(() => {
    const duration = toast.duration ?? 4000;
    const t = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <div className="toaster-item">
      <button aria-label="Close notification" onClick={() => onRemove(toast.id)} className="toaster-close">
        ×
      </button>

      {toast.title && <div className="toaster-title">{toast.title}</div>}
      {toast.description && <div className="toaster-desc">{toast.description}</div>}

      {toast.action && <div className="toaster-action">{toast.action}</div>}
    </div>
  );
}

export function Toaster() {
  const { toast, dismiss, remove } = useToast();

  // The current useToast implementation doesn't expose a `toasts` array,
  // so provide a safe empty array here to keep this component type-safe.
  // Replace this with the real toasts source if the hook is updated to return them.
  const toasts: ToastType[] = [];

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toaster-overlay">
      <div className="toaster-stack">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t as unknown as ToastType} onDismiss={(id) => dismiss(id)} onRemove={(id) => remove(id)} />
        ))}
      </div>
    </div>
  );
}
