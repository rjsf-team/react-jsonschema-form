import { withTheme, FormProps } from "@rjsf/core";
import { ComponentClass, FunctionComponent } from "react";

const Form:
    | ComponentClass<FormProps<any>>
    | FunctionComponent<FormProps<any>> = withTheme(Theme as any);

export default Form;
