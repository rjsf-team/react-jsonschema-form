import Form from "./Form"; // Assuming Form component exists
import { generateTheme } from "./Theme"; // Import named export
import Theme from "./Theme"; // Import default export

export { default as Form, generateForm } from './Form';
export { default as Templates, generateTemplates } from './Templates';
export { generateTheme, Theme }; // Export both
export { default as Widgets, generateWidgets } from './Widgets';

// If you add specific UiSchema options, export the type here
// export type { UswdsUiSchema as UiSchema } from './utils';

export default Form; // Assuming Form is the main default export
