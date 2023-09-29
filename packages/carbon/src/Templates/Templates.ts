import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';
import SubmitButton from '../SubmitButton';

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ButtonTemplates: {
      SubmitButton,
    } as any,
  };
}

export default generateTemplates();
