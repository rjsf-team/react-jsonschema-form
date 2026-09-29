import DaisyUIForm from './DaisyUIForm.tsx';
import { ThemeProvider, useTheme } from './theme/index.ts';

export type { DaisyProps } from './types/DaisyProps.ts';
export { default as Form, generateForm } from './DaisyUIForm.tsx';
export { __createDaisyUIFrameProvider } from './DaisyUIFrameProvider.tsx';
export { default as GridTemplate } from './templates/GridTemplate/GridTemplate.tsx';
export { default as Templates, generateTemplates } from './templates/Templates.tsx';
export { getGroupProps } from './utils.ts';
// Re-exported so a consumer's custom daisyui widget reaches the id generators the built-in ones use without a second
// import, and cannot drift from them by hand-building the suffix
export { fieldLabelId, triggerValueId } from '@rjsf/utils';
export { default as Theme, generateTheme } from './theme/index.ts';
export { default as Widgets, generateWidgets } from './widgets/Widgets.tsx';
export { ThemeProvider, useTheme };

export default DaisyUIForm;
