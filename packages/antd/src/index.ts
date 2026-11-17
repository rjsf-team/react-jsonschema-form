import Form, { generateForm } from './Form.tsx';
import Templates, { generateTemplates } from './templates/index.ts';
import Theme, { generateTheme } from './Theme.ts';
import Widgets, { generateWidgets } from './widgets/index.ts';

export { Form, Templates, Theme, Widgets, generateForm, generateTemplates, generateTheme, generateWidgets };
export type { AntdFormContext } from './formContext.ts';
export type {
  AntdGlobalUiOptionsKeys,
  AntdGlobalUISchemaOptions,
  AntdUiSchema as UiSchema,
} from './globalUiOptions.ts';

export default Form;
