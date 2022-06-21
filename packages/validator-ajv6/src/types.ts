import { ErrorSchema, RJSFValidationError } from '@rjsf/utils';

export interface CustomValidatorOptionsType {
  additionalMetaSchemas?: ReadonlyArray<object>;
  customFormats?: { [k: string]: string | RegExp | ((data: string) => boolean) };
}

export interface ValidateFormDataReturnType<T> {
  errors: RJSFValidationError[];
  errorSchema: ErrorSchema<T>;
}
