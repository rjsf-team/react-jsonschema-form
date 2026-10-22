import { useState } from 'react';
import type { FieldProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import { ROOT_FIELD_PATH } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { useOptionSelection } from '../src/index.ts';
import { getTestRegistry } from '../src/testing.ts';
import {
  createFormComponent,
  createFormRef,
  elementOf,
  errorListMessages,
  getSelectedOptionValue,
  handleOf,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

const ids = (node: ParentNode, selector = '[id]') => [...node.querySelectorAll(selector)].map((element) => element.id);

function selectOf(node: ParentNode, id: string) {
  const select = node.querySelector(`#${id}`);
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error(`There is no select #${id}`);
  }
  return select;
}

/** An `AnyOfField` that switches between the first two options without changing the data */
function FirstOrSecond({ fieldPath, formData, options, registry, onChange }: FieldProps & { options: RJSFSchema[] }) {
  const { selectedOption, selectOption } = useOptionSelection(registry, fieldPath, options, formData);
  return (
    <button
      id='switch'
      type='button'
      onClick={() => {
        selectOption(1 - selectedOption);
        onChange(formData, fieldPath);
      }}
    >
      {selectedOption}
    </button>
  );
}

describe('option selection as form state', () => {
  it('renders a key the selected option declares once, and nothing for it once a switch discards its value (#5461)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      unevaluatedProperties: { type: 'string' },
      anyOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        { title: 'B', properties: { a: { type: 'string' }, b: { type: 'number' } } },
      ],
    };
    const { node } = createFormComponent({ schema, initialFormData: { a: 'x', b: 2 } });

    expect(selectOf(node, 'root__anyof_select')).toHaveValue('1');
    expect(ids(node, '#root_b')).toHaveLength(1);
    expect(node.querySelector('#root_b-key')).toBeNull();

    await user.selectOptions(selectOf(node, 'root__anyof_select'), 'A');

    // The switch leaves `b` holding `undefined`, which is no entry for the extra-key keyword to render a row for
    expect(node.querySelector('#root_b-key')).toBeNull();
    expect(ids(node, '#root_b')).toHaveLength(0);
  });

  it('renders a key only another option declares as an extra key (#5461)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      unevaluatedProperties: { type: 'string' },
      anyOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        { title: 'B', properties: { a: { type: 'string' }, b: { type: 'number' } } },
      ],
    };
    // `b` holds a string, which B's number rejects, so A is the option on screen
    const { node } = createFormComponent({ schema, initialFormData: { a: 'x', b: 'y' } });

    expect(selectOf(node, 'root__anyof_select')).toHaveValue('0');
    // Under A nothing evaluates `b`, so the keyword describing the extra keys renders it, with its key and remove button
    expect(node.querySelector('#root_b-key')).toHaveValue('b');
    expect(ids(node, '#root_b')).toHaveLength(1);
  });

  it('counts no key a switch of options discards against maxProperties', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      maxProperties: 2,
      anyOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        { title: 'B', properties: { b: { type: 'string' } } },
      ],
    };
    const { node } = createFormComponent({ schema });

    await user.type(node.querySelector('#root_a')!, 'x');
    await user.selectOptions(selectOf(node, 'root__anyof_select'), 'B');

    expect(node.querySelector('#root_a-key')).toBeNull();
    expect(node.querySelector('.rjsf-object-property-expand button')).not.toBeNull();
  });

  it('renders no field for a key a switch of options discards from an object allowing any extra key', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: true,
      oneOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        { title: 'B', properties: { b: { type: 'string' } } },
      ],
    };
    const { node, onChange } = createFormComponent({ schema });

    await user.type(node.querySelector('#root_a')!, 'x');
    await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');

    expect(node.querySelector('#root_a-key')).toBeNull();
    expect(ids(node, '#root_a')).toHaveLength(0);
    const { formData } = onChange.mock.lastCall?.[0] ?? {};
    expect(formData).not.toHaveProperty('a');
    // The defaults are B's, the option on screen: under A, which `b` fits as well, `b` is an extra key whose `null`
    // fills it. `toEqual()` reads a key holding `undefined` as missing, so that `null` fails it
    expect(formData).toEqual({ b: undefined });
  });

  it('renders a key the selected option declares once outside a Form, where the outermost field keeps the selection (#5461)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      oneOf: [
        { title: 'A', properties: { p: { type: 'string' } } },
        { title: 'B', properties: { p: { type: 'string' }, z: { type: 'number' } } },
      ],
    };
    const registry = getTestRegistry(schema);
    const { SchemaField } = registry.fields;
    function Host() {
      const [formData, setFormData] = useState<unknown>({ p: '1', z: '2' });
      return (
        <SchemaField
          name=''
          schema={schema}
          fieldPath={ROOT_FIELD_PATH}
          id='root'
          formData={formData}
          registry={registry}
          onChange={setFormData}
          onBlur={() => undefined}
          onFocus={() => undefined}
        />
      );
    }
    const { container } = render(<Host />);
    expect(selectOf(container, 'root__oneof_select')).toHaveValue('0');

    await user.selectOptions(selectOf(container, 'root__oneof_select'), 'B');

    expect(selectOf(container, 'root__oneof_select')).toHaveValue('1');
    expect(ids(container, '#root_z')).toHaveLength(1);
    expect(container.querySelector('#root_z-key')).toBeNull();
  });

  it('seeds a new key renamed onto a name the selected option declares from that option (#5461)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      anyOf: [
        { title: 'A', properties: { count: { type: 'number' } } },
        { title: 'B', properties: { count: { type: 'number' }, b: { type: 'string' } } },
      ],
    };
    const { node, onChange } = createFormComponent({ schema, initialFormData: {} });
    await user.click(elementOf(node, '.rjsf-object-property-expand button'));
    const keyInput = elementOf(node, '#root_newKey-key');

    await user.clear(keyInput);
    await user.type(keyInput, 'count');
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { count: 0 } }), 'root');
    expect(ids(node, '#root_count')).toHaveLength(1);
    expect(elementOf(node, '#root_count')).toHaveValue('0');
    expect(node.querySelector('#root_count-key')).toBeNull();
  });

  it("seeds a key renamed onto a name the selected option declares from that option's entry of the uiSchema's option list", async () => {
    const count: RJSFSchema = { type: 'number', enum: [0, 1, 2] };
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      anyOf: [
        { title: 'A', properties: { count } },
        { title: 'B', properties: { count, b: { type: 'string' } } },
      ],
    };
    const optionUiSchema: UiSchema = { count: { 'ui:enumDisabled': [0] } };
    const uiSchema: UiSchema = { anyOf: [optionUiSchema, optionUiSchema] };
    const { node, onChange } = createFormComponent({ schema, uiSchema, initialFormData: {} });
    await user.click(elementOf(node, '.rjsf-object-property-expand button'));
    const keyInput = elementOf(node, '#root_newKey-key');

    await user.clear(keyInput);
    await user.type(keyInput, 'count');
    await user.tab();

    // The select the option renders disables `0`, so the seed is the first value it offers
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { count: 1 } }), 'root');
    expect(getSelectedOptionValue(selectOf(node, 'root_count'))).toBe('1');
  });

  it('seeds a renamed key from the extra-key keyword when a ui:field replaces the options (#5461)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      anyOf: [
        { title: 'A', properties: { count: { type: 'number' } } },
        { title: 'B', properties: { count: { type: 'number' }, b: { type: 'string' } } },
      ],
    };
    const uiSchema: UiSchema = { 'ui:field': 'ObjectField', 'ui:fieldReplacesAnyOrOneOf': true };
    const { node, onChange } = createFormComponent({ schema, uiSchema, initialFormData: {} });
    await user.click(elementOf(node, '.rjsf-object-property-expand button'));
    const keyInput = elementOf(node, '#root_newKey-key');

    await user.clear(keyInput);
    await user.type(keyInput, 'count');
    await user.tab();

    expect(node.querySelector('#root__anyof_select')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { count: 'New Value' } }), 'root');
    expect(elementOf(node, '#root_count-key')).toHaveValue('count');
    expect(elementOf(node, '#root_count')).toHaveValue('New Value');
  });

  it('renders and edits the extra keys of an option a field offers without an object field of its own beside it', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        v: {
          oneOf: [
            { type: 'object', properties: { id: { type: 'string' } }, additionalProperties: { type: 'string' } },
            { type: 'number' },
          ],
        },
      },
    };
    const { node, onChange } = createFormComponent({ schema, initialFormData: { v: { id: 'a', extra: 'x' } } });
    expect(elementOf(node, '#root_v_extra-key')).toHaveValue('extra');
    expect(ids(node, '#root_v_extra')).toHaveLength(1);

    await user.type(elementOf(node, '#root_v_extra'), 'y');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { v: { id: 'a', extra: 'xy' } } }),
      'root_v_extra',
    );
  });

  it("renders a key the selected option allows without describing it as the object's extra-key keyword does (#5462)", () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'object', properties: { host: { type: 'string' }, port: { type: 'number' } } },
      anyOf: [{ title: 'A', patternProperties: { '^x-': { type: 'string' } } }],
    };
    const { node } = createFormComponent({ schema, initialFormData: { db: { host: 'h', port: 1 } } });

    expect(node.querySelector('#root_db_host')).toHaveValue('h');
    expect(node.querySelector('#root_db_port')).toHaveValue('1');
    expect(ids(node, '#root_db-key')).toHaveLength(1);
  });

  it("renders an enum the object's extra-key keyword declares as a select beside such an option (#5462)", () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string', enum: ['x', 'y'] },
      anyOf: [{ title: 'A', patternProperties: { '^x-': { type: 'string' } } }],
    };
    const { node } = createFormComponent({ schema, initialFormData: { foo: 'x' } });

    expect(node.querySelector('#root_foo')).toBeInstanceOf(HTMLSelectElement);
  });

  it('restores the defaults the field declares when switching back from a null option (#5368)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        {
          title: 'Obj',
          type: 'object',
          required: ['kind'],
          properties: {
            kind: { const: 'obj' },
            note: { type: 'string', default: 'from-option' },
            extra: { type: 'string' },
          },
        },
        { title: 'None', type: 'null' },
      ],
      default: { kind: 'obj', extra: 'from-root' },
    };
    const { node, getFormData } = createFormComponent({ schema });
    const mounted = getFormData();

    expect(mounted).toEqual({ kind: 'obj', note: 'from-option', extra: 'from-root' });

    await user.selectOptions(selectOf(node, 'root__oneof_select'), 'None');
    await user.selectOptions(selectOf(node, 'root__oneof_select'), 'Obj');

    expect(getFormData()).toEqual(mounted);
    expect(node.querySelector('#root_extra')).toHaveValue('from-root');
  });

  it.each([
    ['a null option', null],
    ['another object option', {}],
  ])('writes the empty object of an object property switching from %s', async (_from, p) => {
    const options: RJSFSchema[] = [
      { title: 'Other', type: 'object', properties: { z: { type: 'string' } } },
      {
        title: 'Obj',
        type: 'object',
        properties: { meta: { type: 'object', properties: { a: { type: 'string' } } }, d: { default: 'D' } },
      },
      { title: 'None', type: 'null' },
    ];
    const schema: RJSFSchema = { type: 'object', properties: { p: { oneOf: options } } };
    const { node, onChange } = createFormComponent({ schema, initialFormData: { p } });

    await user.selectOptions(selectOf(node, 'root_p__oneof_select'), 'Obj');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { p: { d: 'D', meta: {} } } }),
      'root_p__oneof_select',
    );
  });

  it('restores the defaults an ancestor declares for the field when switching back from a null option (#5368)', async () => {
    const optionsOf = (): RJSFSchema => ({
      oneOf: [
        {
          title: 'Obj',
          type: 'object',
          required: ['kind'],
          properties: {
            kind: { const: 'obj' },
            note: { type: 'string', default: 'from-option' },
            extra: { type: 'string' },
          },
        },
        { title: 'None', type: 'null' },
      ],
    });
    const schema: RJSFSchema = {
      type: 'object',
      properties: { w: { type: 'object', properties: { p: optionsOf() } } },
      default: { w: { p: { kind: 'obj', extra: 'from-root' } } },
    };
    const { node, getFormData } = createFormComponent({ schema });
    expect(getFormData()).toEqual({ w: { p: { kind: 'obj', extra: 'from-root' } } });

    await user.selectOptions(selectOf(node, 'root_w_p__oneof_select'), 'None');
    await user.selectOptions(selectOf(node, 'root_w_p__oneof_select'), 'Obj');

    expect(getFormData()).toEqual({ w: { p: { kind: 'obj', note: 'from-option', extra: 'from-root' } } });
    expect(node.querySelector('#root_w_p_extra')).toHaveValue('from-root');
  });

  describe('options that refer to one another across definitions (#4990)', () => {
    const names = ['A', 'B', 'C', 'D', 'E'];
    const definitions = Object.fromEntries(
      names.map((name): [string, RJSFSchema] => [
        name,
        {
          type: 'object',
          title: name,
          properties: {
            child: {
              oneOf: [
                { type: 'null', title: 'None' },
                ...names.filter((other) => other !== name).map((other) => ({ $ref: `#/definitions/${other}` })),
              ],
            },
          },
        },
      ]),
    );
    const schema: RJSFSchema = {
      definitions,
      oneOf: [{ type: 'null', title: 'None' }, ...names.map((name) => ({ $ref: `#/definitions/${name}` }))],
    };
    const nested = (depth: number): unknown => (depth === 0 ? null : { child: nested(depth - 1) });

    it('matches each option list once per level of data, so the matching grows linearly with depth', () => {
      const counts = [1, 2, 3, 4, 5].map((depth) => {
        const counting = customizeValidator();
        const isValid = vi.spyOn(counting, 'isValid');
        createFormComponent({ schema, initialFormData: nested(depth) }, counting);
        return isValid.mock.calls.length;
      });
      const steps = counts.slice(1).map((count, index) => count - counts[index]);

      // Each level adds the same matching, rather than multiplying the matching below it by the options it scores
      expect(new Set(steps).size).toBe(1);
    });

    it('opens every level the data holds on an option that fits it, down to the None that ends it', () => {
      const { node } = createFormComponent({ schema, initialFormData: nested(3) });

      expect(ids(node, 'select')).toEqual([
        'root__oneof_select',
        'root_child__oneof_select',
        'root_child_child__oneof_select',
        'root_child_child_child__oneof_select',
      ]);
      expect(getSelectedOptionValue(selectOf(node, 'root__oneof_select'))).toBe('A');
      expect(getSelectedOptionValue(selectOf(node, 'root_child_child_child__oneof_select'))).toBe('None');
    });
  });

  it('renders only the selector for an option that adds nothing to the field offering it', async () => {
    const schema: RJSFSchema = {
      definitions: {
        node: {
          type: 'object',
          anyOf: [{ $ref: '#/definitions/node' }, { title: 'X', properties: { x: { type: 'string' } } }],
        },
      },
      $ref: '#/definitions/node',
    };
    const { node } = createFormComponent({ schema });

    expect(ids(node, 'input, select')).toEqual(['root__anyof_select']);

    await user.selectOptions(selectOf(node, 'root__anyof_select'), 'X');

    expect(ids(node, 'input, select')).toEqual(['root__anyof_select', 'root_x']);
  });

  it('keeps the selected option while typing makes the data match another option better', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        o: {
          anyOf: [
            { title: 'A', type: 'object', properties: { a: { type: 'string', default: 'd' } } },
            { title: 'B', type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } },
          ],
        },
      },
    };
    const { node } = createFormComponent({ schema });
    await user.selectOptions(selectOf(node, 'root_o__anyof_select'), 'B');
    const field = node.querySelector('#root_o_a');
    if (!(field instanceof HTMLInputElement)) {
      throw new Error('There is no input #root_o_a');
    }

    // A scores the default it declares, so the data `{ a: 'd' }` matches A best
    await user.clear(field);
    await user.type(field, 'd');

    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('1');
    expect(node.querySelector('#root_o_b')).toBeInTheDocument();
  });

  describe('an edit inside a held option whose data matches only another option', () => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        { title: 'B', properties: { a: { type: 'string', maxLength: 2 }, b: { type: 'string' } } },
      ],
    };

    it('keeps the data of the option shown when omitting extra data on change', async () => {
      const { node, onChange } = createFormComponent({
        schema,
        initialFormData: {},
        omitExtraData: true,
        liveOmit: 'onChange',
      });
      await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');
      await user.type(elementOf(node, '#root_b'), 'z');

      await user.type(elementOf(node, '#root_a'), 'abc');
      await user.type(elementOf(node, '#root_b'), 'q');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      expect(onChange.mock.lastCall?.[0].formData).toEqual({ a: 'abc', b: 'zq' });
    });

    it('enforces ui:required on the option shown under live validation', async () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { b: { 'ui:required': true } },
        initialFormData: {},
        liveValidate: 'onChange',
      });
      await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');

      await user.type(elementOf(node, '#root_a'), 'abc');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      expect(errorListMessages(node)).toEqual([".b must have required property 'b'"]);
    });
  });

  describe('an edit to the property the options are told apart by', () => {
    const optionsBy = (discriminator: RJSFSchema): RJSFSchema => ({
      type: 'object',
      properties: { kind: { type: 'string', enum: ['a', 'b'] } },
      required: ['kind'],
      ...discriminator,
      oneOf: [
        { title: 'A', properties: { kind: { const: 'a' }, x: { type: 'string' } } },
        { title: 'B', properties: { kind: { const: 'b' }, y: { type: 'string' } } },
      ],
    });

    it('switches to the option the declared discriminator names', async () => {
      const { node } = createFormComponent({
        schema: optionsBy({ discriminator: { propertyName: 'kind' } }),
        initialFormData: { kind: 'a' },
      });

      await user.selectOptions(selectOf(node, 'root_kind'), 'b');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      expect(ids(node, 'input, select')).toEqual(['root_kind', 'root__oneof_select', 'root_kind', 'root_y']);
    });

    it('matches the option again without a declared discriminator', async () => {
      const { node } = createFormComponent({ schema: optionsBy({}), initialFormData: { kind: 'a' } });

      await user.selectOptions(selectOf(node, 'root_kind'), 'b');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      expect(ids(node, 'input, select')).toEqual(['root_kind', 'root__oneof_select', 'root_kind', 'root_y']);
    });

    it('matches the option again after typing inside it, and submits the data the option left', async () => {
      const { node, onSubmit } = createFormComponent({ schema: optionsBy({}), initialFormData: { kind: 'a' } });
      await user.type(elementOf(node, '#root_x'), 'foo');

      await user.selectOptions(selectOf(node, 'root_kind'), 'b');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      expect(ids(node, 'input, select')).toEqual(['root_kind', 'root__oneof_select', 'root_kind', 'root_y']);
      await submitForm(node, user);
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', x: 'foo' } }),
        expect.anything(),
      );
    });

    it('keeps the option that data edited in a property of the object itself fits as well as another', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        oneOf: [
          { title: 'A', properties: { a: { type: 'string' } } },
          { title: 'B', properties: { a: { type: 'string' }, b: { type: 'string' } } },
        ],
      };
      const { node } = createFormComponent({ schema, initialFormData: {} });
      await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');

      await user.type(elementOf(node, '#root_name'), 'n');
      await user.type(elementOf(node, '#root_a'), 'a');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      expect(ids(node, 'input, select')).toEqual(['root_name', 'root__oneof_select', 'root_a', 'root_b']);
    });

    it('keeps an option held through an edit inside it when a property no option declares is edited', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        oneOf: [
          { title: 'A', properties: { a: { type: 'string' } } },
          {
            title: 'B',
            properties: { a: { type: 'string', maxLength: 2 }, b: { type: 'string' } },
            required: ['b'],
          },
        ],
      };
      const { node, onChange } = createFormComponent({
        schema,
        initialFormData: {},
        omitExtraData: true,
        liveOmit: 'onChange',
      });
      await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');
      await user.type(elementOf(node, '#root_b'), 'z');
      await user.type(elementOf(node, '#root_a'), 'abc');

      await user.type(elementOf(node, '#root_name'), 'n');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      expect(ids(node, 'input, select')).toEqual(['root_name', 'root__oneof_select', 'root_a', 'root_b']);
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { a: 'abc', b: 'z', name: 'n' } }),
        'root_name',
      );
    });

    it.each<[string, RJSFSchema]>([
      ['$defs', { $defs: { unused: { type: 'string' } } }],
      ['discriminator', { discriminator: { propertyName: 'b' } }],
      ['an x- keyword', { 'x-group': 'b' }],
    ])(
      'keeps an option carrying %s, which constrains no value, held through an edit to a property no option declares',
      async (_, keywords) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { name: { type: 'string' } },
          oneOf: [
            { title: 'A', properties: { a: { type: 'string' } } },
            {
              title: 'B',
              properties: { a: { type: 'string', maxLength: 2 }, b: { type: 'string' } },
              required: ['b'],
              ...keywords,
            },
          ],
        };
        const { node } = createFormComponent({ schema, initialFormData: {} });
        await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');
        await user.type(elementOf(node, '#root_b'), 'z');
        await user.type(elementOf(node, '#root_a'), 'abc');

        await user.type(elementOf(node, '#root_name'), 'n');

        expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
        expect(ids(node, 'input, select')).toEqual(['root_name', 'root__oneof_select', 'root_a', 'root_b']);
      },
    );

    it("matches the option again after an edit to a property only an option's required names", async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
        oneOf: [
          { title: 'A', required: ['a'] },
          { title: 'B', required: ['b'] },
        ],
      };
      const { node, onChange } = createFormComponent({ schema, initialFormData: { a: 'q' } });
      await user.clear(elementOf(node, '#root_a'));

      await user.type(elementOf(node, '#root_b'), 'x');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { b: 'x' } }), 'root_b');
    });

    it('matches the option again after an edit to a property options tell apart by their number of keys', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
        anyOf: [
          { title: 'Few', maxProperties: 1 },
          { title: 'Many', minProperties: 2 },
        ],
      };
      const { node } = createFormComponent({ schema, initialFormData: { a: 'x' } });

      await user.type(elementOf(node, '#root_b'), 'y');

      expect(selectOf(node, 'root__anyof_select')).toHaveValue('1');
    });

    it('keeps the option shown, and submits under it, when transformChange refuses an edit to a property its options can disagree about', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        oneOf: [
          { title: 'A', properties: { a: { type: 'string' } } },
          { title: 'B', properties: { b: { type: 'string' } }, required: ['name'] },
        ],
      };
      let refuses = false;
      const { node, onSubmit } = createFormComponent({
        schema,
        initialFormData: { a: 'v' },
        omitExtraData: true,
        transformChange: (next, previous) => (refuses ? previous : next),
      });
      await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');
      refuses = true;

      await user.type(elementOf(node, '#root_name'), 'x');

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
      await submitForm(node, user);
      expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ formData: {} }), expect.anything());
    });
  });

  it('moves the selections of array items with the items', async () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        anyOf: [
          { title: 'A', type: 'object', properties: { name: { type: 'string' } } },
          { title: 'B', type: 'object', properties: { name: { type: 'string' }, more: { type: 'string' } } },
        ],
      },
    };
    const { node } = createFormComponent({ schema, initialFormData: [{ name: 'first' }, { name: 'second' }] });
    await user.selectOptions(selectOf(node, 'root_0__anyof_select'), 'B');

    await user.click(node.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(node.querySelector('#root_0_name')).toHaveValue('second');
    expect(selectOf(node, 'root_0__anyof_select')).toHaveValue('0');
    expect(node.querySelector('#root_1_name')).toHaveValue('first');
    expect(selectOf(node, 'root_1__anyof_select')).toHaveValue('1');
  });

  it('keeps the selections of array items on their items when transformChange refuses the reorder', async () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        anyOf: [
          { title: 'A', type: 'object', properties: { name: { type: 'string' } } },
          { title: 'B', type: 'object', properties: { name: { type: 'string' }, more: { type: 'string' } } },
        ],
      },
    };
    let refuses = false;
    const { node } = createFormComponent({
      schema,
      initialFormData: [{ name: 'first' }, { name: 'second' }],
      transformChange: (next, previous) => (refuses ? previous : next),
    });
    await user.selectOptions(selectOf(node, 'root_0__anyof_select'), 'B');
    refuses = true;

    await user.click(node.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(node.querySelector('#root_0_name')).toHaveValue('first');
    expect(selectOf(node, 'root_0__anyof_select')).toHaveValue('1');
    expect(node.querySelector('#root_1_name')).toHaveValue('second');
    expect(selectOf(node, 'root_1__anyof_select')).toHaveValue('0');
  });

  it('keeps the selections of array items on the items transformChange leaves where they were when it rewrites a reorder', async () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        anyOf: [
          { title: 'A', type: 'object', properties: { name: { type: 'string' } } },
          { title: 'B', type: 'object', properties: { name: { type: 'string' }, more: { type: 'string' } } },
        ],
      },
    };
    let rewrites = false;
    const { node } = createFormComponent({
      schema,
      initialFormData: [{ name: 'first' }, { name: 'second' }],
      // Puts the rows back where they were, renaming the second
      transformChange: (next, previous) =>
        rewrites && Array.isArray(previous) ? [previous[0], { ...previous[1], name: 'second!' }] : next,
    });
    await user.selectOptions(selectOf(node, 'root_0__anyof_select'), 'B');
    rewrites = true;

    await user.click(node.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(node.querySelector('#root_0_name')).toHaveValue('first');
    expect(selectOf(node, 'root_0__anyof_select')).toHaveValue('1');
    expect(node.querySelector('#root_1_name')).toHaveValue('second!');
    expect(selectOf(node, 'root_1__anyof_select')).toHaveValue('0');
  });

  it('keeps the selections of array items where they are when setFieldValue changes the array after a refused reorder', async () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        anyOf: [
          { title: 'A', type: 'object', properties: { name: { type: 'string' } } },
          { title: 'B', type: 'object', properties: { name: { type: 'string' }, more: { type: 'string' } } },
        ],
      },
    };
    const ref = createFormRef();
    let refuses = false;
    const { node } = createFormComponent({
      ref,
      schema,
      initialFormData: [{ name: 'first' }, { name: 'second' }],
      transformChange: (next, previous) => (refuses ? previous : next),
    });
    await user.selectOptions(selectOf(node, 'root_0__anyof_select'), 'B');
    refuses = true;
    await user.click(node.querySelectorAll('.rjsf-array-item-move-down')[0]);
    refuses = false;

    act(() => handleOf(ref).setFieldValue('', [{ name: 'first' }, { name: 'second' }, { name: 'third' }]));

    expect(node.querySelector('#root_0_name')).toHaveValue('first');
    expect(selectOf(node, 'root_0__anyof_select')).toHaveValue('1');
    expect(selectOf(node, 'root_1__anyof_select')).toHaveValue('0');
    expect(selectOf(node, 'root_2__anyof_select')).toHaveValue('0');
  });

  it('keeps the selections of array items on their items when transformChange takes an edit and refuses the removal made on top of it', async () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        anyOf: [
          { title: 'A', type: 'object', properties: { name: { type: 'string' } } },
          { title: 'B', type: 'object', properties: { name: { type: 'string' }, more: { type: 'string' } } },
        ],
      },
    };
    const ref = createFormRef();
    const { node } = createFormComponent({
      ref,
      schema,
      initialFormData: [{ name: 'first' }, { name: 'second' }],
      // Refuses any change that shortens the array
      transformChange: (next, previous) =>
        Array.isArray(next) && Array.isArray(previous) && next.length < previous.length ? previous : next,
    });
    await user.selectOptions(selectOf(node, 'root_1__anyof_select'), 'B');

    // Both before any commit, so the removal is made on top of the edit
    act(() => {
      handleOf(ref).setFieldValue([1, 'name'], 'edited');
      node.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-remove')[0].click();
    });

    expect(node.querySelector('#root_0_name')).toHaveValue('first');
    expect(node.querySelector('#root_1_name')).toHaveValue('edited');
    expect(selectOf(node, 'root_0__anyof_select')).toHaveValue('0');
    expect(selectOf(node, 'root_1__anyof_select')).toHaveValue('1');
  });

  it('drops the selection of an additional property with the property, so one added under its name starts over', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: {
        anyOf: [
          { title: 'A', type: 'object', properties: { name: { type: 'string' } } },
          { title: 'B', type: 'object', properties: { name: { type: 'string' }, more: { type: 'string' } } },
        ],
      },
    };
    const { node } = createFormComponent({ schema, initialFormData: {} });
    await user.click(elementOf(node, '.rjsf-object-property-expand button'));
    await user.selectOptions(selectOf(node, 'root_newKey__anyof_select'), 'B');

    await user.click(elementOf(node, '.rjsf-object-property-remove'));
    await user.click(elementOf(node, '.rjsf-object-property-expand button'));

    expect(selectOf(node, 'root_newKey__anyof_select')).toHaveValue('0');
  });

  it('keeps the selection of a field whose components unmount and mount again', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        o: {
          anyOf: [
            { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
            { title: 'B', type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } },
          ],
        },
      },
    };
    const hidden: UiSchema = { o: { 'ui:field': () => null, 'ui:fieldReplacesAnyOrOneOf': true } };
    const { node, rerender } = createFormComponent({ schema });
    await user.selectOptions(selectOf(node, 'root_o__anyof_select'), 'B');

    rerender({ schema, uiSchema: hidden });
    expect(node.querySelector('#root_o__anyof_select')).toBeNull();
    rerender({ schema, uiSchema: {} });

    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('1');
  });

  it('starts the choice over when a condition swaps the option list, and finds it again when it swaps back', async () => {
    const options = (prefix: string): RJSFSchema[] => [
      { title: `${prefix}1`, type: 'object', properties: { v: { type: 'string' } } },
      { title: `${prefix}2`, type: 'object', properties: { v: { type: 'string' }, w: { type: 'string' } } },
    ];
    const schema: RJSFSchema = {
      type: 'object',
      properties: { kind: { type: 'string', enum: ['a', 'b'], default: 'a' } },
      if: { properties: { kind: { const: 'a' } } },
      then: { properties: { x: { anyOf: options('A') } } },
      else: { properties: { x: { anyOf: options('B') } } },
    };
    const { node } = createFormComponent({ schema });
    await user.selectOptions(selectOf(node, 'root_x__anyof_select'), 'A2');

    await user.selectOptions(selectOf(node, 'root_kind'), 'b');
    // The selection is kept by the list it was made in, so the new list opens on the option the data matches
    expect(getSelected(selectOf(node, 'root_x__anyof_select'))).toBe('B1');

    await user.selectOptions(selectOf(node, 'root_kind'), 'a');
    expect(getSelected(selectOf(node, 'root_x__anyof_select'))).toBe('A2');
  });

  it('leaves the option shown when transformChange refuses a switch, and matches data setFieldValue sets again, preferring the selection', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        o: {
          anyOf: [
            { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
            { title: 'B', type: 'object', properties: { b: { type: 'string' } }, required: ['b'] },
          ],
        },
      },
    };
    const ref = createFormRef();
    let refuses = true;
    const { node } = createFormComponent({
      ref,
      schema,
      initialFormData: { o: { a: 'x' } },
      transformChange: (next, previous) => (refuses ? previous : next),
    });
    await user.selectOptions(selectOf(node, 'root_o__anyof_select'), 'B');
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('0');
    refuses = false;
    await user.selectOptions(selectOf(node, 'root_o__anyof_select'), 'B');

    act(() => handleOf(ref).setFieldValue('o', { a: 'v' }));
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('0');

    act(() => handleOf(ref).setFieldValue('o', { b: 'z', a: 'w' }));
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('1');
  });

  it('shows data setFieldValue sets under the option it fits best, even when the selected option fits it too', async () => {
    const schema: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
        { title: 'B', type: 'object', properties: { b: { type: 'string' } } },
      ],
    };
    const ref = createFormRef();
    const { node } = createFormComponent({ ref, schema, initialFormData: {} });
    await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');

    act(() => handleOf(ref).setFieldValue('', { a: 'x' }));

    expect(selectOf(node, 'root__oneof_select')).toHaveValue('0');
    expect(node.querySelector('#root_a')).toHaveValue('x');
  });

  describe('picking the selected option again while the data shows another', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { x: { type: 'string' } },
      anyOf: [
        { title: 'A', required: ['x'], properties: { x: { minLength: 3 } } },
        { title: 'B', properties: { x: { maxLength: 2 } } },
      ],
    };

    it('shows the option after an edit to a property of the object matched the other', async () => {
      const { node } = createFormComponent({ schema, initialFormData: {} });
      await user.selectOptions(selectOf(node, 'root__anyof_select'), 'B');
      await user.selectOptions(selectOf(node, 'root__anyof_select'), 'A');
      await user.type(elementOf(node, '#root_x'), 'h');
      expect(selectOf(node, 'root__anyof_select')).toHaveValue('1');

      await user.selectOptions(selectOf(node, 'root__anyof_select'), 'A');
      expect(selectOf(node, 'root__anyof_select')).toHaveValue('0');
    });

    it('shows the option after data setFieldValue sets matched the other', async () => {
      const ref = createFormRef();
      const { node } = createFormComponent({ ref, schema, initialFormData: {} });
      await user.selectOptions(selectOf(node, 'root__anyof_select'), 'B');
      act(() => handleOf(ref).setFieldValue('', { x: 'abcd' }));
      expect(selectOf(node, 'root__anyof_select')).toHaveValue('0');

      await user.selectOptions(selectOf(node, 'root__anyof_select'), 'B');
      expect(selectOf(node, 'root__anyof_select')).toHaveValue('1');
    });
  });

  it('keeps the selection through a reset', async () => {
    const schema: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
        { title: 'B', type: 'object', properties: { b: { type: 'string' } } },
      ],
    };
    const ref = createFormRef();
    const { node } = createFormComponent({ ref, schema, initialFormData: {} });
    await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');
    await user.type(elementOf(node, '#root_b'), 'y');

    act(() => handleOf(ref).reset());

    expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');
    expect(node.querySelector('#root_b')).toHaveValue('');
  });

  describe('data from outside equal to the data before a switch the form rendered', () => {
    // `B` requires `b`, so `{ a: 'x' }` fits `A` alone
    const schema: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
        { title: 'B', type: 'object', properties: { b: { type: 'string' } }, required: ['b'] },
      ],
    };

    it('is matched again after a reset', async () => {
      const ref = createFormRef();
      const { node } = createFormComponent({ ref, schema, initialFormData: { a: 'x' } });
      await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');
      await user.type(elementOf(node, '#root_b'), 'q');

      act(() => handleOf(ref).reset());

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('0');
      expect(node.querySelector('#root_a')).toHaveValue('x');
    });

    it.each([
      { edits: false, title: 'right after the switch' },
      { edits: true, title: 'after an edit under the new option' },
    ])('is matched again when setFieldValue puts it back, $title', async ({ edits }) => {
      const ref = createFormRef();
      const { node } = createFormComponent({ ref, schema, initialFormData: { a: 'x' } });
      await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');
      if (edits) {
        await user.type(elementOf(node, '#root_b'), 'q');
      }
      expect(selectOf(node, 'root__oneof_select')).toHaveValue('1');

      act(() => handleOf(ref).setFieldValue('', { a: 'x' }));

      expect(selectOf(node, 'root__oneof_select')).toHaveValue('0');
      expect(node.querySelector('#root_a')).toHaveValue('x');
    });
  });

  it('keeps the selection when the schema adds an option to the list', async () => {
    const options: RJSFSchema[] = [
      { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
      { title: 'B', type: 'object', properties: { b: { type: 'string' } } },
    ];
    const schemaOf = (oneOf: RJSFSchema[]): RJSFSchema => ({ type: 'object', properties: { o: { oneOf } } });
    // `{ o: {} }` fits every option, so only the selection shows `B`
    const props = { initialFormData: { o: {} } };
    const { node, rerender } = createFormComponent({ schema: schemaOf(options), ...props });
    await user.selectOptions(selectOf(node, 'root_o__oneof_select'), 'B');

    const withC = schemaOf([...options, { title: 'C', type: 'object', properties: { c: { type: 'string' } } }]);
    rerender({ schema: withC, ...props });

    expect(selectOf(node, 'root_o__oneof_select')).toHaveValue('1');
  });

  it('hands a custom AnyOfField only the option shown and the function that selects one', () => {
    const results: object[] = [];
    function Recording({ fieldPath, formData, options, registry }: FieldProps & { options: RJSFSchema[] }) {
      results.push(useOptionSelection(registry, fieldPath, options, formData));
      return null;
    }
    const schema: RJSFSchema = { anyOf: [{ type: 'string' }, { type: 'number' }] };
    createFormComponent({ schema, fields: { AnyOfField: Recording } });

    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(Object.keys(result).sort()).toEqual(['selectOption', 'selectedOption']);
    }
  });

  it('lets a custom AnyOfField select the option the field stubs its extra keys with', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      anyOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        { title: 'B', properties: { b: { type: 'string' } } },
      ],
    };
    const { node } = createFormComponent({
      schema,
      fields: { AnyOfField: FirstOrSecond },
      initialFormData: { b: 'v' },
    });
    expect(node.querySelector('#switch')).toHaveTextContent('1');
    expect(node.querySelector('#root_b-key')).toBeNull();

    await user.click(elementOf(node, '#switch'));

    expect(node.querySelector('#switch')).toHaveTextContent('0');
    expect(node.querySelector('#root_b-key')).toHaveValue('b');
  });

  it('shares the selection with a custom AnyOfField that passes copies of the options', async () => {
    function CopyingFirstOrSecond(props: FieldProps & { options: RJSFSchema[] }) {
      return <FirstOrSecond {...props} options={props.options.map((option) => ({ ...option }))} />;
    }
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      anyOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        { title: 'B', properties: { b: { type: 'string' } } },
      ],
    };
    const { node } = createFormComponent({
      schema,
      fields: { AnyOfField: CopyingFirstOrSecond },
      initialFormData: { b: 'v' },
    });

    await user.click(elementOf(node, '#switch'));

    expect(node.querySelector('#switch')).toHaveTextContent('0');
    expect(node.querySelector('#root_b-key')).toHaveValue('b');
  });
});

describe('omitting extra data', () => {
  it('omits the data the shown option has no field for', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          anyOf: [
            { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
            { title: 'B', type: 'object', properties: { b: { type: 'string' } } },
          ],
        },
      },
    };
    const { node, onSubmit } = createFormComponent({
      schema,
      fields: { AnyOfField: FirstOrSecond },
      initialFormData: { thing: { b: 'v' } },
      omitExtraData: true,
    });
    await user.click(elementOf(node, '#switch'));

    await submitForm(node, user);

    // Without `b`, `thing` is an optional object holding nothing, which omitting prunes as well
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ formData: {} }), expect.anything());
  });
  it('keeps the data of the option the form shows where the option matches it only once retrieved for it', async () => {
    const kind = { type: 'string' } as const;
    const schema: RJSFSchema = {
      anyOf: [
        {
          title: 'A',
          type: 'object',
          properties: { kind },
          if: { properties: { kind: { const: 'a' } } },
          then: { properties: { n: { type: 'number' }, extra: { type: 'string' } } },
        },
        { title: 'B', type: 'object', properties: { kind, n: { type: 'number' } } },
      ],
    };
    const formData = { kind: 'a', n: 1, extra: 'x' };
    const { node, onSubmit } = createFormComponent({ schema, initialFormData: formData, omitExtraData: true });
    expect(getSelectedOptionValue(selectOf(node, 'root__anyof_select'))).toBe('A');

    await submitForm(node, user);

    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ formData }), expect.anything());
  });
  it('keeps the data of a field that shows a false option, which it renders as any value', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        other: { type: 'string' },
        thing: { oneOf: [false, { title: 'Object', type: 'object', properties: { a: { type: 'string' } } }] },
      },
    };
    const { node, onChange } = createFormComponent({
      schema,
      initialFormData: { thing: { a: 1 } },
      omitExtraData: true,
      liveOmit: 'onChange',
    });
    expect(selectOf(node, 'root_thing__oneof_select')).toHaveValue('0');

    await user.type(elementOf(node, '#root_other'), 'x');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { other: 'x', thing: { a: 1 } } }),
      'root_other',
    );
  });
});

describe('a condition swapped inside the selected option', () => {
  const cfgFor = (name: string): RJSFSchema => ({
    type: 'object',
    default: { name },
    properties: { name: { type: 'string' } },
  });
  const optionWithDependency: RJSFSchema = {
    title: 'X',
    type: 'object',
    properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
    dependencies: {
      mode: {
        oneOf: [
          { properties: { mode: { const: 'a' }, cfg: cfgFor('a') } },
          { properties: { mode: { const: 'b' }, cfg: cfgFor('b') } },
        ],
      },
    },
  };
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      thing: {
        oneOf: [optionWithDependency, { title: 'Y', type: 'object', properties: { other: { type: 'string' } } }],
      },
    },
  };

  it("replaces the old branch's default with the new branch's (#5465)", async () => {
    const { node, onChange } = createFormComponent({
      schema,
      initialFormData: { thing: { mode: 'a', cfg: { name: 'a' } } },
    });

    await user.selectOptions(selectOf(node, 'root_thing_mode'), 'b');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { thing: { mode: 'b', cfg: { name: 'b' } } } }),
      'root_thing_mode',
    );
  });

  it('keeps a value the user edited away from the old default', async () => {
    const { node, onChange } = createFormComponent({
      schema,
      initialFormData: { thing: { mode: 'a', cfg: { name: 'a' } } },
    });
    await user.clear(elementOf(node, '#root_thing_cfg_name'));
    await user.type(elementOf(node, '#root_thing_cfg_name'), 'mine');

    await user.selectOptions(selectOf(node, 'root_thing_mode'), 'b');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { thing: { mode: 'b', cfg: { name: 'mine' } } } }),
      'root_thing_mode',
    );
  });

  it('reads the option the user selected, not the one the data matches best (#5465)', async () => {
    const shared: RJSFSchema = { type: 'object', properties: { mode: { type: 'string', enum: ['a', 'b'] } } };
    const selected: RJSFSchema = {
      ...optionWithDependency,
      title: 'Z',
      properties: { mode: { type: 'string', enum: ['a', 'b'] } },
    };
    const { node, onChange } = createFormComponent({
      schema: { type: 'object', properties: { thing: { anyOf: [{ title: 'W', ...shared }, selected] } } },
      initialFormData: { thing: { mode: 'a' } },
    });
    await user.selectOptions(selectOf(node, 'root_thing__anyof_select'), 'Z');

    await user.selectOptions(selectOf(node, 'root_thing_mode'), 'b');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { thing: { mode: 'b', cfg: { name: 'b' } } } }),
      'root_thing_mode',
    );
  });
});

describe('cycle expansion as form state', () => {
  const schema: RJSFSchema = {
    definitions: {
      node: { type: 'object', properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } } },
    },
    type: 'array',
    items: { $ref: '#/definitions/node' },
  };

  it('keeps an expansion when the field mounts again, and moves it with the array item', async () => {
    const { node, rerender } = createFormComponent({ schema, initialFormData: [{ name: 'a' }, { name: 'b' }] });
    await user.click(elementOf(node, '#root_0_child-button'));
    expect(node.querySelector('#root_0_child_name')).toBeInTheDocument();

    rerender({ schema, uiSchema: { items: { 'ui:field': () => null } } });
    rerender({ schema, uiSchema: {} });
    expect(node.querySelector('#root_0_child_name')).toBeInTheDocument();

    await user.click(node.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(node.querySelector('#root_0_child-button')).toBeInTheDocument();
    expect(node.querySelector('#root_1_child_name')).toBeInTheDocument();
  });

  it('keeps an expansion on its array item when transformChange refuses the reorder', async () => {
    const { node } = createFormComponent({
      schema,
      initialFormData: [{ name: 'a' }, { name: 'b' }],
      transformChange: (_next, previous) => previous,
    });
    await user.click(elementOf(node, '#root_0_child-button'));

    await user.click(node.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(node.querySelector('#root_0_name')).toHaveValue('a');
    expect(node.querySelector('#root_0_child_name')).toBeInTheDocument();
    expect(node.querySelector('#root_1_child-button')).toBeInTheDocument();
  });

  it('keeps an expansion on the item transformChange leaves where it was when it rewrites a reorder', async () => {
    let rewrites = false;
    const { node } = createFormComponent({
      schema,
      initialFormData: [{ name: 'a' }, { name: 'b' }],
      transformChange: (next, previous) =>
        rewrites && Array.isArray(previous) ? [previous[0], { ...previous[1], name: 'b!' }] : next,
    });
    await user.click(elementOf(node, '#root_0_child-button'));
    rewrites = true;

    await user.click(node.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(node.querySelector('#root_0_name')).toHaveValue('a');
    expect(node.querySelector('#root_0_child_name')).toBeInTheDocument();
    expect(node.querySelector('#root_1_child-button')).toBeInTheDocument();
  });

  it('moves an expansion with its array item on a reorder of items holding equal data', async () => {
    const { node } = createFormComponent({ schema, initialFormData: [{ name: 'a' }, { name: 'a' }] });
    await user.click(elementOf(node, '#root_0_child-button'));

    await user.click(node.querySelectorAll('.rjsf-array-item-move-down')[0]);

    expect(node.querySelector('#root_0_child-button')).toBeInTheDocument();
    expect(node.querySelector('#root_1_child_name')).toBeInTheDocument();
  });

  it('keeps an expansion through a reset', async () => {
    const ref = createFormRef();
    const { node } = createFormComponent({ ref, schema, initialFormData: [{ name: 'a' }] });
    await user.click(elementOf(node, '#root_0_child-button'));

    act(() => handleOf(ref).reset());

    expect(node.querySelector('#root_0_child_name')).toBeInTheDocument();
  });
});

function getSelected(select: HTMLSelectElement) {
  return select.selectedOptions[0]?.textContent;
}
