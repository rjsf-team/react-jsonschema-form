import { UiSchema } from '@rjsf/utils';
import { FormProps } from '@rjsf/core';

import { LiveSettings } from '../components/Header';

export type UiSchemaForTheme = (theme: string) => UiSchema;

export interface Sample extends Omit<FormProps, 'validator' | 'uiSchema'> {
  uiSchema?: FormProps['uiSchema'] | UiSchemaForTheme;
  liveSettings?: LiveSettings;
}
