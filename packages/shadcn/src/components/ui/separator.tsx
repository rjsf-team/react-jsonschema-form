'use client';

import { Root } from '@radix-ui/react-separator';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

import { cn } from '../../lib/utils';

/**
 * A separator component for visually dividing content
 *
 * @param props - The props for the Separator component
 * @param props.className - Additional CSS classes to apply to the separator
 * @param props.orientation - The orientation of the separator ('horizontal' | 'vertical')
 * @param props.decorative - Whether the separator is decorative or semantic
 * @param ref - The forwarded ref for the separator element
 * @returns A styled separator element
 */
const Separator = forwardRef<ElementRef<typeof Root>, ComponentPropsWithoutRef<typeof Root>>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = Root.displayName;

export { Separator };
