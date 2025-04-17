import { TextareaHTMLAttributes, forwardRef } from 'react';

import { cn } from '../../lib/utils';

/**
 * Props for the Textarea component
 * @extends TextareaHTMLAttributes<HTMLTextAreaElement> - HTML textarea element attributes
 */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * A textarea component with styling and focus states
 *
 * @param props - The props for the Textarea component
 * @param props.className - Additional CSS classes to apply to the textarea
 * @param ref - The forwarded ref for the textarea element
 * @returns A styled textarea element
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
