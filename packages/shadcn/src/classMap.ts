import type { ClassMap } from '@rjsf/utils';

/** The Tailwind classes for the elements `@rjsf/core` renders in this theme. A field's label, description and help turn
 * destructive by a `data-invalid:` variant on the attribute core sets while the field shows its own errors, which
 * out-specifies their base color
 */
const SHADCN_CLASS_MAP: ClassMap = {
  fieldLabel: 'text-sm font-medium leading-none data-invalid:text-destructive',
  fieldDescription: 'text-sm text-muted-foreground data-invalid:text-destructive',
  fieldErrors: 'flex flex-col gap-1',
  fieldError: 'text-xs font-medium text-destructive',
  fieldHelp: 'text-xs font-medium text-muted-foreground data-invalid:text-destructive',
  multiSchema: 'p-4 border rounded-md bg-background shadow-sm',
  multiSchemaSelector: 'mb-4',
  arrayFieldset: 'min-w-0',
  arrayItemList: 'mb-2',
  // Top-aligned, so errors or help under the input don't move the toolbox; past a label, down to the input: the label's
  // `text-sm leading-none` line, the field's `gap-2` and the `p-0.5` around the theme's inputs, and past a description
  // between them, its `text-sm` line and another `gap-2`
  arrayItem:
    'mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 [&:has(>.rjsf-field>.rjsf-field-label:first-child)>.rjsf-array-item-toolbox]:mt-6 [&:has(>.rjsf-field>.rjsf-field-label:first-child+.rjsf-field-description)>.rjsf-array-item-toolbox]:mt-13',
  arrayItemToolbox: 'flex gap-2',
  objectFieldset: 'flex min-w-0 flex-col gap-2',
};

/** The theme's class map, a fresh copy on every call, for a `Form` put together from the theme's templates and widgets
 * rather than `generateTheme()`, which passes it as its `classMap`
 */
export function generateClassMap(): ClassMap {
  return { ...SHADCN_CLASS_MAP };
}
