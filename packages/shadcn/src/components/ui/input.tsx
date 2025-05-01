import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Props for the Input component
 * @extends InputHTMLAttributes<HTMLInputElement> - HTML input element attributes
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * An input component with styling and focus states
 *
 * @param props - The props for the Input component
 * @param props.className - Additional CSS classes to apply to the input
 * @param props.type - The type of the input element
 * @param ref - The forwarded ref for the input element
 * @returns An input element with the specified styles and behavior
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
