'use client';

import { Indicator, Root } from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * A checkbox component built on top of Radix UI Checkbox primitive
 * Renders an interactive checkbox that can be either checked or unchecked
 * @see https://ui.shadcn.com/docs/components/checkbox
 *
 * @param props - Props extending Radix UI Checkbox primitive props
 * @param props.className - Additional CSS classes to apply to the checkbox
 * @param ref - Forward ref to access the underlying checkbox element
 */
const Checkbox = forwardRef<ElementRef<typeof Root>, ComponentPropsWithoutRef<typeof Root>>(
  ({ className, ...props }, ref) => (
    <Root
      ref={ref}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        className,
      )}
      {...props}
    >
      <Indicator className={cn('flex items-center justify-center text-current')}>
        <CheckIcon className='h-4 w-4' />
      </Indicator>
    </Root>
  ),
);
Checkbox.displayName = Root.displayName;

export { Checkbox };
