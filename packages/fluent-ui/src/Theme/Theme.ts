import Templates from "../Templates";
import Widgets from "../Widgets";

import { WithThemeProps, getDefaultRegistry } from "@rjsf/core";

const { fields, templates, widgets } = getDefaultRegistry();

const Theme: WithThemeProps = {
  fields,
  templates: { ...templates, ...Templates },
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
