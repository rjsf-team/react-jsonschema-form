import ArrayFieldItemTemplate from '../Templates/ArrayFieldItemTemplate';
import ArrayFieldTemplate from '../Templates/ArrayFieldTemplate';
import BaseInputTemplate from '../Templates/BaseInputTemplate/BaseInputTemplate';
import DescriptionField from '../Templates/DescriptionField';
import ErrorList from '../Templates/ErrorList';
import FieldErrorTemplate from '../Templates/FieldErrorTemplate';
import FieldHelpTemplate from '../Templates/FieldHelpTemplate';
import FieldTemplate from '../Templates/FieldTemplate';
import ObjectFieldTemplate from '../Templates/ObjectFieldTemplate';
import TitleField from '../Templates/TitleField';
import WrapIfAdditionalTemplate from '../Templates/WrapIfAdditionalTemplate';
import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    BaseInputTemplate,
    // ButtonTemplates: {
    //   // CopyButton,
    //   AddButton,
    //   SubmitButton,
    //   CopyButton,
    //   MoveDownButton,
    //   MoveUpButton,
    //   RemoveButton,
    // },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate: TitleField,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
