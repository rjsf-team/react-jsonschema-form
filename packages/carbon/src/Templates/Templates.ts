import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';
import AddButton from '../AddButton';
import SubmitButton from '../SubmitButton';
import { MoveDownButton, MoveUpButton, RemoveButton, CopyButton } from '../IconButton';
import FieldTemplate from '../FieldTemplate';
import BaseInputTemplate from '../BaseInputTemplate';
import ObjectFieldTemplate from '../ObjectFieldTemplate';

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Partial<TemplatesType<T, S, F>> {
  return {
    BaseInputTemplate,
    ButtonTemplates: {
      SubmitButton,
      AddButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      CopyButton,
    } as any,
    FieldTemplate,
    ObjectFieldTemplate,
  };
}

export default generateTemplates();
