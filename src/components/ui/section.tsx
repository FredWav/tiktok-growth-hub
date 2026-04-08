import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "dark" | "cream" | "gradient";
  size?: "sm" | "md" | "lg" | "xl";
}

export function Section({
  children,
  className,
  id,
  variant = "default",
  size = "lg",
}: SectionProps) {
  const variantClasses = {
    default: "bg-background",
    dark: "bg-noir text-cream",
    cream: "bg-cream",
    gradient: "gradient-premium text-cream",
  };

  const sizeClasses = {
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-24 md:py-32",
  };

  return (
    <section
      className={cn(variantClasses[variant], sizeClasses[size], className)}
    >
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 md:mb-16",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
