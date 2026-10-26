import type { ClassMap } from '@rjsf/utils';

import { buttonVariants } from './components/ui/button.tsx';

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
  // One column unless there is a toolbox, as the gap before an empty one would narrow the field. Top-aligned, so errors
  // or help under the input don't move the toolbox; past a label, which core marks the item `data-display-label` for,
  // down to the input: the label's `text-sm leading-none` line, the field's `gap-2` and the `p-0.5` around the theme's
  // inputs, and past a description between them (`data-has-description`), its `text-sm` line and another `gap-2`. Each
  // offset assumes a one-line label and description, so a wrapping one sits the toolbox high
  arrayItem:
    'mb-2 grid grid-cols-1 has-[>.rjsf-array-item-toolbox]:grid-cols-[minmax(0,1fr)_auto] items-start gap-2 data-display-label:[&>.rjsf-array-item-toolbox]:mt-6 data-display-label:data-has-description:[&>.rjsf-array-item-toolbox]:mt-13',
  arrayItemToolbox: 'flex gap-2',
  objectFieldset: 'flex min-w-0 flex-col gap-2',
  // Core's `AltDateWidget`, which the theme renders: its parts in one wrapping row, each select a steady width
  altDateList: 'flex flex-wrap items-center gap-2',
  altDateListItem: 'min-w-24 has-[>button]:min-w-0',
  altDateNowButton: buttonVariants({ variant: 'outline', size: 'sm' }),
  altDateClearButton: buttonVariants({ variant: 'outline', size: 'sm' }),
};

/** The theme's class map, a fresh copy on every call, for a `Form` put together from the theme's templates and widgets
 * rather than `generateTheme()`, which passes it as its `classMap`
 */
export function generateClassMap(): ClassMap {
  return { ...SHADCN_CLASS_MAP };
}
