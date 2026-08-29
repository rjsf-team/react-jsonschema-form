import Form from './Form/index.js';

export { default as Form, generateForm } from './Form/index.js';
export { default as Templates, generateTemplates } from './Templates/index.js';
export { default as Theme, generateTheme } from './Theme/index.js';
export { default as Widgets, generateWidgets } from './Widgets/index.js';
export { __createChakraFrameProvider } from './ChakraFrameProvider.js';

export type { ChakraUiSchema as UiSchema } from './utils.js';

export { getChakra } from './utils.js';

export default Form;
