import type { UIOptionsType, VisibleErrorsProps } from '@rjsf/utils';
import { getVisibleErrors } from '@rjsf/utils';

const uiOptionsKeys: (keyof UIOptionsType)[] = [
  'emptyValue',
  'classNames',
  'style',
  'title',
  'label',
  'help',
  'autofocus',
  'autocomplete',
  'autocapitalize',
  'disabled',
  'enumDisabled',
  'enumNames',
  'enumOrder',
  'optgroups',
  'hideError',
  'readonly',
  'order',
  'filePreview',
  'inline',
  'inputType',
  'submitButtonOptions',
  'widget',
  'field',
  'addable',
  'copyable',
  'orderable',
  'removable',
  'duplicateKeySuffixSeparator',
  'enumOptions',
  'enableMarkdownInDescription',
  'enableMarkdownInHelp',
  'enableOptionalDataFieldForType',
  'globalOptions',
  'allowClearTextInputs',
  'optionValueFormat',
  'optionsSchemaSelector',
  'deprecatedHandling',
  'ArrayFieldDescriptionTemplate',
  'ArrayFieldItemTemplate',
  'ArrayFieldTemplate',
  'ArrayFieldTitleTemplate',
  'BaseInputTemplate',
  'DescriptionFieldTemplate',
  'ErrorListTemplate',
  'FieldErrorTemplate',
  'FieldHelpTemplate',
  'FieldTemplate',
  'ObjectFieldTemplate',
  'TitleFieldTemplate',
  'UnsupportedFieldTemplate',
  'WrapIfAdditionalTemplate',
];

/** Builds the text for the `error` prop Mantine's inputs render, from the errors the component should surface.
 * Mantine renders the `error` prop as text, so an empty string has to become `undefined` or the input reserves the
 * space for a message it will never show.
 *
 * @param props - The props of the widget or template, from which `rawErrors` and `hideError` are read
 * @returns - The error text to render, or undefined when there is none
 */
export function visibleErrorText(props: VisibleErrorsProps): string | undefined {
  return getVisibleErrors(props).join('\n') || undefined;
}

export function cleanupOptions<T extends object>(options: T): Omit<T, keyof UIOptionsType> {
  const result = {} as T;
  for (const key in options) {
    if (!uiOptionsKeys.includes(key as keyof UIOptionsType)) {
      result[key] = options[key];
    }
  }
  return result as Omit<T, keyof UIOptionsType>;
}
