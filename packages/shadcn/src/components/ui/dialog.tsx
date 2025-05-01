'use client';

import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ComponentPropsWithoutRef, ElementRef, forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

/**
 * The root Dialog component that manages the state and accessibility of the dialog
 * @see https://ui.shadcn.com/docs/components/dialog
 * @returns A Dialog root component
 */
const Dialog = Root;

/**
 * The button that opens the dialog when clicked
 * @returns A button component that triggers the dialog
 */
const DialogTrigger = Trigger;

/**
 * Portal component that renders the dialog content in a portal
 * @returns A portal component for dialog content
 */
const DialogPortal = Portal;

/**
 * Button component for closing the dialog
 * @returns A close button component
 */
const DialogClose = Close;

/**
 * The overlay that covers the screen behind the dialog
 * @param props - Props for the overlay component including className and ref
 * @param props.className - Additional CSS classes to apply to the dialog overlay
 * @returns A semi-transparent overlay component
 */
const DialogOverlay = forwardRef<ElementRef<typeof Overlay>, ComponentPropsWithoutRef<typeof Overlay>>(
  ({ className, ...props }, ref) => (
    <Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  ),
);
DialogOverlay.displayName = Overlay.displayName;

/**
 * The main content container of the dialog
 * @param props - Props for the content component including className, children and ref
 * @param props.className - Additional CSS classes to apply to the dialog content
 * @returns A dialog content container component
 */
const DialogContent = forwardRef<ElementRef<typeof Content>, ComponentPropsWithoutRef<typeof Content>>(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          className,
        )}
        {...props}
      >
        {children}
        <Close className='absolute end-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'>
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </Close>
      </Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = Content.displayName;

/**
 * Container for the dialog header content
 * @param props - HTML div element attributes including className
 * @param props.className - Additional CSS classes to apply to the dialog header
 * @returns A header container component
 */
const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-start', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

/**
 * Container for the dialog footer content
 * @param props - HTML div element attributes including className
 * @param props.className - Additional CSS classes to apply to the dialog footer
 * @returns A footer container component
 */
const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 rtl:space-x-reverse', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

/**
 * The title component of the dialog
 * @param props - Props for the title component including className and ref
 * @param props.className - Additional CSS classes to apply to the dialog title
 * @returns A title component for the dialog
 */
const DialogTitle = forwardRef<ElementRef<typeof Title>, ComponentPropsWithoutRef<typeof Title>>(
  ({ className, ...props }, ref) => (
    <Title ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  ),
);
DialogTitle.displayName = Title.displayName;

/**
 * The description component of the dialog
 * @param props - Props for the description component including className and ref
 * @param props.className - Additional CSS classes to apply to the dialog description
 * @returns A description component for the dialog
 */
const DialogDescription = forwardRef<ElementRef<typeof Description>, ComponentPropsWithoutRef<typeof Description>>(
  ({ className, ...props }, ref) => (
    <Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
DialogDescription.displayName = Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
