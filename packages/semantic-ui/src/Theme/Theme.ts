import { ThemeProps } from "@rjsf/core";
import { Form as SuiForm } from "semantic-ui-react";

import Templates from "../Templates";
import Widgets from "../Widgets";

const Theme: ThemeProps = {
  templates: Templates,
  widgets: Widgets,
  _internalFormWrapper: SuiForm,
};

export default Theme;
