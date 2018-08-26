import Form from "./components/Form";
import fields from "./components/fields";
import widgets from "./components/widgets";
import templates from "./components/templates";
import withTheme from "./components/withTheme";

export { Form, fields, widgets, templates };
export default withTheme("Bootstrap", { widgets, templates });
