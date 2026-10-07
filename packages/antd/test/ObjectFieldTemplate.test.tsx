import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

const schema: RJSFSchema = {
  type: 'object',
  properties: { plain: { type: 'string' }, secret: { type: 'string' } },
};

function getColClasses(uiSchema: UiSchema, colSpan: unknown) {
  const { container } = render(
    <Form schema={schema} uiSchema={uiSchema} validator={validator} formContext={{ colSpan }} />,
  );
  const cols = Array.from(container.querySelectorAll('fieldset .ant-col')).filter((col) =>
    col.querySelector('.ant-form-item'),
  );
  return cols.map((col) => col.className);
}

describe('ObjectFieldTemplate colSpan map', () => {
  it('falls through to the schema type when the widget name is missing from the map', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { string: 12 });
    expect(classes).toHaveLength(2);
    expect(classes[0]).toContain('ant-col-12');
    expect(classes[1]).toContain('ant-col-12');
  });

  it('falls through to the schema type when the field name is missing from the map', () => {
    const classes = getColClasses({ secret: { 'ui:field': 'unknownField' } }, { string: 12 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-12'));
  });

  it('falls back to the default col span when no key matches the map', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { number: 6 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-12'));
  });
});
