import { useState } from 'react';
import type { FieldProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import { ROOT_FIELD_PATH } from '@rjsf/utils';
import validator, { customizeValidator } from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form, { useOptionSelection } from '../src/index.ts';
import { getTestRegistry } from '../src/testing.ts';
import { createFormComponent, createFormRef, handleOf, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

const ids = (node: ParentNode, selector = '[id]') => [...node.querySelectorAll(selector)].map((element) => element.id);

function elementOf(node: ParentNode, selector: string) {
  const element = node.querySelector(selector);
  if (!element) {
    throw new Error(`There is no ${selector}`);
  }
  return element;
}

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
  it('renders a key the selected option declares once, and one only another option declares as an extra key (#5461)', async () => {
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

    // Under A nothing evaluates `b`, so the keyword describing the extra keys renders it, with its key and remove button
    expect(node.querySelector('#root_b-key')).toHaveValue('b');
    expect(ids(node, '#root_b')).toHaveLength(1);
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

  it('matches each option list once per level of data, so the matching grows linearly with depth (#4990)', () => {
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
    const counts = [1, 2, 3, 4, 5].map((depth) => {
      const counting = customizeValidator();
      const isValid = vi.spyOn(counting, 'isValid');
      createFormComponent({ schema, initialFormData: nested(depth) }, counting);
      return isValid.mock.calls.length;
    });
    const steps = counts.slice(1).map((count, index) => count - counts[index]);

    // Before, each level multiplied the matching done below it by the number of options it scored
    expect(new Set(steps).size).toBe(1);
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
    // v7 carried the index over, opening the new list on B2
    expect(getSelected(selectOf(node, 'root_x__anyof_select'))).toBe('B1');

    await user.selectOptions(selectOf(node, 'root_kind'), 'a');
    expect(getSelected(selectOf(node, 'root_x__anyof_select'))).toBe('A2');
  });

  it('keeps a switch the parent declines, and matches the data a parent pushes again, preferring the selection', async () => {
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
    const { node, rerender } = createFormComponent({ schema, formData: { o: { a: 'x' } }, onChange: () => undefined });
    await user.selectOptions(selectOf(node, 'root_o__anyof_select'), 'B');
    // The parent ignores the switch, which leaves the data the selection was made with, as on 6.11.0
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('1');

    rerender({ schema, formData: { o: { a: 'v' } }, onChange: () => undefined });
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('0');

    rerender({ schema, formData: { o: { b: 'z', a: 'w' } }, onChange: () => undefined });
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('1');
  });

  it('shows a pushed value under the option it fits best, even when the selected option fits it too', async () => {
    const schema: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
        { title: 'B', type: 'object', properties: { b: { type: 'string' } } },
      ],
    };
    const { node, rerender } = createFormComponent({ schema, formData: {}, onChange: () => undefined });
    await user.selectOptions(selectOf(node, 'root__oneof_select'), 'B');

    rerender({ schema, formData: { a: 'x' }, onChange: () => undefined });

    expect(selectOf(node, 'root__oneof_select')).toHaveValue('0');
    expect(node.querySelector('#root_a')).toHaveValue('x');
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

    /** Accepts every proposal, and pushes `{ a: 'x' }` back when its button is clicked, as an undo would */
    function UndoingParent() {
      const [value, setValue] = useState<unknown>({ a: 'x' });
      return (
        <>
          <Form schema={schema} validator={validator} formData={value} onChange={(event) => setValue(event.formData)} />
          <button id='undo' type='button' onClick={() => setValue({ a: 'x' })}>
            Undo
          </button>
        </>
      );
    }

    it('is matched again after a reset, as on 6.11.0', async () => {
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
    ])('is matched again when an accepting parent pushes it back, as on 6.11.0, $title', async ({ edits }) => {
      const { container } = render(<UndoingParent />);
      await user.selectOptions(selectOf(container, 'root__oneof_select'), 'B');
      if (edits) {
        await user.type(elementOf(container, '#root_b'), 'q');
      }
      expect(selectOf(container, 'root__oneof_select')).toHaveValue('1');

      await user.click(elementOf(container, '#undo'));

      expect(selectOf(container, 'root__oneof_select')).toHaveValue('0');
      expect(container.querySelector('#root_a')).toHaveValue('x');
    });
  });

  it('keeps the selection when the schema adds an option to the list', async () => {
    const options: RJSFSchema[] = [
      { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
      { title: 'B', type: 'object', properties: { b: { type: 'string' } } },
    ];
    const schemaOf = (oneOf: RJSFSchema[]): RJSFSchema => ({ type: 'object', properties: { o: { oneOf } } });
    // The parent keeps `{ o: {} }`, which every option fits, so only the selection shows `B`
    const props = { formData: { o: {} }, onChange: () => undefined };
    const { node, rerender } = createFormComponent({ schema: schemaOf(options), ...props });
    await user.selectOptions(selectOf(node, 'root_o__oneof_select'), 'B');

    const withC = schemaOf([...options, { title: 'C', type: 'object', properties: { c: { type: 'string' } } }]);
    rerender({ schema: withC, ...props });

    expect(selectOf(node, 'root_o__oneof_select')).toHaveValue('1');
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
});

describe('a condition swapped inside the selected option (#5465)', () => {
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

  it("replaces the old branch's default with the new branch's", async () => {
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

  it('reads the option the user selected, not the one the data matches best', async () => {
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
