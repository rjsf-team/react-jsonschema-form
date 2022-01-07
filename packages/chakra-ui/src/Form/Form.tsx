import { withTheme, FormProps } from "@rjsf/core";

import Theme from "../Theme";
import { ComponentClass, FunctionComponent } from "react";

const Form:
  | ComponentClass<FormProps<any>>
  | FunctionComponent<FormProps<any>> = withTheme(Theme);

export default Form;
