import Form, { FormProps, FormState, IChangeEvent } from "./components/Form";
import withTheme, { WithThemeProps } from "./withTheme";
import getDefaultRegistry from "./getDefaultRegistry";

export type { FormProps, FormState, IChangeEvent, WithThemeProps };

export { withTheme, getDefaultRegistry };
export default Form;
