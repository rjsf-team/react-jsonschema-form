import Form, { FormProps, FormState, IChangeEvent } from './components/Form';
import RichDescription, { RichDescriptionProps } from './components/RichDescription';
import RichHelp, { RichHelpProps } from './components/RichHelp';
import SchemaExamples, { SchemaExamplesProps } from './components/SchemaExamples';
import withTheme, { ThemeProps } from './withTheme';
import getDefaultRegistry from './getDefaultRegistry';
import getTestRegistry from './getTestRegistry';

export type {
  FormProps,
  FormState,
  IChangeEvent,
  ThemeProps,
  RichDescriptionProps,
  RichHelpProps,
  SchemaExamplesProps,
};

export { withTheme, getDefaultRegistry, getTestRegistry, RichDescription, RichHelp, SchemaExamples };
export default Form;
