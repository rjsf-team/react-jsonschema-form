import CoreForm from "@rjsf/core";
import { withTheme } from "@rjsf/core";
import Theme from "../Theme";

const Form: typeof CoreForm = withTheme(Theme);

export default Form;
