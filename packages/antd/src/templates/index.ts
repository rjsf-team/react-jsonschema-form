import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldItemTemplate from './ArrayFieldItemTemplate/index.js';
import ArrayFieldTemplate from './ArrayFieldTemplate/index.js';
import BaseInputTemplate from './BaseInputTemplate/index.js';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate/index.js';
import ErrorList from './ErrorList/index.js';
import DescriptionField from './FieldDescriptionTemplate/index.js';
import FieldErrorTemplate from './FieldErrorTemplate/index.js';
import FieldTemplate from './FieldTemplate/index.js';
import GridTemplate from './GridTemplate/index.js';
import { AddButton, CopyButton, MoveDownButton, MoveUpButton, RemoveButton, ClearButton } from './IconButton/index.js';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate/index.js';
import ObjectFieldTemplate from './ObjectFieldTemplate/index.js';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate/index.js';
import SubmitButton from './SubmitButton/index.js';
import TitleField from './TitleField/index.js';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate/index.js';

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): Partial<TemplatesType<T, S, F>> {
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
    FieldTemplate,
    GridTemplate,
    MultiSchemaFieldTemplate,
    ObjectFieldTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate: TitleField,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
