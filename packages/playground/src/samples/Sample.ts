import { FormProps } from '@rjsf/core';
import { UiSchema } from '@rjsf/utils';

import { LiveSettings } from '../components/OptionsDrawer';

export type UiSchemaForTheme = (theme: string) => UiSchema;

export interface Sample extends Omit<FormProps, 'validator' | 'uiSchema'> {
  uiSchema?: FormProps['uiSchema'] | UiSchemaForTheme;
  liveSettings?: LiveSettings;
}
