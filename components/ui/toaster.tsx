import * as React from "react";
import { Toaster as HotToaster, toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const Toaster = React.forwardRef<
  React.ElementRef<typeof HotToaster>,
  React.ComponentPropsWithoutRef<typeof HotToaster>
>(({ className, ...props }, ref) => {
  return (
    <HotToaster
      ref={ref}
      position="top-right"
      toastOptions={{
        className: cn("bg-gray-900 text-white rounded-lg p-2 shadow-lg", className),
        duration: 3000,
      }}
      {...props}
    />
  );
});
Toaster.displayName = "Toaster";

const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
  const toastStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  toast(message, {
    className: cn("text-white px-4 py-2 rounded-lg", toastStyles[type]),
  });
};

export { Toaster, showToast };
