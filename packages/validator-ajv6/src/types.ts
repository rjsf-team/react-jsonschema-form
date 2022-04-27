import { FormProps, FieldErrors, FieldValidation } from '@rjsf/core';

export interface CustomValidatorOptionsType<T = any> {
  additionalMetaSchemas?: FormProps<T>['additionalMetaSchemas'];
  customFormats?: FormProps<T>['customFormats'];
}

export type AjvErrorSchema = FieldErrors & {
  [k: string]: AjvErrorSchema;
};

export type AjvFormValidation = FieldValidation & {
  [fieldName: string]: AjvFormValidation;
};


