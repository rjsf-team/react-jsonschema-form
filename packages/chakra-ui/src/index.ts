import Form from './Form/index.ts';

export { default as Form, generateForm } from './Form/index.ts';
export { default as Templates, generateTemplates } from './Templates/index.ts';
export { default as Theme, generateTheme } from './Theme/index.ts';
export { default as Widgets, generateWidgets } from './Widgets/index.ts';
export { __createChakraFrameProvider } from './ChakraFrameProvider.tsx';

export type { ChakraUiSchema as UiSchema } from './utils.ts';

export { getChakra } from './utils.ts';

export default Form;
