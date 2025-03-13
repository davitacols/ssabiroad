import { useState } from "react";

type ToastType = "default" | "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast extends ToastProps {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({
    message,
    type = "default",
    duration = 5000,
    description,
    action,
  }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const newToast = {
      id,
      message,
      type,
      duration,
      description,
      action,
    };
    
    setToasts((prev) => [...prev, newToast]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    
    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toast: Object.assign(toast, {
      success: (message: string, props?: Omit<ToastProps, "message" | "type">) => 
        toast({ message, type: "success", ...props }),
      error: (message: string, props?: Omit<ToastProps, "message" | "type">) => 
        toast({ message, type: "error", ...props }),
      warning: (message: string, props?: Omit<ToastProps, "message" | "type">) => 
        toast({ message, type: "warning", ...props }),
      info: (message: string, props?: Omit<ToastProps, "message" | "type">) => 
        toast({ message, type: "info", ...props }),
    }),
    toasts,
    dismiss,
  };
}

