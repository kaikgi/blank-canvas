import { cn } from "@/lib/utils";
import logoPrincipal from "@/assets/logo-principal.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const heights = {
    sm: "h-7",
    md: "h-9",
    lg: "h-12",
  };

  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };

  if (showText) {
    return (
      <div className={cn("flex items-center", className)}>
        <img
          src={logoPrincipal}
          alt="Agendali"
          className={cn("object-contain", heights[size])}
          style={{ height: size === "sm" ? 28 : size === "md" ? 36 : 48 }}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/logo-512.png"
        alt="Agendali"
        className={cn("object-contain rounded-lg", iconSizes[size])}
      />
    </div>
  );
}
