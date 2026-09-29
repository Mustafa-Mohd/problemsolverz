import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-semibold transition-[transform,background-color,border-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90",
        primary: "border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90",
        destructive: "border border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/15",
        danger: "border border-warning/35 bg-warning/10 text-warning hover:bg-warning/15",
        outline: "border border-border bg-surface-raised text-foreground hover:border-primary/40 hover:bg-surface-hover",
        secondary: "border border-border bg-surface-raised text-foreground hover:border-primary/40 hover:bg-surface-hover",
        ghost: "border border-transparent bg-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground",
        link: "border border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
        icon: "border border-transparent bg-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2.5",
        lg: "h-10 px-5",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";