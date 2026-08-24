import type { FormProps, FormState, IChangeEvent } from './components/Form';
import Form from './components/Form';
import type { RichDescriptionProps } from './components/RichDescription';
import RichDescription from './components/RichDescription';
import type { RichHelpProps } from './components/RichHelp';
import RichHelp from './components/RichHelp';
import type { SchemaExamplesProps } from './components/SchemaExamples';
import SchemaExamples from './components/SchemaExamples';
import getDefaultRegistry from './getDefaultRegistry';
import getTestRegistry from './getTestRegistry';
import type { ThemeProps } from './withTheme';
import withTheme from './withTheme';

export type {
  FormProps,
  FormState,
  IChangeEvent,
  ThemeProps,
  RichDescriptionProps,
  RichHelpProps,
  SchemaExamplesProps,
};

// The bundle size of the `Form`-only import path is guarded by the size-limit check.
// An export added here that pulls in a heavy dependency goes unmeasured until it gets
// its own check in .size-limit.json.
export { withTheme, getDefaultRegistry, getTestRegistry, RichDescription, RichHelp, SchemaExamples };
export default Form;
