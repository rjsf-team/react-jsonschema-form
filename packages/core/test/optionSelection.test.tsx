import type { FieldProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { userEvent } from '@testing-library/user-event';

import { useOptionSelection } from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

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

  it("keeps a selection a parent's new data still fits, and matches data that does not fit it again", async () => {
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
    // The parent ignores the switch, and A describes the data it keeps
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('0');

    rerender({ schema, formData: { o: { b: 'y' } }, onChange: () => undefined });
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('1');

    rerender({ schema, formData: { o: { b: 'z', a: 'w' } }, onChange: () => undefined });
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('1');

    rerender({ schema, formData: { o: { a: 'v' } }, onChange: () => undefined });
    expect(selectOf(node, 'root_o__anyof_select')).toHaveValue('0');
  });

  it('lets a custom AnyOfField select the option the field stubs its extra keys with', async () => {
    function FirstOrSecond({
      fieldPath,
      formData,
      options,
      registry,
      onChange,
    }: FieldProps & { options: RJSFSchema[] }) {
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

function getSelected(select: HTMLSelectElement) {
  return select.selectedOptions[0]?.textContent;
}
