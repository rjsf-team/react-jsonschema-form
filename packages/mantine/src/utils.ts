import { UIOptionsType } from '@rjsf/utils';

const uiOptionsKeys: Array<keyof UIOptionsType> = [
  'emptyValue',
  'classNames',
  'title',
  'help',
  'autocomplete',
  'disabled',
  'enumDisabled',
  'hideError',
  'readonly',
  'order',
  'filePreview',
  'inline',
  'inputType',
  'submitButtonOptions',
  'widget',
  'enumNames',
  'addable',
  'copyable',
  'orderable',
  'removable',
  'duplicateKeySuffixSeparator',
  'enumOptions',
  'enableMarkdownInDescription',
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
