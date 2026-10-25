import type { ClassMap } from '@rjsf/utils';

/** The Tailwind classes for the elements `@rjsf/core` renders in this theme. A field's label, description and help turn
 * destructive by a `data-invalid:` variant on the attribute core sets while the field shows its own errors, which
 * out-specifies their base color
 */
export const SHADCN_CLASS_MAP: ClassMap = {
  fieldLabel:
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-invalid:text-destructive',
  fieldDescription: 'text-sm text-muted-foreground data-invalid:text-destructive',
  fieldErrors: 'flex flex-col gap-1',
  fieldError: 'text-xs font-medium text-destructive mb-1',
  fieldHelp: 'text-xs font-medium text-muted-foreground data-invalid:text-destructive',
  multiSchema: 'p-4 border rounded-md bg-background shadow-sm',
  multiSchemaSelector: 'mb-4',
  arrayFieldset: 'min-w-0',
  arrayItemList: 'mb-2',
  // Top-aligned, so errors or help under the input don't move the toolbox; past a label, down to the input: the label's
  // `text-sm leading-none` line and the field's `gap-2`
  arrayItem:
    'mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 [&:has(>.rjsf-field>.rjsf-field-label:first-child)>.rjsf-array-item-toolbox]:mt-6',
  arrayItemToolbox: 'flex gap-2',
  objectFieldset: 'flex min-w-0 flex-col gap-2',
};
