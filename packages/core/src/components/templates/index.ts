import { TemplatesType } from "@rjsf/utils";

import ArrayFieldDescriptionTemplate from "./ArrayFieldDescriptionTemplate";
import ArrayFieldItemTemplate from "./ArrayFieldItemTemplate";
import ArrayFieldTemplate from "./ArrayFieldTemplate";
import ArrayFieldTitleTemplate from "./ArrayFieldTitleTemplate";
import BaseInputTemplate from "./BaseInputTemplate";
import DescriptionField from "./DescriptionField";
import ErrorList from "./ErrorList";
import FieldTemplate from "./FieldTemplate";
import ObjectFieldTemplate from "./ObjectFieldTemplate";
import TitleField from "./TitleField";

const templates: TemplatesType = {
  ArrayFieldDescriptionTemplate,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  ArrayFieldTitleTemplate,
  BaseInputTemplate,
  DescriptionFieldTemplate: DescriptionField,
  ErrorListTemplate: ErrorList,
  FieldTemplate,
  ObjectFieldTemplate,
  TitleFieldTemplate: TitleField,
};

export default templates;
