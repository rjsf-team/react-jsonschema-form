import type { FormProps } from '@rjsf/core';
import type { UiSchema } from '@rjsf/utils';

import type { LiveSettings } from '../components/OptionsDrawer.tsx';

export type UiSchemaForTheme = (theme: string) => UiSchema;

export interface Sample extends Omit<FormProps, 'validator' | 'uiSchema' | 'formData'> {
  uiSchema?: FormProps['uiSchema'] | UiSchemaForTheme;
  liveSettings?: LiveSettings;
}
