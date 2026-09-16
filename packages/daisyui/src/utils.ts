import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';

import type { DaisyProps } from './types/DaisyProps.ts';

export interface DaisyUiSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> extends Omit<UiSchema<T, S, F>, 'ui:options'> {
  'ui:options'?: DaisyUiOptions<T, S, F>;
}

type DaisyUiOptions<T, S extends StrictRJSFSchema, F extends FormContextType> = UiSchema<T, S, F>['ui:options'] & {
  daisy?: DaisyProps;
};

interface GetDaisyProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  uiSchema?: DaisyUiSchema<T, S, F>;
}

export function getDaisy<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema = {},
}: GetDaisyProps<T, S, F>): DaisyProps {
  const daisyProps = uiSchema['ui:options']?.daisy || {};
  return daisyProps;
}
