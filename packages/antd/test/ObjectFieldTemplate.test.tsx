import type { RegistryFieldsType, RegistryWidgetsType, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

const schema: RJSFSchema = {
  type: 'object',
  properties: { plain: { type: 'string' }, secret: { type: 'string' } },
};

function getColClasses(
  uiSchema: UiSchema,
  colSpan: unknown,
  formSchema: RJSFSchema = schema,
  fields?: RegistryFieldsType,
  widgets?: RegistryWidgetsType,
) {
  const { container } = render(
    <Form
      schema={formSchema}
      uiSchema={uiSchema}
      validator={validator}
      formContext={{ colSpan }}
      fields={fields}
      widgets={widgets}
    />,
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
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const classes = getColClasses({ secret: { 'ui:field': 'unknownField' } }, { string: 8 });
      expect(classes).toHaveLength(2);
      classes.forEach((c) => expect(c).toContain('ant-col-8'));
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `ui:field for "root_secret" (secret) names no registered field ('unknownField'), so it is ignored and the ` +
          'field is rendered as though no ui:field were given.',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('falls through to the schema type when the map entry for the widget is null', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { password: null, string: 8 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  it('falls through to the schema type when the map entry for the widget is not a number', () => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { password: true, string: 8 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  it('ignores the map entry for a ui:field that names no registered field', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const classes = getColClasses({ secret: { 'ui:field': 'unknownField' } }, { unknownField: 4, string: 8 });
      expect(classes).toHaveLength(2);
      classes.forEach((c) => expect(c).toContain('ant-col-8'));
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `ui:field for "root_secret" (secret) names no registered field ('unknownField'), so it is ignored and the ` +
          'field is rendered as though no ui:field were given.',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('ignores prototype keys such as toString when looking up the map', () => {
    const ToStringWidget = (props: WidgetProps) => <input id={props.id} />;
    const classes = getColClasses({ secret: { 'ui:widget': 'toString' } }, { string: 8 }, schema, undefined, {
      toString: ToStringWidget,
    });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  it('ignores the map entry for a ui:field whose registered value is not a component', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // `fields` is typed to hold only components, which is what `SchemaField` checks at runtime
      const fields = { myField: 'notAComponent' } as unknown as RegistryFieldsType;
      const classes = getColClasses({ secret: { 'ui:field': 'myField' } }, { myField: 6, string: 8 }, schema, fields);
      expect(classes).toHaveLength(2);
      classes.forEach((c) => expect(c).toContain('ant-col-8'));
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `ui:field for "root_secret" (secret) names a registered field ('myField') that is not a component (got ` +
          'string), so it is ignored and the field is rendered as though no ui:field were given.',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('matches a type list by the type whose field renders its widget', () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { plain: { type: 'string' }, mixed: { type: ['null', 'number', 'string'] } },
        }}
        uiSchema={{ mixed: { 'ui:widget': 'textarea' } }}
        validator={validator}
        formContext={{ colSpan: { string: 8, number: 4 } }}
      />,
    );
    const cols = container.querySelectorAll('fieldset > .ant-row > .ant-col');
    expect(cols).toHaveLength(2);
    cols.forEach((col) => expect(col).toHaveClass('ant-col-8'));
    expect(cols[1].querySelector('textarea')).toBeInTheDocument();
  });

  it.each([NaN, Infinity, -1, 25, 1.5])('falls through a map entry of %s, which is not a column span', (span) => {
    const classes = getColClasses({ secret: { 'ui:widget': 'password' } }, { password: span, string: 8 });
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  it.each([NaN, 25])('falls back to the default col span for a colSpan of %s', (span) => {
    const classes = getColClasses({}, span);
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-12'));
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

  it('keys a $ref property by the widget from its ui:definitions entry', () => {
    const refSchema: RJSFSchema = {
      type: 'object',
      definitions: { longText: { type: 'string' } },
      properties: { bio: { $ref: '#/definitions/longText' }, name: { type: 'string' } },
    };
    const classes = getColClasses(
      { 'ui:definitions': { '#/definitions/longText': { 'ui:widget': 'textarea' } } },
      { textarea: 24, string: 8 },
      refSchema,
    );
    expect(classes).toHaveLength(2);
    expect(classes[0]).toContain('ant-col-24');
    expect(classes[1]).toContain('ant-col-8');
  });

  it('keys an allOf property by its merged type', () => {
    const allOfSchema: RJSFSchema = {
      type: 'object',
      properties: { name: { allOf: [{ type: 'string' }, { minLength: 1 }] }, other: { type: 'string' } },
    };
    const classes = getColClasses({}, { string: 8 }, allOfSchema);
    expect(classes).toHaveLength(2);
    classes.forEach((c) => expect(c).toContain('ant-col-8'));
  });

  describe('a property whose type depends on its form data', () => {
    const textOrNumber: RJSFSchema = { if: { const: 'text' }, then: { type: 'string' }, else: { type: 'number' } };
    const getSpan = (formSchema: RJSFSchema, formData: unknown) => {
      const { container } = render(
        <Form
          schema={formSchema}
          validator={validator}
          initialFormData={formData}
          formContext={{ colSpan: { string: 8, number: 4 } }}
        />,
      );
      return container.querySelector('fieldset > .ant-row > .ant-col')!.className;
    };

    it('is keyed by the type its form data selects', () => {
      const formSchema: RJSFSchema = { type: 'object', properties: { pet: textOrNumber, other: { type: 'boolean' } } };
      expect(getSpan(formSchema, { pet: 'text' })).toContain('ant-col-8');
    });

    it('does not read an inherited member as the form data of a property named after it', () => {
      // A function is none of the JSON types, so `Object.prototype.constructor` read as the form data selects `then`
      const notJson: RJSFSchema = {
        if: { not: { type: ['string', 'number', 'boolean', 'null', 'array', 'object'] } },
        then: { type: 'string' },
        else: { type: 'number' },
      };
      const formSchema: RJSFSchema = {
        type: 'object',
        properties: { constructor: notJson, other: { type: 'boolean' } },
      };
      expect(getSpan(formSchema, {})).toContain('ant-col-4');
      expect(document.querySelector('#root_constructor')).toHaveAttribute('role', 'spinbutton');
    });
  });
});
