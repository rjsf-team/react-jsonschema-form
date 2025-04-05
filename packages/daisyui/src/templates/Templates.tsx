import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate/ArrayFieldTemplate';
import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate';
import BaseInputTemplate from './BaseInputTemplate/BaseInputTemplate';
import DescriptionField from './DescriptionField';
import ErrorList from './ErrorList';
import FieldErrorTemplate from './FieldErrorTemplate';
import FieldHelpTemplate from './FieldHelpTemplate';
import FieldTemplate from './FieldTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import TitleFieldTemplate from './TitleField/TitleField';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate';

import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import AddButton from './ButtonTemplates/AddButton';
import SubmitButton from './ButtonTemplates/SubmitButton';
import { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } from './ButtonTemplates/IconButton';

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldItemButtonsTemplate,
    BaseInputTemplate,
    ButtonTemplates: {
      AddButton,
      SubmitButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
    },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
