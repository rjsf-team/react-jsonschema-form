import { withTheme, FormProps } from "@rjsf/core";

import Theme from "../Theme";
import { FunctionComponent } from "react";

const Form:
    | React.ComponentClass<FormProps<any>>
    | FunctionComponent<FormProps<any>> = withTheme(Theme as any);

export default Form;
