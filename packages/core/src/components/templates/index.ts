import { TemplatesType } from "@rjsf/utils";

import DescriptionField from "./DescriptionField";
import ErrorList from "./ErrorList";
import FieldTemplate from "./FieldTemplate";
import ObjectFieldTemplate from "./ObjectFieldTemplate";
import TitleField from "./TitleField";

const templates: TemplatesType = {
  DescriptionFieldTemplate: DescriptionField,
  ErrorListTemplate: ErrorList,
  FieldTemplate,
  ObjectFieldTemplate,
  TitleFieldTemplate: TitleField,
};

export default templates;
