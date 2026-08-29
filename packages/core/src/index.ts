import type { FormProps, FormState, IChangeEvent } from './components/Form.js';
import Form from './components/Form.js';
import type { RichDescriptionProps } from './components/RichDescription.js';
import RichDescription from './components/RichDescription.js';
import type { RichHelpProps } from './components/RichHelp.js';
import RichHelp from './components/RichHelp.js';
import type { SchemaExamplesProps } from './components/SchemaExamples.js';
import SchemaExamples from './components/SchemaExamples.js';
import getDefaultRegistry from './getDefaultRegistry.js';
import getTestRegistry from './getTestRegistry.js';
import type { ThemeProps } from './withTheme.js';
import withTheme from './withTheme.js';

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
