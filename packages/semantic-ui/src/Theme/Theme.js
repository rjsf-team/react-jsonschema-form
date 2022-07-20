import { getDefaultRegistry } from "@rjsf/core";
import { Form as SuiForm } from "semantic-ui-react";
import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";

const { fields, widgets } = getDefaultRegistry();

const Theme = {
  ArrayFieldTemplate,
  ErrorList,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  _internalFormWrapper: SuiForm,
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
