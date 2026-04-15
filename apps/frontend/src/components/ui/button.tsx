import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-[0_12px_30px_rgba(92,145,255,0.28)] hover:scale-[1.01] hover:shadow-[0_18px_38px_rgba(34,197,156,0.3)]",
        ghost: "bg-transparent text-foreground hover:bg-secondary/15",
        outline:
          "border border-border bg-card/85 text-foreground hover:border-secondary/60 hover:bg-secondary/12"
      },
      size: {
        default: "h-11 px-5",
        lg: "h-12 px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
