import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

/**
 * Predefined badge variants using class-variance-authority
 * @see https://ui.shadcn.com/docs/components/badge
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Props for the Badge component
 * @extends HTMLAttributes<HTMLDivElement> - HTML div element attributes
 * @extends VariantProps<typeof badgeVariants> - Badge variant props
 */
export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

/**
 * A badge component that displays short status descriptors
 *
 * @param props - The props for the Badge component
 * @param props.className - Additional CSS classes to apply to the badge
 * @param props.variant - The style variant of the badge: 'default' | 'secondary' | 'destructive' | 'outline'
 * @returns A div element that displays as a badge
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
