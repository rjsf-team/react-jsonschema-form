'use client';

import { CheckIcon } from '@radix-ui/react-icons';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

import { cn } from '../../lib/utils';

/**
 * A radio group component for selecting a single option from a list
 *
 * @param props - The props for the RadioGroup component
 * @param props.className - Additional CSS classes to apply to the radio group
 * @param ref - The forwarded ref for the radio group element
 * @returns A radio group container element
 */
const RadioGroup = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/**
 * An individual radio item within a RadioGroup
 *
 * @param props - The props for the RadioGroupItem component
 * @param props.className - Additional CSS classes to apply to the radio item
 * @param ref - The forwarded ref for the radio item element
 * @returns A styled radio input element
 */
const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className='flex items-center justify-center'>
        <CheckIcon className='h-3.5 w-3.5 fill-primary' />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
