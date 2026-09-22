import type { FormProps, FormState } from './components/Form.tsx';
import Form from './components/Form.tsx';
import type { FormHandle } from './components/FormHandle.ts';
import type { IChangeEvent } from './components/IChangeEvent.ts';
import type { RichDescriptionProps } from './components/RichDescription.tsx';
import RichDescription from './components/RichDescription.tsx';
import type { RichHelpProps } from './components/RichHelp.tsx';
import RichHelp from './components/RichHelp.tsx';
import type { SchemaExamplesProps } from './components/SchemaExamples.tsx';
import SchemaExamples from './components/SchemaExamples.tsx';
import type { CoreUiOptionsChecks } from './CoreUiOptionsChecks.ts';
import type { ThemedForm, ThemeProps } from './withTheme.tsx';
import withTheme from './withTheme.tsx';

export type {
  FormHandle,
  FormProps,
  FormState,
  IChangeEvent,
  ThemedForm,
  ThemeProps,
  RichDescriptionProps,
  RichHelpProps,
  SchemaExamplesProps,
  CoreUiOptionsChecks,
};

export * from './components/fields/index.ts';
export * from './components/templates/index.ts';
export * from './components/widgets/index.ts';
export { buildRegistry, generateTheme } from './Theme.ts';

export { withTheme, RichDescription, RichHelp, SchemaExamples };
export default Form;
