import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";
import { utils } from "@rjsf/core";
import { ThemeProps } from "../utils";

const { getDefaultRegistry } = utils;

const { fields, widgets } = getDefaultRegistry();


const Theme: ThemeProps = {
  ArrayFieldTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  ErrorList,
  fields: { ...fields, ...Fields },
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
