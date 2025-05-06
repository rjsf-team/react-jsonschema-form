import React from 'react';
import { render } from '@testing-library/react';
// Import FormProps (named) and the default export Form component (aliased) from @rjsf/core
import CoreFormComponent, { FormProps } from '@rjsf/core';
// Define the type based on the imported component
type CoreFormType = typeof CoreFormComponent;
// Keep utils imports
import { RJSFSchema, StrictRJSFSchema, FormContextType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

// Import the potentially non-generic Form from local src
import { Form as LocalForm } from '../src';

// Cast the local Form to the expected generic type from @rjsf/core
const Form = LocalForm as CoreFormType;

export function createFormComponent<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FormProps<T, S, F>) {
  const { schema, uiSchema, formData, validator: propValidator = validator, ...rest } = props;
  return render(
    <Form<T, S, F>
      validator={propValidator as FormProps<T, S, F>['validator']}
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      {...rest}
    />,
  );
}

export function createSandbox() {
  const schema: RJSFSchema = {
    type: 'string',
  };
  return createFormComponent({ schema, validator });
}
