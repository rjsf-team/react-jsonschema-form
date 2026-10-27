import MuiForm from './MuiForm/index.ts';

export { default as Form, generateForm } from './MuiForm/index.ts';
export { default as Templates, generateTemplates } from './Templates/index.ts';
export { default as Theme, generateTheme } from './Theme/index.ts';
export { default as Widgets, generateWidgets } from './Widgets/index.ts';
export type { MuiBaseInputTemplateProps } from './BaseInputTemplate/BaseInputTemplate.tsx';
export type { MuiGlobalUiOptionsKeys, MuiGlobalUISchemaOptions, MuiUiSchema as UiSchema } from './util.ts';

export default MuiForm;
