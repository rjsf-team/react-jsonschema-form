import type { ClassMap } from '@rjsf/utils';

/** The Tailwind classes for the elements `@rjsf/core` renders in this theme. The muted color of a description and help
 * has zero specificity, so their error keys' `text-destructive` wins over it
 */
export const SHADCN_CLASS_MAP: ClassMap = {
  fieldLabel: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  labelError: 'text-destructive',
  fieldDescription: 'text-sm [:where(&)]:text-muted-foreground',
  descriptionError: 'text-destructive',
  fieldErrors: 'flex flex-col gap-1',
  fieldError: 'text-xs font-medium text-destructive mb-1',
  fieldHelp: 'text-xs font-medium [:where(&)]:text-muted-foreground',
  helpError: 'text-destructive',
  multiSchema: 'p-4 border rounded-md bg-background shadow-sm',
  multiSchemaSelector: 'mb-4',
  arrayFieldset: 'min-w-0',
  arrayItemList: 'mb-2',
  arrayItem: 'mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2',
  arrayItemToolbox: 'flex gap-2',
  objectFieldset: 'flex min-w-0 flex-col gap-2',
};
