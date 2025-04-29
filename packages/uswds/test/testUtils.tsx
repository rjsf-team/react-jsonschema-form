import { render } from '@testing-library/react';
import { FormProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import Theme from '../src/Theme';
import Form from '../src/Form';

export function createFormComponent<T = any>(props: FormProps<T>) {
  const { schema, uiSchema, formData, ...rest } = props;
  return render(
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      validator={validator}
      theme={Theme} // Pass the theme explicitly if needed
      {...rest}
    />,
  );
}

export function createSandbox() {
  const schema: RJSFSchema = {
    type: 'string',
  };
  return createFormComponent({ schema });
}
