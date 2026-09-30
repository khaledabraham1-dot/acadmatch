import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50 bg-white",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-10 px-3.5 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-[52px] px-6 text-base",
};

// Identité Radar : cibles de 48px et plus au pouce, rayon 14px, texte gras.
const BASE = "inline-flex items-center justify-center gap-2 rounded-[14px] font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...props}
    />
  );
}

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function LinkButton({ href, variant = "primary", size = "md", className, children }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}>
      {children}
    </Link>
  );
}
