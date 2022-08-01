import { WithThemeProps, getDefaultRegistry } from "@rjsf/core";

import Templates from "../Templates";
import Widgets from "../Widgets";

const { fields, templates, widgets } = getDefaultRegistry();

const Theme: WithThemeProps = {
  fields: fields,
  templates: { ...templates, ...Templates },
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
