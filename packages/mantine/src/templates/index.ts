import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.js';
import ArrayFieldTemplate from './ArrayFieldTemplate.js';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate.js';
import BaseInputTemplate from './BaseInputTemplate.js';
import ButtonTemplates from './ButtonTemplates/index.js';
import CyclicSchemaExpandTemplate from './CyclicSchemaExpandTemplate.js';
import DescriptionField from './DescriptionField.js';
import ErrorList from './ErrorList.js';
import FieldErrorTemplate from './FieldErrorTemplate.js';
import FieldHelpTemplate from './FieldHelpTemplate.js';
import FieldTemplate from './FieldTemplate.js';
import GridTemplate from './GridTemplate.js';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate.js';
import ObjectFieldTemplate from './ObjectFieldTemplate.js';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate.js';
import TitleField from './TitleField.js';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate.js';

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate,
    BaseInputTemplate,
    CyclicSchemaExpandTemplate,
    ButtonTemplates: ButtonTemplates<T, S, F>(),
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

export default generateTemplates();
