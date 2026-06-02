import type { FormProps } from '@rjsf/core';
import type { UiSchema } from '@rjsf/utils';

import type { LiveSettings } from '../components/OptionsDrawer';

export type UiSchemaForTheme = (theme: string) => UiSchema;

export interface Sample extends Omit<FormProps, 'validator' | 'uiSchema'> {
  uiSchema?: FormProps['uiSchema'] | UiSchemaForTheme;
  liveSettings?: LiveSettings;
}
