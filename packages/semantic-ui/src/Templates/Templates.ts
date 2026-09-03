import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import AddButton from '../AddButton/index.ts';
import ArrayFieldItemTemplate from '../ArrayFieldItemTemplate/index.ts';
import ArrayFieldTemplate from '../ArrayFieldTemplate/index.ts';
import BaseInputTemplate from '../BaseInputTemplate/index.ts';
import CyclicSchemaExpandTemplate from '../CyclicSchemaExpandTemplate/index.ts';
import DescriptionField from '../DescriptionField/index.ts';
import ErrorList from '../ErrorList/index.ts';
import FieldErrorTemplate from '../FieldErrorTemplate/index.ts';
import FieldHelpTemplate from '../FieldHelpTemplate/index.ts';
import FieldTemplate from '../FieldTemplate/index.ts';
import GridTemplate from '../GridTemplate/index.ts';
import { CopyButton, MoveDownButton, MoveUpButton, RemoveButton, ClearButton } from '../IconButton/index.ts';
import MultiSchemaFieldTemplate from '../MultiSchemaFieldTemplate/index.ts';
import ObjectFieldTemplate from '../ObjectFieldTemplate/index.ts';
import OptionalDataControlsTemplate from '../OptionalDataControlsTemplate/index.ts';
import SubmitButton from '../SubmitButton/index.ts';
import TitleField from '../TitleField/index.ts';
import WrapIfAdditionalTemplate from '../WrapIfAdditionalTemplate/index.ts';

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

export default generateTemplates();
