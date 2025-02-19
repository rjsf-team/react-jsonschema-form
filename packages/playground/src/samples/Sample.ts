import { ValidatorType } from '@rjsf/utils';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { FormProps } from '@rjsf/core';

export interface Sample {
  schema: RJSFSchema;
  formData?: any;
  uiSchema?: UiSchema;
  templates?: any;
  validator: ValidatorType;
}
