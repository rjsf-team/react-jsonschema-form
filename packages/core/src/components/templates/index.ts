import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate.js';
import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate.js';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.js';
import ArrayFieldTemplate from './ArrayFieldTemplate.js';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate.js';
import BaseInputTemplate from './BaseInputTemplate.js';
import ButtonTemplates from './ButtonTemplates/index.js';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate.js';
import DescriptionField from './DescriptionField.js';
import ErrorList from './ErrorList.js';
import FallbackFieldTemplate from './FallbackFieldTemplate.js';
import FieldErrorTemplate from './FieldErrorTemplate.js';
import FieldHelpTemplate from './FieldHelpTemplate.js';
import FieldTemplate from './FieldTemplate/index.js';
import GridTemplate from './GridTemplate.js';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate.js';
import ObjectFieldTemplate from './ObjectFieldTemplate.js';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate.js';
import TitleField from './TitleField.js';
import UnsupportedField from './UnsupportedField.js';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate.js';

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
