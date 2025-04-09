import Form, { FormProps, FormState, IChangeEvent } from './components/Form';
import withTheme, { ThemeProps } from './withTheme';
import getDefaultRegistry from './getDefaultRegistry';
import RatingWidget from './components/widgets/RatingWidget';

export type { FormProps, FormState, IChangeEvent, ThemeProps };

export { withTheme, getDefaultRegistry, RatingWidget };
export default Form;
