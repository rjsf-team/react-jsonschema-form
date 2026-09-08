import type { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.tsx';
import ArrayFieldTemplate from './ArrayFieldTemplate.tsx';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate.tsx';
import BaseInputTemplate from './BaseInputTemplate.tsx';
import ButtonTemplates from './ButtonTemplates/index.ts';
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
