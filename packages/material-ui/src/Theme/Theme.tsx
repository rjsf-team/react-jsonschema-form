import { getDefaultRegistry, WithThemeProps } from "@rjsf/core";

import Templates from "../Templates";
import Widgets from "../Widgets";

const { fields, templates, widgets } = getDefaultRegistry();

/** The Material UI 4 theme, with the `Mui4FormWrapper`
 */
const Theme: WithThemeProps = {
  fields,
  templates: { ...templates, ...Templates },
  widgets: { ...widgets, ...Widgets },
};

export default Theme;
