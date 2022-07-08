import React, { ForwardedRef, forwardRef } from 'react';
import { RegistryFieldsType, RegistryWidgetsType } from '@rjsf/utils';

import Form, { FormProps } from './components/Form';

export type WithThemeProps<T = any, F = any> = {
  fields:  RegistryFieldsType<T, F>;
  widgets: RegistryWidgetsType<T, F>;
} & Pick<
  FormProps,
  'ArrayFieldTemplate' | 'ObjectFieldTemplate' | 'FieldTemplate' | 'ErrorList' | '_internalFormWrapper'
>

export default function withTheme<T = any, F = any>(themeProps: WithThemeProps<T, F>) {
  return forwardRef(({ fields, widgets, ...directProps }: FormProps<T, F>, ref: ForwardedRef<Form<T, F>>) => {
    fields = { ...themeProps.fields, ...fields };
    widgets = { ...themeProps.widgets, ...widgets };

    return (
      <Form
        {...themeProps}
        {...directProps}
        fields={fields}
        widgets={widgets}
        ref={ref}
      />
    );
  });
}
