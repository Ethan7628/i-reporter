import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // center toasts in the viewport like small cards
      "fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full max-w-sm min-w-0 items-center space-x-3 overflow-hidden rounded-md border p-3 pr-8 shadow-sm bg-white text-foreground pointer-events-auto",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-neutral-50 text-foreground",
        destructive: "border-red-200 bg-white text-foreground",
        success: "border-emerald-200 bg-white text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">
          <div className="h-4 w-4 flex items-center justify-center text-muted-foreground">
            <ToastIcon variant={variant as any} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {props.children}
        </div>
      </div>

      <ToastClose />
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-[rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className,
      )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold leading-tight truncate", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn("text-sm text-muted-foreground mt-1 truncate", className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// Icon wrapper to show different icons based on variant (compact size)
const ToastIcon = ({ variant }: { variant?: "default" | "destructive" | "success" }) => {
  if (variant === "destructive") return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (variant === "success") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
};

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
};
