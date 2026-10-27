import DaisyUIForm from './DaisyUIForm.tsx';
import { ThemeProvider, useTheme } from './theme/index.ts';

export { generateClassMap } from './classMap.ts';
export type { DaisyProps } from './types/DaisyProps.ts';
export type { DaisyGlobalUiOptionsKeys, DaisyGlobalUISchemaOptions, DaisyUiSchema as UiSchema } from './utils.ts';
export { default as Form, generateForm } from './DaisyUIForm.tsx';
export { __createDaisyUIFrameProvider } from './DaisyUIFrameProvider.tsx';
export { default as GridTemplate } from './templates/GridTemplate/index.ts';
export { default as Templates, generateTemplates } from './templates/index.ts';
export { getGroupAndOptionProps, getGroupProps } from './utils.ts';
// Re-exported for a replacement `FieldTemplate` or a widget rendered without a plan, which name their label by it rather
// than hand-building the suffix. Under a plan the label's id is the plan's, which `getLabelId()` reads, so a custom
// group widget takes its props from `getGroupProps()` or `getGroupAndOptionProps()`, which follow it
export { fieldLabelId } from '@rjsf/utils';
export { default as Theme, generateTheme } from './theme/index.ts';
export { default as Widgets, generateWidgets } from './widgets/index.ts';
export { ThemeProvider, useTheme };

export default DaisyUIForm;
