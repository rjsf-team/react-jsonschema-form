import type { UiSchema } from '@rjsf/utils';

import type { DaisyProps } from './types/DaisyProps';

export interface DaisyUiSchema extends Omit<UiSchema, 'ui:options'> {
  'ui:options'?: DaisyUiOptions;
}

type DaisyUiOptions = UiSchema['ui:options'] & { daisy?: DaisyProps };

interface GetDaisyProps {
  uiSchema?: DaisyUiSchema;
}

export function getDaisy({ uiSchema = {} }: GetDaisyProps): DaisyProps {
  const daisyProps = uiSchema['ui:options']?.daisy || {};
  return daisyProps;
}
