import { TemplatesType } from "@rjsf/utils";

import DescriptionField from "./DescriptionField";
import ErrorList from "./ErrorList";
import FieldTemplate from "./FieldTemplate";
import ObjectFieldTemplate from "./ObjectFieldTemplate";
import TitleField from "./TitleField";

const templates: TemplatesType = {
  DescriptionField,
  ErrorListTemplate: ErrorList,
  FieldTemplate,
  ObjectFieldTemplate,
  TitleField,
};

export default templates;
