import type { UIOptionsType } from '@rjsf/utils';

const uiOptionsKeys: (keyof UIOptionsType)[] = [
  'emptyValue',
  'classNames',
  'style',
  'title',
  'label',
  'help',
  'autofocus',
  'autocomplete',
  'disabled',
  'enumDisabled',
  'enumNames',
  'enumOrder',
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

export function cleanupOptions<T extends object>(options: T): Omit<T, keyof UIOptionsType> {
  const result = {} as T;
  for (const key in options) {
    if (!uiOptionsKeys.includes(key as keyof UIOptionsType)) {
      result[key] = options[key];
    }
  }
  return result as Omit<T, keyof UIOptionsType>;
}
