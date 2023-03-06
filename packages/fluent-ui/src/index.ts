import { initializeIcons } from '@fluentui/react';
import FuiForm from './FuiForm/';

export { default as Form, generateForm } from './FuiForm';
export { default as Templates, generateTemplates } from './Templates';
export { default as Theme, generateTheme } from './Theme';
export { default as Widgets, generateWidgets } from './Widgets';

initializeIcons();

export default FuiForm;
