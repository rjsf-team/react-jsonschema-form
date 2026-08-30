import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate.tsx';
import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate.tsx';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.tsx';
import ArrayFieldTemplate from './ArrayFieldTemplate.tsx';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate.tsx';
import BaseInputTemplate from './BaseInputTemplate.tsx';
import ButtonTemplates from './ButtonTemplates/index.ts';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate.tsx';
import DescriptionField from './DescriptionField.tsx';
import ErrorList from './ErrorList.tsx';
import FallbackFieldTemplate from './FallbackFieldTemplate.tsx';
import FieldErrorTemplate from './FieldErrorTemplate.tsx';
import FieldHelpTemplate from './FieldHelpTemplate.tsx';
import FieldTemplate from './FieldTemplate/index.ts';
import GridTemplate from './GridTemplate.tsx';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate.tsx';
import ObjectFieldTemplate from './ObjectFieldTemplate.tsx';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate.tsx';
import TitleField from './TitleField.tsx';
import UnsupportedField from './UnsupportedField.tsx';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate.tsx';

function templates<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(): TemplatesType<
  T,
  S,
  F
> {
  return {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldItemButtonsTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate,
    ButtonTemplates: ButtonTemplates<T, S, F>(),
    BaseInputTemplate,
    CyclicSchemaExpandTemplate,
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FallbackFieldTemplate,
    FieldTemplate,
    FieldErrorTemplate,
    FieldHelpTemplate,
    GridTemplate,
    MultiSchemaFieldTemplate,
    ObjectFieldTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate: TitleField,
    UnsupportedFieldTemplate: UnsupportedField,
    WrapIfAdditionalTemplate,
  };
}

export default templates;
