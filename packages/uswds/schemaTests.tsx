import React from 'react';
import renderer from 'react-test-renderer';
import { RJSFSchema, UiSchema, ValidatorType } from '@rjsf/utils';

export interface SchemaTestOptions {
  name?: string;
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData?: any;
  validator?: ValidatorType;
}

export function createSchemaTest(
  Form: React.ComponentType<any>,
  opts: SchemaTestOptions
) {
  const testName = opts.name || JSON.stringify(opts.schema);
  test(testName, () => {
    const tree = renderer
      .create(
        <Form
          schema={opts.schema}
          uiSchema={opts.uiSchema}
          formData={opts.formData}
          validator={opts.validator}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
}
