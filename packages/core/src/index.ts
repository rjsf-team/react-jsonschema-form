import type { FormProps } from './components/Form.tsx';
import Form from './components/Form.tsx';
import type { FormRef } from './components/FormRef.ts';
import type {
  EventFormData,
  FormStatus,
  IChangeEvent,
  NestedBooleanObject,
  NestedBooleans,
  NestedBooleanValue,
} from './components/IChangeEvent.ts';
import type { RichDescriptionProps } from './components/RichDescription.tsx';
import RichDescription from './components/RichDescription.tsx';
import type { RichHelpProps } from './components/RichHelp.tsx';
import RichHelp from './components/RichHelp.tsx';
import type { SchemaExamplesProps } from './components/SchemaExamples.tsx';
import SchemaExamples from './components/SchemaExamples.tsx';
import type { CoreUiOptionsChecks } from './CoreUiOptionsChecks.ts';
import type { OptionSelectionState } from './hooks/useOptionSelection.ts';
import useOptionSelection from './hooks/useOptionSelection.ts';
import type { ThemedForm, ThemeProps } from './withTheme.tsx';
import withTheme from './withTheme.tsx';

export type {
  EventFormData,
  FormRef,
  FormProps,
  FormStatus,
  IChangeEvent,
  NestedBooleanObject,
  NestedBooleans,
  NestedBooleanValue,
  ThemedForm,
  ThemeProps,
  RichDescriptionProps,
  RichHelpProps,
  SchemaExamplesProps,
  CoreUiOptionsChecks,
  OptionSelectionState,
};

export * from './components/fields/index.ts';
export * from './components/templates/index.ts';
export * from './components/widgets/index.ts';
export { buildRegistry, generateTheme } from './Theme.ts';

export { withTheme, RichDescription, RichHelp, SchemaExamples, useOptionSelection };
export default Form;
