import { WithThemeProps, getDefaultRegistry } from "@rjsf/core";

import Templates from "../Templates";
import Widgets from "../Widgets";

const { fields, templates, widgets } = getDefaultRegistry();

/** The Material UI 5 theme, with the `Mui5FormWrapper
 */
const Theme: WithThemeProps = {
  fields,
  templates: { ...templates, ...Templates },
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
