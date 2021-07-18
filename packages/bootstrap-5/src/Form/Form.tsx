import { withTheme, FormProps } from "@rjsf/core";

import Theme from "../Theme";
import { StatelessComponent } from "react";

const Form:
  | React.ComponentClass<FormProps<any>>
  | StatelessComponent<FormProps<any>> = withTheme(Theme);

export default Form;
