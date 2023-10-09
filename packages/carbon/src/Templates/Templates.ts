import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';
import AddButton from '../AddButton';
import SubmitButton from '../SubmitButton';
import { MoveDownButton, MoveUpButton, RemoveButton, CopyButton } from '../IconButton';
import FieldTemplate from '../FieldTemplate';
import BaseInputTemplate from '../BaseInputTemplate';
import ObjectFieldTemplate from '../ObjectFieldTemplate';
import FieldHelpTemplate from '../FieldHelpTemplate';
import DescriptionField from '../DescriptionField';
import FieldErrorTemplate from '../FieldErrorTemplate';
import TitleField from '../TitleField';
import ArrayFieldTemplate from '../ArrayFieldTemplate';
import ArrayFieldItemTemplate from '../ArrayFieldItemTemplate';
import ErrorList from '../ErrorList';
import WrapIfAdditionalTemplate from '../WrapIfAdditionalTemplate';

/** Generates a set of templates `carbon` theme uses.
 */
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
    },
    TitleFieldTemplate: TitleField,
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldErrorTemplate,
    FieldTemplate,
    FieldHelpTemplate,
    ObjectFieldTemplate,
    ArrayFieldTemplate,
    ArrayFieldItemTemplate,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
