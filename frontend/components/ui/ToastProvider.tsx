"use client";

import { useState, useCallback, createContext, useContext } from "react";
import * as Toast from "@radix-ui/react-toast";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "border-honeydew-300 bg-honeydew-50",
  error: "border-coral-300 bg-coral-50",
  warning: "border-banana-300 bg-banana-50",
  info: "border-neon-ice-300 bg-neon-ice-50",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}

        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            open
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
            className={`rounded-xl border px-4 py-3 shadow-card animate-slide-in ${VARIANT_CLASSES[t.variant]}`}
          >
            <Toast.Title className="text-sm font-semibold text-honeydew-900">
              {t.title}
            </Toast.Title>
            {t.description && (
              <Toast.Description className="mt-0.5 text-xs text-honeydew-600">
                {t.description}
              </Toast.Description>
            )}
            <Toast.Close className="absolute right-2 top-2 text-honeydew-400 hover:text-honeydew-700 text-xs">
              ✕
            </Toast.Close>
          </Toast.Root>
        ))}

        <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
