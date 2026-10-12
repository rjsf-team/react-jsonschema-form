import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

const schema: RJSFSchema = {
  type: 'object',
  properties: { plain: { type: 'string' }, secret: { type: 'string' } },
};

function getColClasses(uiSchema: UiSchema, colSpan: unknown, formSchema: RJSFSchema = schema) {
  const { container } = render(
    <Form schema={formSchema} uiSchema={uiSchema} validator={validator} formContext={{ colSpan }} />,
  );
  const rootFieldset = container.querySelector('fieldset');
  const cols = rootFieldset ? Array.from(rootFieldset.querySelectorAll(':scope > .ant-row > .ant-col')) : [];
  return cols.map((col) => col.className);
}

describe('ObjectFieldTemplate colSpan map', () => {
  it('falls through to the schema type when the widget name is missing from the map', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { string: 8 });
    expect(classes).toHaveLength(2);
    expect(classes[0]).toContain('ant-col-8');
    expect(classes[1]).toContain('ant-col-8');
  });

  it('falls through to the schema type when the field name is missing from the map', () => {
    const classes = getColClasses({ secret: { 'ui:field': 'unknownField' } }, { string: 8 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  it('falls through to the schema type when the map entry for the widget is null', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { password: null, string: 8 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  it('ignores prototype keys such as toString when looking up the map', () => {
    const classes = getColClasses({ secret: { 'ui:field': 'toString' } }, { string: 8 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  it('prefers the widget entry over the schema type entry', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { password: 6, string: 8 });
    expect(classes).toHaveLength(2);
    expect(classes[0]).toContain('ant-col-8');
    expect(classes[1]).toContain('ant-col-6');
  });

  it('falls back to the default col span when no key matches the map', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { number: 6 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-12'));
  });

  it('matches a nullable type against its non-null type in the map', () => {
    const classes = getColClasses(
      {},
      { string: 8 },
      {
        type: 'object',
        properties: { plain: { type: 'string' }, secret: { type: ['string', 'null'] } },
      },
    );
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  it('gives a nested object declared only by its properties the full default width', () => {
    const classes = getColClasses(
      {},
      { number: 6 },
      {
        type: 'object',
        properties: { plain: { type: 'string' }, nested: { properties: { inner: { type: 'string' } } } },
      },
    );
    expect(classes).toHaveLength(2);
    expect(classes[0]).toContain('ant-col-12');
    expect(classes[1]).toContain('ant-col-24');
  });

  it('gives the only visible property the full default width when the others are hidden', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'hidden' } }, { number: 6 });
    expect(classes).toHaveLength(1);
    expect(classes[0]).toContain('ant-col-24');
  });
});
