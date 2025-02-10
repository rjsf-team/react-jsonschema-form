import ArrayFieldItemTemplate from '../templates/ArrayFieldItemTemplate';
import ArrayFieldTemplate from '../templates/ArrayFieldTemplate/ArrayFieldTemplate';
import BaseInputTemplate from '../templates/BaseInputTemplate/BaseInputTemplate';
import DescriptionField from '../templates/DescriptionField';
import ErrorList from '../templates/ErrorList';
import FieldErrorTemplate from '../templates/FieldErrorTemplate';
import FieldHelpTemplate from '../templates/FieldHelpTemplate';
import FieldTemplate from '../templates/FieldTemplate';
import ObjectFieldTemplate from '../templates/ObjectFieldTemplate';
import TitleFieldTemplate from '../templates/TitleField/TitleField';
import WrapIfAdditionalTemplate from '../templates/WrapIfAdditionalTemplate';

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
