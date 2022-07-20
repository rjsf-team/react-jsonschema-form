import { getDefaultRegistry, WithThemeProps } from "@rjsf/core";

import ArrayFieldTemplate from "../ArrayFieldTemplate";
import ErrorList from "../ErrorList";
import Fields from "../Fields";
import FieldTemplate from "../FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate";
import Widgets from "../Widgets";

const { fields, widgets } = getDefaultRegistry();

/** The Material UI 4 theme, with the `Mui4FormWrapper`
 */
const Theme: WithThemeProps = {
  ArrayFieldTemplate,
  fields: { ...fields, ...Fields },
  FieldTemplate,
  ObjectFieldTemplate,
  widgets: { ...widgets, ...Widgets },
  ErrorList,
};

export default Theme;
