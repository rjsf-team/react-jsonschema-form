import { TemplatesType } from "@rjsf/utils";

import ArrayFieldDescriptionTemplate from "./ArrayFieldDescriptionTemplate";
import ArrayFieldItemTemplate from "./ArrayFieldItemTemplate";
import ArrayFieldTemplate from "./ArrayFieldTemplate";
import ArrayFieldTitleTemplate from "./ArrayFieldTitleTemplate";
import BaseInputTemplate from "./BaseInputTemplate";
import ButtonTemplates from "./ButtonTemplates";
import DescriptionField from "./DescriptionField";
import ErrorList from "./ErrorList";
import FieldTemplate from "./FieldTemplate";
import FieldErrorTemplate from "./FieldErrorTemplate";
import FieldHelpTemplate from "./FieldHelpTemplate";
import ObjectFieldTemplate from "./ObjectFieldTemplate";
import TitleField from "./TitleField";
import UnsupportedField from "./UnsupportedField";
import WrapIfAdditionalTemplate from "./WrapIfAdditionalTemplate";

const templates: TemplatesType = {
  ArrayFieldDescriptionTemplate,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  ArrayFieldTitleTemplate,
  ButtonTemplates,
  BaseInputTemplate,
  DescriptionFieldTemplate: DescriptionField,
  ErrorListTemplate: ErrorList,
  FieldTemplate,
  FieldErrorTemplate,
  FieldHelpTemplate,
  ObjectFieldTemplate,
  TitleFieldTemplate: TitleField,
  UnsupportedFieldTemplate: UnsupportedField,
  WrapIfAdditionalTemplate,
};

export default templates;
