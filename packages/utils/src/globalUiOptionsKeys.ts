import { OVERRIDABLE_TEMPLATE_NAME_MAP } from './templateOverrideWarnings.ts';
import type { GlobalUISchemaOptionsKeys, ReservedUiOptionName } from './types.ts';

/** `GLOBAL_UI_OPTIONS_KEYS` as an object, so that a key added to `GlobalUISchemaOptionsKeys` without being added here,
 * or one here no longer declared there, is a type error
 */
const GLOBAL_UI_OPTIONS_KEY_MAP = {
  addable: true,
  copyable: true,
  orderable: true,
  removable: true,
  label: true,
  allowClearTextInputs: true,
  duplicateKeySuffixSeparator: true,
  enableMarkdownInDescription: true,
  enableMarkdownInHelp: true,
  enableOptionalDataFieldForType: true,
  optionValueFormat: true,
  deprecatedHandling: true,
} satisfies Record<keyof GlobalUISchemaOptionsKeys, true>;

/** The keys RJSF reads from `ui:globalOptions`, the ones `pickGlobalUiOptions()` keeps */
export const GLOBAL_UI_OPTIONS_KEYS = Object.keys(
  GLOBAL_UI_OPTIONS_KEY_MAP,
) as readonly (keyof GlobalUISchemaOptionsKeys)[];

/** Every name in `ReservedUiOptionName`, which `pickGlobalUiOptions()` drops from the extension keys it is given.
 * Listed through an object, as `GLOBAL_UI_OPTIONS_KEYS` is, so that it can't drift from the type
 */
export const RESERVED_UI_OPTION_NAMES = Object.keys({
  ...GLOBAL_UI_OPTIONS_KEY_MAP,
  // The declared template names, one list shared with `isTemplateName()`; it lives in
  // `templateOverrideWarnings.ts` so this public module adds no export for it
  ...OVERRIDABLE_TEMPLATE_NAME_MAP,
  field: true,
  classNames: true,
  style: true,
  title: true,
  description: true,
  placeholder: true,
  help: true,
  autofocus: true,
  autocomplete: true,
  autocapitalize: true,
  disabled: true,
  emptyValue: true,
  initialValue: true,
  required: true,
  enumDisabled: true,
  enumNames: true,
  enumOrder: true,
  optgroups: true,
  optionsSchemaSelector: true,
  itemLabel: true,
  hideError: true,
  readonly: true,
  order: true,
  filePreview: true,
  inline: true,
  inputType: true,
  rows: true,
  submitButtonOptions: true,
  widget: true,
  fieldReplacesAnyOrOneOf: true,
  enumOptions: true,
  accept: true,
  expandable: true,
  format: true,
  hideClearButton: true,
  hideNowButton: true,
  shape: true,
  stars: true,
  yearsRange: true,
} satisfies Record<ReservedUiOptionName, true>) as readonly ReservedUiOptionName[];
