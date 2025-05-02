import Form, { FormProps, FormState, IChangeEvent } from './components/Form';
import RichDescription, { RichDescriptionProps } from './components/RichDescription';
import withTheme, { ThemeProps } from './withTheme';
import getDefaultRegistry from './getDefaultRegistry';

export type { FormProps, FormState, IChangeEvent, ThemeProps, RichDescriptionProps };

export { withTheme, getDefaultRegistry, RichDescription };
export default Form;
