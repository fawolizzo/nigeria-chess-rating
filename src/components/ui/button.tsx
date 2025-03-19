
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:translate-y-[-1px]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:translate-y-[-1px]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:translate-y-[-1px]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        warning:
          "bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm hover:translate-y-[-1px]",
        // Enhanced Nigerian themed variants
        "nigeria-primary": 
          "bg-nigeria-green text-white hover:bg-nigeria-green-dark shadow-sm hover:translate-y-[-1px] hover:shadow",
        "nigeria-secondary":
          "bg-nigeria-yellow text-nigeria-black hover:bg-nigeria-yellow-dark shadow-sm hover:translate-y-[-1px] hover:shadow",
        "nigeria-outline":
          "border border-nigeria-green text-nigeria-green bg-transparent hover:bg-nigeria-green/10 hover:border-nigeria-green",
        "nigeria-ghost":
          "text-nigeria-green hover:bg-nigeria-green/10 hover:text-nigeria-green-dark",
        "nigeria-link":
          "text-nigeria-green underline-offset-4 hover:underline hover:text-nigeria-green-dark",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
