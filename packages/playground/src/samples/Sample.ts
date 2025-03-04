import { UiSchema } from '@rjsf/utils';
import { FormProps } from '@rjsf/core';

export type UiSchemaForTheme = (theme: string) => UiSchema;

export interface Sample extends Omit<FormProps, 'validator' | 'uiSchema'> {
  validator?: string;
  uiSchema: FormProps['uiSchema'] | UiSchemaForTheme;
}
