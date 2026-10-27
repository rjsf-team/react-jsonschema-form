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
  // The fieldsets place the add button core renders straight into them at their end, so the button carries no margin
  // of its own into a custom template
  arrayFieldset: 'min-w-0 [&>.rjsf-array-item-add]:mt-2 [&>.rjsf-array-item-add]:ms-auto',
  arrayItemList: 'mb-2',
  // One column unless there is a toolbox, as the gap before an empty one would narrow the field. Top-aligned, so errors
  // or help under the input don't move the toolbox. Core's `FieldTemplate` lays its parts out on the item's rows, one
  // each, spaced by a margin under each rather than the field's `gap-2`, which would space the empty rows too, and the
  // toolbox sits on the control's row, `--rjsf-control-row`, past a label, a description or both, however far they
  // wrap, down the `p-0.5` around the theme's inputs; its column is named too, as an item placed by row alone is placed
  // before the field and would take the field's column. A `FieldTemplate` of your own, or a field or widget drawing its
  // own label above its control, has the toolbox pushed down past the label core marks the item `data-display-label`
  // for: its `text-sm leading-none` line, the field's `gap-2` and the `p-0.5` around the theme's inputs, and past a
  // description between them (`data-has-description`), its `text-sm` line and another `gap-2`. `String.raw` keeps the
  // `\_` Tailwind reads as an underscore in a description's id, where a bare `_` would be a space
  arrayItem:
    String.raw`mb-2 grid grid-cols-1 has-[>.rjsf-array-item-toolbox]:grid-cols-[minmax(0,1fr)_auto] items-start gap-2 [&>.rjsf-array-item-toolbox]:col-start-2 [&>.rjsf-array-item-toolbox]:row-(--rjsf-control-row) ` +
    String.raw`[--rjsf-control-row:1] has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[--rjsf-control-row:2] has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])+:is(.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[--rjsf-control-row:3] has-[>.rjsf-field>.rjsf-field-label:first-child+:is(.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])+:is(.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[--rjsf-control-row:4] ` +
    String.raw`has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:grid-rows-[repeat(8,auto)] has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:gap-y-0 ` +
    String.raw`has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>.rjsf-field]:grid has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>.rjsf-field]:grid-cols-1 has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>.rjsf-field]:grid-rows-subgrid has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>.rjsf-field]:row-span-full has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>.rjsf-field]:gap-y-0 has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>.rjsf-field>:not(:last-child)]:mb-2 has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>.rjsf-array-item-toolbox]:pt-0.5 ` +
    String.raw`data-display-label:not-has-[>.rjsf-field>.rjsf-field-label:first-child]:[&>.rjsf-array-item-toolbox]:mt-6 data-display-label:data-has-description:not-has-[>.rjsf-field>:first-child:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>.rjsf-array-item-toolbox]:mt-13`,
  arrayItemToolbox: 'flex gap-2',
  objectFieldset:
    'flex min-w-0 flex-col gap-2 [&>.rjsf-object-property-expand]:mt-2 [&>.rjsf-object-property-expand]:ms-auto',
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
