import { getDefaultRegistry } from "@rjsf/core";
import { Form as SuiForm } from "semantic-ui-react";
import Templates from "../Templates";
import Widgets from "../Widgets";

const { fields, templates, widgets } = getDefaultRegistry();

const Theme = {
  fields,
  templates: { ...templates, ...Templates },
  widgets: { ...widgets, ...Widgets },
  _internalFormWrapper: SuiForm,
};

export default Theme;
