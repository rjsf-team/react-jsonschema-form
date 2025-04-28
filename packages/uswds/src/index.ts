import Form from './Form';
import widgets from './Widgets'; // Correctly import from the Widgets directory index
import generateTemplates from './Templates';
import Theme from './Theme';

// Assign the imported widgets object to the Theme
Theme.widgets = widgets;

// Export the theme, templates, and potentially the widgets object itself
export { generateTemplates, widgets, Theme }; // Export the widgets object instead
export default Form;
