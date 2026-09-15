import type { FormProps, FormState, IChangeEvent } from './components/Form.tsx';
import Form from './components/Form.tsx';
import type { RichDescriptionProps } from './components/RichDescription.tsx';
import RichDescription from './components/RichDescription.tsx';
import type { RichHelpProps } from './components/RichHelp.tsx';
import RichHelp from './components/RichHelp.tsx';
import type { SchemaExamplesProps } from './components/SchemaExamples.tsx';
import SchemaExamples from './components/SchemaExamples.tsx';
import type { ThemeProps } from './withTheme.tsx';
import withTheme from './withTheme.tsx';

export type {
  FormProps,
  FormState,
  IChangeEvent,
  ThemeProps,
  RichDescriptionProps,
  RichHelpProps,
  SchemaExamplesProps,
};

export * from './components/fields/index.ts';
export * from './components/templates/index.ts';
export * from './components/widgets/index.ts';
export { buildRegistry, generateTheme } from './Theme.ts';

export { withTheme, RichDescription, RichHelp, SchemaExamples };
export default Form;
