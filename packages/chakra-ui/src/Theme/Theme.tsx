import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";
import { WithThemeProps, getDefaultRegistry } from "@rjsf/core";

const { fields, widgets } = getDefaultRegistry();

const Theme: WithThemeProps = {
  ArrayFieldTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  ErrorList,
  fields: { ...fields, ...Fields },
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
