import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate';
import BaseInputTemplate from './BaseInputTemplate';
import ButtonTemplates from './ButtonTemplates';
import DescriptionField from './DescriptionField';
import ErrorList from './ErrorList';
import FieldErrorTemplate from './FieldErrorTemplate';
import FieldHelpTemplate from './FieldHelpTemplate';
import FieldTemplate from './FieldTemplate';
import GridTemplate from './GridTemplate';
import MultiSchemaFieldTemplate from './MultiSchemaFieldTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import OptionalDataControlsTemplate from './OptionalDataControlsTemplate';
import TitleField from './TitleField';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate';

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
