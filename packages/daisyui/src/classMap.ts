import type { ClassMap } from '@rjsf/utils';

/** A checkbox or radio option, dimmed while `@rjsf/core` marks it `data-disabled` */
const OPTION = 'cursor-pointer data-disabled:cursor-not-allowed data-disabled:opacity-50';

/** The daisyUI and Tailwind classes for the elements `@rjsf/core` renders in this theme */
const DAISYUI_CLASS_MAP: ClassMap = {
  input: 'input input-bordered w-full',
  textarea: 'textarea textarea-bordered w-full',
  fileInput: 'file-input',
  rangeInput: 'range',
  rangeWrapper: 'flex items-center gap-4',
  checkboxWrapper: `mt-1 w-fit ${OPTION}`,
  checkboxInput: 'checkbox mr-2',
  checkboxInlineLabel: `mr-4 ${OPTION}`,
  radioWrapper: `mt-1 w-fit ${OPTION}`,
  radioInput: 'radio mr-2',
  radioInlineLabel: `mr-4 ${OPTION}`,
  altDateList: 'flex flex-wrap items-center gap-2',
  // A steady width for each part, whose select is only as wide as its text in a flex row, but not for the buttons
  altDateListItem: 'min-w-24 has-[>button]:min-w-0',
  altDateNowButton: 'btn btn-sm btn-primary',
  altDateClearButton: 'btn btn-sm btn-secondary',
  fieldDescription: 'text-sm text-base-content/80 my-4',
  fieldErrors: 'list-disc list-inside text-red-600',
  fieldHelp: 'text-gray-500 text-sm',
  errorListTitle: 'font-bold text-red-600',
  errorListItems: 'list-disc list-inside text-red-600',
  // Top-aligned, so errors or help under the input don't move the toolbox; past a label, down to the input
  arrayItem:
    'fieldset flex items-start gap-2 bg-base-100 border border-base-300 p-4 first:rounded-t-lg last:rounded-b-lg not-last:-mb-px [&:has(>.rjsf-field>.field-template>label:first-child)>.rjsf-array-item-toolbox]:mt-5',
  arrayItemToolbox: 'mt-1 flex justify-end',
  multiSchema: 'p-4 border rounded-sm shadow-sm',
  multiSchemaSelector: 'mb-4',
  cyclicSchemaMessage: 'alert alert-warning mt-4 mb-2',
  cyclicSchemaExpandButton: 'btn btn-sm btn-warning',
  submitButton: 'btn btn-primary',
  iconButton: 'btn btn-sm',
  buttonIcon: 'h-5 w-5',
};

/** The theme's class map, a fresh copy on every call, for a `Form` put together from the theme's templates and widgets
 * rather than `generateTheme()`, which passes it as its `classMap`
 */
export function generateClassMap(): ClassMap {
  return { ...DAISYUI_CLASS_MAP };
}
