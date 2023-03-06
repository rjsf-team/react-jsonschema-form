import Form, { FormProps, FormState, IChangeEvent } from './components/Form';
import withTheme, { ThemeProps } from './withTheme';
import getDefaultRegistry from './getDefaultRegistry';

export type { FormProps, FormState, IChangeEvent, ThemeProps };

export { withTheme, getDefaultRegistry };
export default Form;
