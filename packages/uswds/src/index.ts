import Form from './Form';
import generateWidgets from './Widgets';
import generateTemplates from './Templates';
import Theme from './Theme';

// Assign the real widget registry to Theme
const widgets = generateWidgets();
Theme.widgets = widgets;

// Export everything
export { Form, widgets, generateTemplates as templates, Theme };
export default Form;
