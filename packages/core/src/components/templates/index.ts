import { FormContextType, RJSFSchema, StrictRJSFSchema, TemplatesType } from '@rjsf/utils';

import ArrayFieldDescriptionTemplate from './ArrayFieldDescriptionTemplate';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldItemButtonsTemplate from './ArrayFieldItemButtonsTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate';
import ArrayFieldTitleTemplate from './ArrayFieldTitleTemplate';
import BaseInputTemplate from './BaseInputTemplate';
import ButtonTemplates from './ButtonTemplates';
import DescriptionField from './DescriptionField';
import ErrorList from './ErrorList';
import FieldTemplate from './FieldTemplate';
import FieldErrorTemplate from './FieldErrorTemplate';
import FieldHelpTemplate from './FieldHelpTemplate';
import GridTemplate from './GridTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import TitleField from './TitleField';
import UnsupportedField from './UnsupportedField';
import WrapIfAdditionalTemplate from './WrapIfAdditionalTemplate';

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
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate: ErrorList,
    FieldTemplate,
    FieldErrorTemplate,
    FieldHelpTemplate,
    GridTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate: TitleField,
    UnsupportedFieldTemplate: UnsupportedField,
    WrapIfAdditionalTemplate,
  };
}

export default templates;
