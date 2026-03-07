import * as React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionState = "idle" | "loading" | "success" | "error";

interface ActionButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Async handler — manages loading/success/error states automatically */
  onClick?: () => Promise<void> | void;
  /** Override internal loading state (for external control) */
  loading?: boolean;
  /** Label shown during loading */
  loadingLabel?: string;
  /** Label shown on success (brief flash) */
  successLabel?: string;
  /** Duration (ms) the success state is shown */
  successDuration?: number;
  /** Icon shown in idle state (before the label) */
  icon?: React.ReactNode;
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      children,
      onClick,
      loading: externalLoading,
      loadingLabel,
      successLabel = "Salvo",
      successDuration = 1500,
      icon,
      disabled,
      variant,
      className,
      ...props
    },
    ref
  ) => {
    const [state, setState] = React.useState<ActionState>("idle");
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

    // Sync with external loading prop — show success when loading transitions false
    React.useEffect(() => {
      if (externalLoading === true) {
        setState("loading");
      } else if (externalLoading === false && state === "loading") {
        setState("success");
        timeoutRef.current = setTimeout(() => setState("idle"), successDuration);
      }
    }, [externalLoading]);

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const handleClick = async () => {
      if (!onClick || state === "loading" || state === "success") return;

      setState("loading");
      try {
        await onClick();
        setState("success");
        timeoutRef.current = setTimeout(() => setState("idle"), successDuration);
      } catch {
        setState("error");
        timeoutRef.current = setTimeout(() => setState("idle"), 2000);
      }
    };

    const isLoading = state === "loading";
    const isSuccess = state === "success";
    const isError = state === "error";

    const currentVariant = isSuccess
      ? undefined // we override classes manually
      : isError
        ? "destructive"
        : variant;

    return (
      <Button
        ref={ref}
        variant={currentVariant}
        disabled={disabled || isLoading}
        className={cn(
          "relative transition-all duration-300",
          isSuccess &&
            "bg-success text-success-foreground hover:bg-success/90 border-success",
          isError && "animate-[shake_0.3s_ease-in-out]",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {/* Success check */}
        {isSuccess && (
          <Check className="h-4 w-4 animate-scale-in" />
        )}

        {/* Error icon */}
        {isError && (
          <AlertCircle className="h-4 w-4" />
        )}

        {/* Idle icon */}
        {!isLoading && !isSuccess && !isError && icon}

        {/* Label */}
        <span>
          {isLoading
            ? (loadingLabel || children)
            : isSuccess
              ? successLabel
              : children}
        </span>
      </Button>
    );
  }
);

ActionButton.displayName = "ActionButton";

export { ActionButton };
export type { ActionButtonProps };
