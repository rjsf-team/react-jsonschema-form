import Form, { generateForm } from './Form/index.ts';
import Templates, { generateTemplates } from './templates/index.ts';
import Theme, { generateTheme } from './Theme/index.ts';
import Widgets, { generateWidgets } from './widgets/index.ts';

export { Form, Templates, Theme, Widgets, generateForm, generateTemplates, generateTheme, generateWidgets };
export type {
  MantineGlobalUiOptionsKeys,
  MantineGlobalUISchemaOptions,
  MantineUiSchema as UiSchema,
} from './globalUiOptions.ts';

export default Form;
