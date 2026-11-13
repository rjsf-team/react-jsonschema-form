import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.tsx';
import ArrayFieldTemplate from './ArrayFieldTemplate.tsx';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate.tsx';
import BaseInputTemplate from './BaseInputTemplate.tsx';
import AddButton from './ButtonTemplates/AddButton.tsx';
import { ClearButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton } from './ButtonTemplates/IconButton.tsx';
import SubmitButton from './ButtonTemplates/SubmitButton.tsx';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate.tsx';
import DescriptionField from './DescriptionField.tsx';
import ErrorList from './ErrorList.tsx';
import FieldErrorTemplate from './FieldErrorTemplate.tsx';
import FieldHelpTemplate from './FieldHelpTemplate.tsx';
import FieldTemplate from './FieldTemplate.tsx';
import GridTemplate from './GridTemplate.tsx';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate.tsx';
import ObjectFieldTemplate from './ObjectFieldTemplate.tsx';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate.tsx';
import TitleField from './TitleField.tsx';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate.tsx';

export function createTemplates() {
  return {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate,
    BaseInputTemplate,
    CyclicSchemaExpandTemplate,
    ButtonTemplates: {
      SubmitButton,
      AddButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      ClearButton,
    },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldErrorTemplate,
    FieldTemplate,
    FieldHelpTemplate,
    GridTemplate,
    ObjectFieldTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate: TitleField,
    WrapIfAdditionalTemplate,
    MultiSchemaFieldTemplate,
  };
}

export function generateTemplates<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): Partial<TemplatesType<T, S, F>> {
  return createTemplates();
}

export default createTemplates();
