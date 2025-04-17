import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Predefined button variants using class-variance-authority
 * @see https://ui.shadcn.com/docs/components/button
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

/**
 * Props for the Button component
 * @extends ButtonHTMLAttributes<HTMLButtonElement> - HTML button element attributes
 * @extends VariantProps<typeof buttonVariants> - Button variant props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Whether to render the button as a child component using Radix UI Slot */
  asChild?: boolean;
}

/**
 * A button component with multiple style variants and sizes
 *
 * @param props - The props for the Button component
 * @param props.className - Additional CSS classes to apply to the button
 * @param props.variant - The style variant of the button: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
 * @param props.size - The size variant of the button: 'default' | 'sm' | 'lg' | 'icon'
 * @param props.asChild - Whether to render the button as a child component
 * @param ref - The forwarded ref for the button element
 * @returns A button element with the specified styles and behavior
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
