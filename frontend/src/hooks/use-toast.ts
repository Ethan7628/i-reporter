import React, { useCallback } from "react";
import { toast as rtToast, ToastOptions } from "react-toastify";

// Thin wrapper around react-toastify so existing `useToast` callers keep working.
function useToast() {
  const toast = useCallback((opts: any) => {
    // Allow calling toast('message') or toast({ title, description, ...options })
    if (typeof opts === "string") {
      return rtToast(opts);
    }

    const { title, description, variant, duration, ...rest } = opts || {};

    const content = React.createElement(
      "div",
      null,
      title ? React.createElement("div", { style: { fontWeight: 600 } }, title) : null,
      description ? React.createElement("div", null, description) : null,
    );

    // Map our variant to react-toastify's 'type'
    const type = variant === "destructive" ? ("error" as const) : variant === "success" ? ("success" as const) : (variant as any) || undefined;

    const options: ToastOptions = {
      ...(type ? { type } : {}),
      ...(typeof duration === "number" ? { autoClose: duration } : {}),
      ...rest,
    };

    return rtToast(content, options);
  }, []);

  return {
    toast,
    dismiss: rtToast.dismiss,
    remove: rtToast.dismiss,
  };
}

export { useToast, rtToast as toast };
