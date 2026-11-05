import type { FieldProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import { fieldPathToId, getByPath, toFieldPath } from '@rjsf/utils';
import { cleanup, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createFormComponent, fieldErrorsById, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

const NIL: RJSFSchema = { title: 'Nil', type: 'null' };
const OBJ: RJSFSchema = { title: 'Obj', type: 'object', properties: { a: { type: 'string' } } };
const OTHER: RJSFSchema = { title: 'Other', type: 'object', properties: { b: { type: 'string' } } };

function entries(entry: RJSFSchema): RJSFSchema {
  return { type: 'object', additionalProperties: entry };
}

function plainUiSchema(entry: UiSchema = {}): UiSchema {
  return { additionalProperties: entry };
}

function gridUiSchema(entry: UiSchema = {}): UiSchema {
  return {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['extra'] }] },
    extra: entry,
  };
}

function selector(index = 0) {
  return screen.getAllByRole('combobox')[index];
}

function optionalControls(node: Element) {
  return Array.from(node.querySelectorAll('button')).filter((button) => button.id.includes('__optional'));
}

describe.each<[string, (entry?: UiSchema) => UiSchema]>([
  ['a plain additionalProperties entry', plainUiSchema],
  ['a layout grid cell named by an additionalProperties key', gridUiSchema],
])('%s', (_title, uiSchemaFor) => {
  describe('switched to a null option', () => {
    it.each<[string, RJSFSchema, unknown]>([
      ['a number', { title: 'Num', type: 'number' }, 5],
      ['a string', { title: 'Text', type: 'string' }, 'abc'],
      ['an object', OBJ, { a: 'A' }],
    ])('is stored as null from %s option, submits and reloads on that option', async (_from, option, held) => {
      const schema = entries({ anyOf: [option, NIL] });
      const uiSchema = uiSchemaFor();
      const { node, onChange, onSubmit } = createFormComponent({ schema, initialFormData: { extra: held }, uiSchema });

      await user.selectOptions(selector(), 'Nil');

      const { formData } = onChange.mock.lastCall![0];
      expect(formData).toStrictEqual({ extra: null });
      await submitForm(node, user);
      expect(onSubmit).toHaveBeenCalledTimes(1);
      cleanup();
      createFormComponent({ schema, initialFormData: JSON.parse(JSON.stringify(formData)), uiSchema });
      expect(selector()).toHaveDisplayValue('Nil');
    });

    it('is stored as null for an option whose one enum value is null', async () => {
      const { node, onChange, onSubmit } = createFormComponent({
        schema: entries({
          anyOf: [
            { title: 'Num', type: 'number' },
            { title: 'Nil', enum: [null] },
          ],
        }),
        initialFormData: { extra: 5 },
        uiSchema: uiSchemaFor(),
      });

      await user.selectOptions(selector(), 'Nil');

      expect(onChange.mock.lastCall![0].formData).toStrictEqual({ extra: null });
      await submitForm(node, user);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('with the Optional Data Controls turned on', () => {
    const globalOptions = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object' as const] } };

    it.each<[string, UiSchema]>([
      ['a uiSchema entry of its own', { anyOf: [{ a: {} }, { b: {} }] }],
      ['a uiSchema entry turning them on', { anyOf: [{ 'ui:enableOptionalDataFieldForType': ['object'] }, {}] }],
    ])('shows none for an option with %s', (_kind, entry) => {
      const { node } = createFormComponent({
        schema: entries({ anyOf: [OBJ, OTHER] }),
        initialFormData: { extra: { a: 'A' } },
        uiSchema: { ...uiSchemaFor(entry), ...globalOptions },
      });

      expect(optionalControls(node)).toHaveLength(0);
    });

    it('shows none for an option nested in an option with a uiSchema entry of its own', () => {
      const { node } = createFormComponent({
        schema: entries({ anyOf: [{ title: 'Outer', anyOf: [OBJ, OTHER] }] }),
        initialFormData: { extra: { a: 'A' } },
        uiSchema: { ...uiSchemaFor({ anyOf: [{ anyOf: [{}, {}] }] }), ...globalOptions },
      });

      expect(optionalControls(node)).toHaveLength(0);
    });

    it('shows none for an option a ui:definitions entry describes', () => {
      const { node } = createFormComponent({
        schema: {
          ...entries({ anyOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] }),
          definitions: { A: OBJ, B: OTHER },
        },
        initialFormData: { extra: { a: 'A' } },
        uiSchema: {
          ...uiSchemaFor(),
          ...globalOptions,
          'ui:definitions': { '#/definitions/A': { 'ui:title': 'AA' }, '#/definitions/B': { 'ui:title': 'BB' } },
        },
      });

      expect(optionalControls(node)).toHaveLength(0);
    });

    it.each<[string, RJSFSchema, unknown]>([
      ['an anyOf', { anyOf: [OBJ, OTHER] }, { a: 'A' }],
      ['an object', OBJ, { a: 'A' }],
      ['an array', { type: 'array', items: { type: 'string' } }, ['x']],
    ])('shows none for %s, whichever way they are turned on', (_kind, entry, held) => {
      const enabled: ('array' | 'object')[] = ['object', 'array'];
      const uiSchemas: UiSchema[] = [
        { ...uiSchemaFor(), 'ui:globalOptions': { enableOptionalDataFieldForType: enabled } },
        uiSchemaFor({ 'ui:enableOptionalDataFieldForType': enabled }),
        uiSchemaFor({ 'ui:options': { enableOptionalDataFieldForType: enabled } }),
      ];
      uiSchemas.forEach((uiSchema) => {
        const { node } = createFormComponent({ schema: entries(entry), initialFormData: { extra: held }, uiSchema });

        expect(optionalControls(node)).toHaveLength(0);
        cleanup();
      });
    });

    it('keeps them for an object declared inside the entry', () => {
      const { node } = createFormComponent({
        schema: entries({ type: 'object', properties: { inner: OBJ } }),
        initialFormData: { extra: { inner: { a: 'A' } } },
        uiSchema: { ...uiSchemaFor(), 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
      });

      expect(optionalControls(node).map((button) => button.id)).toStrictEqual(['root_extra_inner__optionalRemove']);
    });

    it('renders the fields of an object holding null, with no Add to reach them through', () => {
      const { node } = createFormComponent({
        schema: entries({ type: ['object', 'null'], properties: { a: { type: 'string', title: 'A' } } }),
        initialFormData: { extra: null },
        uiSchema: { ...uiSchemaFor(), 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
      });

      expect(optionalControls(node)).toHaveLength(0);
      expect(screen.getByRole('textbox', { name: 'A' })).toBeInTheDocument();
    });
  });

  it('stays on an option nested in its option that is switched to, when the switch holds nothing', async () => {
    const { onChange } = createFormComponent({
      schema: entries({
        anyOf: [
          {
            title: 'Scalar',
            anyOf: [
              { title: 'Text', type: 'string' },
              { title: 'Count', type: 'number' },
            ],
          },
          { title: 'Flag', type: 'boolean' },
        ],
      }),
      initialFormData: { extra: 'abc' },
      uiSchema: uiSchemaFor(),
    });

    await user.selectOptions(selector(1), 'Count');

    expect(onChange.mock.lastCall![0].formData).toStrictEqual({ extra: '' });
    expect(selector(1)).toHaveDisplayValue('Count');
  });

  it('reaches every type of the fallback UI an option renders, once cleared', async () => {
    const { node } = createFormComponent({
      schema: entries({
        anyOf: [
          { title: 'Multi', type: ['string', 'boolean'] },
          { title: 'Num', type: 'number' },
        ],
      }),
      useFallbackUiForUnsupportedType: true,
      initialFormData: { extra: 'abc' },
      uiSchema: uiSchemaFor(),
    });

    // A plain entry's key input is a textbox too
    await user.clear(node.querySelector('input[id="root_extra"]')!);
    await user.selectOptions(selector(1), 'boolean');

    expect(selector(1)).toHaveDisplayValue('boolean');
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});

it.each<[string, unknown]>([
  ['null', null],
  ['a string', 'abc'],
])('renders an additionalProperties entry whose uiSchema is %s', (_kind, entry) => {
  const { node } = createFormComponent({
    schema: entries({ type: 'string' }),
    initialFormData: { extra: 'x' },
    uiSchema: { additionalProperties: entry } as UiSchema,
  });

  expect(node.querySelector('input#root_extra')).toHaveValue('x');
});

describe('a plain entry holding null with the Optional Data Controls turned on', () => {
  const schema = entries({ type: ['object', 'null'], properties: { a: { type: 'string', title: 'A' } } });

  it('blocks submit on a ui:required field it renders', async () => {
    const { node, onSubmit } = createFormComponent({
      schema,
      initialFormData: { extra: null },
      noHtml5Validate: true,
      uiSchema: {
        'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] },
        additionalProperties: { a: { 'ui:required': true } },
      },
    });

    expect(screen.getByRole('textbox', { name: /^A/ })).toBeRequired();
    await submitForm(node, user);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(fieldErrorsById(node)).toHaveProperty('root_extra_a');
  });
});

describe('an entry holding null in a custom container field, which provides no context', () => {
  function CustomContainerField(props: FieldProps) {
    const { registry, schema, uiSchema, formData, fieldPath } = props;
    const { SchemaField } = registry.fields;
    const { properties = {} } = registry.schemaUtils.retrieveSchema(schema, formData);
    return Object.entries(properties).map(([key, property]) => {
      const childPath = toFieldPath(key, fieldPath);
      return (
        <SchemaField
          {...props}
          key={key}
          name={key}
          required={false}
          schema={property as RJSFSchema}
          uiSchema={uiSchema?.additionalProperties}
          formData={getByPath(formData, key)}
          errorSchema={getByPath(props.errorSchema, key)}
          fieldPath={childPath}
          id={fieldPathToId(childPath, registry.globalFormOptions)}
        />
      );
    });
  }

  const object: RJSFSchema = { type: ['object', 'null'], properties: { a: { type: 'string', title: 'A' } } };

  it.each<[string, RJSFSchema, UiSchema]>([
    ['its own field', object, { a: { 'ui:required': true } }],
    ['a field of the option it shows', { anyOf: [object] }, { anyOf: [{ a: { 'ui:required': true } }] }],
  ])('shows %s with no Add button and blocks submit on it', async (_name, entry, entryUiSchema) => {
    const { node, onSubmit } = createFormComponent({
      schema: entries(entry),
      initialFormData: { extra: null },
      noHtml5Validate: true,
      fields: { CustomContainerField },
      uiSchema: {
        'ui:field': 'CustomContainerField',
        'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] },
        additionalProperties: entryUiSchema,
      },
    });

    expect(screen.getByRole('textbox', { name: /^A/ })).toBeRequired();
    expect(node.querySelector('[id$="__optionalAdd"]')).toBeNull();
    await submitForm(node, user);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(fieldErrorsById(node)).toHaveProperty('root_extra_a');
  });
});

describe('a declared field', () => {
  it('holds nothing on a null option', async () => {
    const { onChange } = createFormComponent({
      schema: { type: 'object', properties: { x: { anyOf: [{ title: 'Num', type: 'number' }, NIL] } } },
      initialFormData: { x: 5 },
    });

    await user.selectOptions(selector(), 'Nil');

    expect(onChange.mock.lastCall![0].formData).toStrictEqual({ x: undefined });
  });

  it('keeps its Optional Data Controls', () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { x: OBJ } },
      initialFormData: { x: { a: 'A' } },
      uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
    });

    expect(optionalControls(node)).toHaveLength(1);
  });
});
