import MuiForm from './MuiForm/MuiForm.tsx';

export { default as Form, generateForm } from './MuiForm/index.ts';
export { default as Templates, generateTemplates } from './Templates/index.ts';
export { default as Theme, generateTheme } from './Theme/index.ts';
export { default as Widgets, generateWidgets } from './Widgets/index.ts';
export type { MuiGlobalUiOptionsKeys, MuiGlobalUISchemaOptions, MuiUiSchema as UiSchema } from './util.ts';

export default MuiForm;
