import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate.tsx';
import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate.tsx';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.tsx';
import ArrayFieldTemplate from './ArrayFieldTemplate.tsx';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate.tsx';
import BaseInputTemplate from './BaseInputTemplate.tsx';
import { generateButtonTemplates } from './ButtonTemplates/index.ts';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate.tsx';
import DescriptionFieldTemplate from './DescriptionField.tsx';
import ErrorListTemplate from './ErrorList.tsx';
import FallbackFieldTemplate from './FallbackFieldTemplate.tsx';
import FieldErrorTemplate from './FieldErrorTemplate.tsx';
import FieldHelpTemplate from './FieldHelpTemplate.tsx';
import FieldTemplate from './FieldTemplate/index.ts';
import GridTemplate from './GridTemplate.tsx';
import MarkdownTemplate from './MarkdownTemplate.tsx';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate.tsx';
import ObjectFieldTemplate from './ObjectFieldTemplate.tsx';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate.tsx';
import TitleFieldTemplate from './TitleField.tsx';
import UnsupportedFieldTemplate from './UnsupportedField.tsx';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate.tsx';

export * from './ButtonTemplates/index.ts';
export {
  ArrayFieldDescriptionTemplate,
  ArrayFieldItemButtonsTemplate,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  ArrayFieldTitleTemplate,
  BaseInputTemplate,
  CyclicSchemaExpandTemplate,
  DescriptionFieldTemplate,
  ErrorListTemplate,
  FallbackFieldTemplate,
  FieldErrorTemplate,
  FieldHelpTemplate,
  FieldTemplate,
  GridTemplate,
  MarkdownTemplate,
  MultiSchemaFieldTemplate,
  ObjectFieldTemplate,
  OptionalDataControlsTemplate,
  TitleFieldTemplate,
  UnsupportedFieldTemplate,
  WrapIfAdditionalTemplate,
};

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): TemplatesType<T, S, F> {
  return {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldItemButtonsTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate,
    ButtonTemplates: generateButtonTemplates<T, S, F>(),
    BaseInputTemplate,
    CyclicSchemaExpandTemplate,
    DescriptionFieldTemplate,
    ErrorListTemplate,
    FallbackFieldTemplate,
    FieldTemplate,
    FieldErrorTemplate,
    FieldHelpTemplate,
    GridTemplate,
    MarkdownTemplate,
    MultiSchemaFieldTemplate,
    ObjectFieldTemplate,
    OptionalDataControlsTemplate,
    TitleFieldTemplate,
    UnsupportedFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}
