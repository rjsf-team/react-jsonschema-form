import { ComponentType } from 'react';
import { FormProps, ThemeProps } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';

declare const Theme: ThemeProps;
declare const Form: ComponentType<FormProps<any, RJSFSchema, any>>;

export { Theme as default, Theme };
export { Form };
