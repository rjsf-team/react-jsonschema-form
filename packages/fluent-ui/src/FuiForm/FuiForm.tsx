import CoreForm from "@rjsf/core";
import { withTheme } from "@rjsf/core";
import Theme from "../Theme";

const FuiForm: typeof CoreForm = withTheme(Theme);

export default FuiForm;
