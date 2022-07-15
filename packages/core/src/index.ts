import Form, { FormProps, FormState } from "./components/Form";
import { AddButtonProps } from "./components/AddButton";
import withTheme, { WithThemeProps } from "./withTheme";
import getDefaultRegistry from "./getDefaultRegistry";

export type { AddButtonProps, FormProps, FormState, WithThemeProps };

export { withTheme, getDefaultRegistry };
export default Form;
