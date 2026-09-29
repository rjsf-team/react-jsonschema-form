import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { bracketNameGenerator } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import WrappedForm from './WrappedForm.tsx';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    password: { type: 'string' },
    time: { type: 'string', format: 'time' },
    color: { type: 'string', format: 'color' },
    file: { type: 'string', format: 'data-url' },
    date: { type: 'string', format: 'date' },
    range: { type: 'integer' },
    textarea: { type: 'string' },
    checkbox: { type: 'boolean' },
  },
};
const uiSchema: UiSchema = {
  password: { 'ui:widget': 'password' },
  range: { 'ui:widget': 'range' },
  textarea: { 'ui:widget': 'textarea' },
};

test.each(Object.keys(schema.properties!))('%s widget names its input by the nameGenerator', (field) => {
  const { container } = render(
    <WrappedForm schema={schema} uiSchema={uiSchema} validator={validator} nameGenerator={bracketNameGenerator} />,
  );

  expect(container.querySelector(`[name="root[${field}]"]`)).toBeInTheDocument();
});

test.each(Object.keys(schema.properties!))(
  '%s widget names its input by its id without a nameGenerator, as the other widgets do',
  (field) => {
    const { container } = render(<WrappedForm schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(container.querySelector(`[name="root_${field}"]`)).toBeInTheDocument();
  },
);

test.each([
  ['with', bracketNameGenerator],
  ['without', undefined],
])("alt-date parts are named by their own ids %s a nameGenerator, as @rjsf/core's are", (_, nameGenerator) => {
  const { container } = render(
    <WrappedForm
      schema={{ type: 'object', properties: { day: { type: 'string' } } }}
      uiSchema={{ day: { 'ui:widget': 'alt-date' } }}
      validator={validator}
      nameGenerator={nameGenerator}
    />,
  );

  expect(Array.from(container.querySelectorAll('[name^="root_day"]'), (el) => el.getAttribute('name'))).toEqual([
    'root_day_year',
    'root_day_month',
    'root_day_day',
  ]);
});
