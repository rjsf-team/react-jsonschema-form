import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldItemTemplate from './ArrayFieldItemTemplate/index.tsx';
import ArrayFieldTemplate from './ArrayFieldTemplate/index.tsx';
import BaseInputTemplate from './BaseInputTemplate/index.tsx';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate/index.tsx';
import ErrorList from './ErrorList/index.tsx';
import DescriptionField from './FieldDescriptionTemplate/index.tsx';
import FieldErrorTemplate from './FieldErrorTemplate/index.tsx';
import FieldHelpTemplate from './FieldHelpTemplate/index.tsx';
import FieldTemplate from './FieldTemplate/index.tsx';
import GridTemplate from './GridTemplate/index.tsx';
import { AddButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton, ClearButton } from './IconButton/index.tsx';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate/index.tsx';
import ObjectFieldTemplate from './ObjectFieldTemplate/index.tsx';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate/index.tsx';
import SubmitButton from './SubmitButton/index.tsx';
import TitleField from './TitleField/index.tsx';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate/index.tsx';

export function createTemplates() {
  return {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    BaseInputTemplate,
    CyclicSchemaExpandTemplate,
    ButtonTemplates: {
      AddButton,
      CopyButton,
      MoveDownButton,
      MoveUpButton,
      RemoveButton,
      SubmitButton,
      ClearButton,
    },
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    GridTemplate,
    MultiSchemaFieldTemplate,
    ObjectFieldTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate: TitleField,
    WrapIfAdditionalTemplate,
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
