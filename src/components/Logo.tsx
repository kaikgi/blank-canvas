import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 18, text: "text-lg" },
    md: { icon: 24, text: "text-xl" },
    lg: { icon: 32, text: "text-2xl" },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className="gradient-hero rounded-lg p-1.5">
          <Calendar 
            size={sizes[size].icon} 
            className="text-primary-foreground" 
            strokeWidth={2.5}
          />
        </div>
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-tight", sizes[size].text)}>
          Agenda<span className="text-muted-foreground">li</span>
        </span>
      )}
    </div>
  );
}
