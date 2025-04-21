import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
} from "@rjsf/utils";
import ArrayFieldDescriptionTemplate from "./ArrayFieldDescriptionTemplate";
import ArrayFieldItemTemplate from "./ArrayFieldItemTemplate";
import ArrayFieldTemplate from "./ArrayFieldTemplate";
import ArrayFieldTitleTemplate from "./ArrayFieldTitleTemplate";
import BaseInputTemplate from "./BaseInputTemplate";
import DescriptionFieldTemplate from "./DescriptionFieldTemplate";
import ErrorListTemplate from "./ErrorListTemplate";
import FieldErrorTemplate from "./FieldErrorTemplate";
import FieldHelpTemplate from "./FieldHelpTemplate";
import FieldTemplate from "./FieldTemplate";
import ObjectFieldTemplate from "./ObjectFieldTemplate";
import TitleFieldTemplate from "./TitleFieldTemplate";
import UnsupportedFieldTemplate from "./UnsupportedFieldTemplate";
import WrapIfAdditionalTemplate from "./WrapIfAdditionalTemplate";
import ButtonTemplates from "./ButtonTemplates"; // Import ButtonTemplates

export function generateTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): TemplatesType<T, S, F> {
  return {
    ArrayFieldDescriptionTemplate,
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    ArrayFieldTitleTemplate,
    BaseInputTemplate,
    ButtonTemplates, // Export ButtonTemplates
    DescriptionFieldTemplate,
    ErrorListTemplate,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate,
    UnsupportedFieldTemplate,
    WrapIfAdditionalTemplate,
  };
}

export default generateTemplates();
