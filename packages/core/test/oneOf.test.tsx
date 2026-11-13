import type {
  FieldProps,
  FieldTemplateProps,
  FormValidation,
  GenericObjectType,
  MultiSchemaFieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  UiSchema,
  WidgetProps,
} from '@rjsf/utils';
import { getByPath, isPlainObject, noop, optionDescriptionId, ROOT_FIELD_PATH } from '@rjsf/utils';
import type { ValidatorFunctions } from '@rjsf/validator-ajv8';
import { createPrecompiledValidator, customizeValidator } from '@rjsf/validator-ajv8';
import { compileSchemaValidatorsCode } from '@rjsf/validator-ajv8/compileSchemaValidators';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRequire } from 'node:module';

import SchemaField from '../src/components/fields/SchemaField.tsx';
import SelectWidget from '../src/components/widgets/SelectWidget.tsx';
import { getTestRegistry } from '../src/testing.ts';
import {
  createFormComponent,
  createFormRef,
  elementOf,
  getSelectedOptionValue,
  handleOf,
  input,
  setupConsoleWarnSuppression,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

/** The schema of #4990: five definitions, each offering the other four as the options of its `child` */
const CROSS_REFERENCING_SCHEMA: RJSFSchema = (() => {
  const names = ['A', 'B', 'C', 'D', 'E'];
  const optionsBut = (name?: string): RJSFSchema[] => [
    { type: 'null', title: 'None' },
    ...names.filter((other) => other !== name).map((other) => ({ $ref: `#/definitions/${other}` })),
  ];
  return {
    definitions: Object.fromEntries(
      names.map((name) => [
        name,
        { type: 'object', title: name, properties: { child: { oneOf: optionsBut(name) } } } satisfies RJSFSchema,
      ]),
    ),
    oneOf: optionsBut(),
  };
})();

/** Data for `CROSS_REFERENCING_SCHEMA` holding a `child` `depth` levels deep, the last one `null` */
function nestedChildren(depth: number): unknown {
  let data: unknown = null;
  for (let level = 0; level < depth; level += 1) {
    data = { child: data };
  }
  return data;
}

describe('oneOf', () => {
  it('should not render a select element if the oneOf keyword is not present', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll('select')).toHaveLength(0);
  });

  it('should render a select element if the oneOf keyword is present, merges top level required', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['baz'],
      properties: {
        baz: { type: 'number' },
      },
      description: 'top level description',
      oneOf: [
        {
          properties: {
            foo: { type: 'string' },
          },
        },
        {
          properties: {
            bar: { type: 'string' },
          },
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll('select')).toHaveLength(1);
    expect(node.querySelector('select')).toHaveAttribute('id', 'root__oneof_select');
    expect(node.querySelectorAll('span.rjsf-required')).toHaveLength(1);
    expect(node.querySelectorAll('#root__XxxOf__description')).toHaveLength(1);
    // The object renders beside the selected option under an id of its own, so nothing else claims the field's
    expect(node.querySelectorAll('#root__description')).toHaveLength(0);
    expect(node.querySelectorAll('#root_baz')).toHaveLength(1);
  });

  it('should render a select element if the oneOf keyword is present, merges top level and oneOf required', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['baz'],
      properties: {
        baz: { type: 'number' },
      },
      oneOf: [
        {
          required: ['foo'],
          properties: {
            foo: { type: 'string' },
          },
        },
        {
          properties: {
            bar: { type: 'string' },
          },
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll('select')).toHaveLength(1);
    expect(node.querySelector('select')).toHaveAttribute('id', 'root__oneof_select');
    expect(node.querySelectorAll('span.rjsf-required')).toHaveLength(2);
  });

  // The selector picks an option index, which isn't form data, and holds one unless its widget offers an empty choice,
  // as core's doesn't, so it isn't required (#5527); the field's own label carries the marker, and the selected option's
  // control stays required
  it("leaves a required field's option selector unrequired, marking only the field's label for a scalar option", () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        required: ['pet'],
        properties: {
          pet: {
            oneOf: [
              { title: 'Cat', type: 'string' },
              { title: 'Dog', type: 'number' },
            ],
          },
        },
      },
    });

    expect(screen.getByRole('combobox', { name: 'pet' })).not.toBeRequired();
    expect(screen.getByRole('textbox')).toBeRequired();
    expect(node.querySelectorAll('span.rjsf-required')).toHaveLength(1);
    expect(node.querySelector('label[for="root_pet"] span.rjsf-required')).toBeInTheDocument();
  });

  // The field's label is its one marker, so an option's own heading beneath it stays unmarked (#5573)
  it.each([
    ['object', { title: 'A', type: 'object', properties: { x: { type: 'string' } } }],
    ['array', { title: 'A', type: 'array', items: { type: 'string' } }],
  ] as const)("leaves a required field's titled %s option's heading unmarked", (_, option) => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        required: ['pet'],
        properties: { pet: { oneOf: [option, { title: 'B', type: 'number' }] } },
      },
    });

    expect(screen.getByRole('combobox', { name: 'pet' })).not.toBeRequired();
    expect(node.querySelectorAll('span.rjsf-required')).toHaveLength(1);
    expect(node.querySelector('#root_pet__label + span.rjsf-required')).toBeInTheDocument();
    expect(node.querySelector('#root_pet__title')).toBeInTheDocument();
    expect(node.querySelector('#root_pet__title + span.rjsf-required')).not.toBeInTheDocument();
  });

  it('should assign a default value and set defaults on option change', async () => {
    const { node, onChange, getFormData } = createFormComponent({
      schema: {
        oneOf: [
          {
            type: 'object',
            properties: {
              foo: { type: 'string', default: 'defaultfoo' },
            },
          },
          {
            type: 'object',
            properties: {
              foo: { type: 'string', default: 'defaultbar' },
            },
          },
        ],
      },
    });

    expect(getFormData()).toEqual({ foo: 'defaultfoo' });

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'defaultbar' },
      }),
      'root__oneof_select',
    );
  });

  it('should restore defaults when returning to an option with disjoint properties', async () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        oneOf: [
          {
            title: 'First method of identification',
            properties: {
              firstName: { type: 'string', default: 'Chuck' },
            },
          },
          {
            title: 'Second method of identification',
            properties: {
              idCode: { type: 'string' },
            },
          },
        ],
      },
    });
    const $select = node.querySelector<HTMLSelectElement>('#root__oneof_select');

    await user.selectOptions($select!, '1');
    await user.selectOptions($select!, '0');

    expect(node.querySelector('#root_firstName')).toHaveValue('Chuck');
  });

  it('should assign a default value and set defaults on option change when using refs', async () => {
    const { node, onChange, getFormData } = createFormComponent({
      schema: {
        oneOf: [
          {
            type: 'object',
            properties: {
              foo: { type: 'string', default: 'defaultfoo' },
            },
          },
          { $ref: '#/definitions/bar' },
        ],
        definitions: {
          bar: {
            type: 'object',
            properties: {
              foo: { type: 'string', default: 'defaultbar' },
            },
          },
        },
      },
    });

    expect(getFormData()).toEqual({ foo: 'defaultfoo' });

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'defaultbar' },
      }),
      'root__oneof_select',
    );
  });

  describe('keeps a value matching the old default when the new option does not declare one', () => {
    // The value cannot be told apart from one the user typed that happens to equal the default, so dropping it when
    // the new option declares nothing to refill it with would lose data the user or the caller supplied. The
    // computed defaults of the new option are no guide here: they also carry a nested object's leaf defaults, `[]`
    // for a required array and `false` for a required boolean, none of which the option declares for the key
    const kindFor = (name: string): RJSFSchema => ({ type: 'string', const: name, default: name });
    const schemaFor = (oldProperty: RJSFSchema, newProperty: RJSFSchema, required?: string[]): RJSFSchema => ({
      oneOf: [
        { title: 'a', type: 'object', required, properties: { kind: kindFor('a'), value: oldProperty } },
        { title: 'b', type: 'object', required, properties: { kind: kindFor('b'), value: newProperty } },
      ],
    });

    it('keeps a scalar', async () => {
      const { node, onChange } = createFormComponent({
        schema: schemaFor({ type: 'string', default: 'Anon' }, { type: 'string' }),
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', value: 'Anon' } }),
        'root__oneof_select',
      );
    });

    it('keeps an object the new option only gives leaf defaults', async () => {
      const properties: RJSFSchema['properties'] = {
        name: { type: 'string' },
        ratio: { type: 'number', default: 0 },
      };
      const { node, onChange } = createFormComponent({
        schema: schemaFor({ type: 'object', default: { name: 'a' }, properties }, { type: 'object', properties }),
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', value: { name: 'a', ratio: 0 } } }),
        'root__oneof_select',
      );
    });

    it('keeps a required array the new option would compute as empty', async () => {
      const { node, onChange } = createFormComponent({
        schema: schemaFor(
          { type: 'array', items: { type: 'number' }, default: [1] },
          { type: 'array', items: { type: 'number' } },
          ['value'],
        ),
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', value: [1] } }),
        'root__oneof_select',
      );
    });

    it('keeps a required boolean the new option would compute as false', async () => {
      const { node, onChange } = createFormComponent({
        schema: schemaFor({ type: 'boolean', default: true }, { type: 'boolean' }, ['value']),
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', value: true } }),
        'root__oneof_select',
      );
    });
  });

  it("should restore an option's object and array defaults when switching away from it and back (#4476)", async () => {
    // An array default takes a different route through both halves of the switch than an object one does, so the
    // issue's `arr` and `runners` are covered alongside its `runner`
    const optionFor = (name: string, ratio: number): RJSFSchema => ({
      title: name,
      type: 'object',
      properties: {
        kind: { type: 'string', const: name, default: name },
        runner: {
          // `extra` is not a declared property, so the form never holds it; writing it into the data would leave a
          // shape the next switch recognizes as neither option's default
          type: 'object',
          default: { name, extra: 'never-emitted' },
          properties: { name: { type: 'string' }, ratio: { type: 'number', default: 0 } },
        },
        arr: { type: 'array', items: { type: 'number' }, default: [ratio] },
        runners: {
          type: 'array',
          default: [{ name: `${name}-runner-1`, ratio }],
          items: { type: 'object', properties: { name: { type: 'string' }, ratio: { type: 'number' } } },
        },
      },
    });
    const { node, onChange } = createFormComponent({
      schema: { oneOf: [optionFor('a', 1), optionFor('b', 2)] },
    });
    const $select = node.querySelector<HTMLSelectElement>('#root__oneof_select');

    await user.selectOptions($select!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          kind: 'b',
          runner: { name: 'b', ratio: 0 },
          arr: [2],
          runners: [{ name: 'b-runner-1', ratio: 2 }],
        },
      }),
      'root__oneof_select',
    );

    await user.selectOptions($select!, '0');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          kind: 'a',
          runner: { name: 'a', ratio: 0 },
          arr: [1],
          runners: [{ name: 'a-runner-1', ratio: 1 }],
        },
      }),
      'root__oneof_select',
    );
  });

  const optionFor = (title: string, k: RJSFSchema): RJSFSchema => ({
    title,
    type: 'object',
    properties: { nested: { type: 'object', properties: { k }, required: ['k'] } },
  });
  const nestedKSchema: RJSFSchema = {
    oneOf: [optionFor('free', { type: 'string' }), optionFor('pinned', { type: 'string', const: 'x' })],
  };

  it("should fill a nested key holding a value the new option's const rejects with that const (#5777)", async () => {
    const { node, onChange } = createFormComponent({
      schema: nestedKSchema,
      initialFormData: { nested: { k: 'y' } },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { nested: { k: 'x' } } }),
      'root__oneof_select',
    );
  });

  it("should fill a nested key the user cleared with the new option's const (#5777)", async () => {
    const { node, onChange } = createFormComponent({
      schema: nestedKSchema,
    });
    const input = node.querySelector<HTMLInputElement>('#root_nested_k')!;
    await user.type(input, 'y');
    await user.clear(input);

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { nested: { k: 'x' } } }),
      'root__oneof_select',
    );
  });

  it("should apply the new option's default when the two options declare the property differently", async () => {
    // Sanitize rewrites the carried-over value when the options' nested shapes differ, dropping a property the new
    // option does not declare and injecting a leaf default it does, so staleness has to be judged against the data
    // as it arrived rather than against what sanitize left behind
    const optionFor = (name: string, properties: RJSFSchema['properties']): RJSFSchema => ({
      title: name,
      type: 'object',
      properties: {
        kind: { type: 'string', const: name, default: name },
        runner: { type: 'object', default: { name }, properties },
      },
    });
    const withRatio: RJSFSchema['properties'] = { name: { type: 'string' }, ratio: { type: 'number', default: 0 } };
    const { node, onChange } = createFormComponent({
      schema: { oneOf: [optionFor('a', withRatio), optionFor('b', { name: { type: 'string' } })] },
    });
    const $select = node.querySelector<HTMLSelectElement>('#root__oneof_select');

    await user.selectOptions($select!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', runner: { name: 'b' } } }),
      'root__oneof_select',
    );

    await user.selectOptions($select!, '0');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'a', runner: { name: 'a', ratio: 0 } } }),
      'root__oneof_select',
    );
  });

  it("should keep a clear of a property holding its own null default when the options' defaults for it differ (#5815)", async () => {
    const optionFor = (name: string): RJSFSchema => ({
      title: name,
      type: 'object',
      default: { value: name },
      properties: {
        kind: { type: 'string', const: name, default: name },
        value: { type: ['string', 'null'], default: null },
      },
    });
    const { node, onChange } = createFormComponent({ schema: { oneOf: [optionFor('a'), optionFor('b')] } });
    const input = node.querySelector<HTMLInputElement>('#root_value')!;
    await user.type(input, 'q');
    await user.clear(input);

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', value: undefined } }),
      'root__oneof_select',
    );
    expect(Object.hasOwn(onChange.mock.lastCall![0].formData, 'value')).toBe(true);
  });

  it("should fill a clear of a property holding its own null default with the new option's default for it under ancestorWins (#5817)", async () => {
    const optionFor = (name: string): RJSFSchema => ({
      title: name,
      type: 'object',
      default: { value: name },
      properties: {
        kind: { type: 'string', const: name, default: name },
        value: { type: ['string', 'null'], default: null },
      },
    });
    const { node, onChange } = createFormComponent({
      schema: { oneOf: [optionFor('a'), optionFor('b')] },
      defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' },
    });
    await user.clear(node.querySelector<HTMLInputElement>('#root_value')!);

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', value: 'b' } }),
      'root__oneof_select',
    );
  });

  it("should keep a clear of a property the parent's default fills under every option under ancestorWins (#5817)", async () => {
    const optionFor = (name: string, a: number): RJSFSchema => ({
      title: name,
      type: 'object',
      default: { a },
      properties: { a: { type: 'number' } },
    });
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        default: { f: { a: 1 } },
        properties: { f: { oneOf: [optionFor('A', 2), optionFor('B', 3)] } },
      },
      defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' },
    });
    await user.clear(node.querySelector<HTMLInputElement>('#root_f_a')!);

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_f__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { f: { a: undefined } } }),
      'root_f__oneof_select',
    );
    expect(Object.hasOwn(onChange.mock.lastCall![0].formData.f, 'a')).toBe(true);
  });

  it("should keep a clear of a property the field's own default fills under every option", async () => {
    const schema: RJSFSchema = {
      type: 'object',
      default: { a: 'p' },
      oneOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        { title: 'B', properties: { a: { type: 'string' } }, default: { a: 'p' } },
      ],
    };
    const { node, onChange } = createFormComponent({ schema });
    await user.clear(node.querySelector<HTMLInputElement>('#root_a')!);

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { a: undefined } }),
      'root__oneof_select',
    );
    expect(Object.hasOwn(onChange.mock.lastCall![0].formData, 'a')).toBe(true);
  });

  it("should keep a clear of a property the outer field's default fills under every option of an inner oneOf (#5824)", async () => {
    const schema: RJSFSchema = {
      type: 'object',
      default: { a: 'p' },
      anyOf: [
        {
          oneOf: [
            { title: 'A', default: { a: 'p' }, properties: { a: { type: 'string' } } },
            { title: 'B', properties: { a: { type: 'string' } } },
          ],
        },
      ],
    };
    const { node, onChange } = createFormComponent({ schema });
    await user.clear(node.querySelector<HTMLInputElement>('#root_a')!);

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { a: undefined } }),
      'root__oneof_select',
    );
    expect(Object.hasOwn(onChange.mock.lastCall![0].formData, 'a')).toBe(true);
  });

  it("should keep a clear in an item of an optional array, whose defaults fill neither option, under 'populateRequiredDefaults'", async () => {
    const optionFor = (title: string, value: string): RJSFSchema => ({
      title,
      properties: { a: { type: 'string', default: value } },
    });
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          list: {
            type: 'array',
            items: { type: 'object', required: ['a'], oneOf: [optionFor('A', 'x'), optionFor('B', 'y')] },
          },
        },
      },
      initialFormData: { name: 'n', list: [{ a: 'x' }] },
      defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
    });
    await user.clear(node.querySelector<HTMLInputElement>('#root_list_0_a')!);

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_list_0__oneof_select')!, '1');

    const item = onChange.mock.lastCall![0].formData.list[0];
    expect(item).toEqual({ a: undefined });
    expect(Object.hasOwn(item, 'a')).toBe(true);
  });

  describe('keeps a value the new option declares but the fill would not write', () => {
    // What an option declares and what `computeDefaults()` acts on are not the same set, and the deletion is only
    // safe where they agree. `sanitizeDataForNewSchema()` has already put the right value in each of these, so
    // removing the key would empty it for good
    const kindFor = (name: string): RJSFSchema => ({ type: 'string', const: name, default: name });

    it('when the new default is reached through allOf', async () => {
      const schema: RJSFSchema = {
        definitions: { modeB: { type: 'string', default: 'y' } },
        oneOf: [
          { title: 'a', type: 'object', properties: { kind: kindFor('a'), mode: { type: 'string', default: 'x' } } },
          {
            title: 'b',
            type: 'object',
            properties: { kind: kindFor('b'), mode: { title: 'Mode', allOf: [{ $ref: '#/definitions/modeB' }] } },
          },
        ],
      };
      const { node, onChange } = createFormComponent({ schema });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', mode: 'y' } }),
        'root__oneof_select',
      );
    });

    it('when the new default is reached through if/then', async () => {
      const schema: RJSFSchema = {
        oneOf: [
          { title: 'a', type: 'object', properties: { kind: kindFor('a'), mode: { type: 'string', default: 'x' } } },
          {
            title: 'b',
            type: 'object',
            properties: {
              kind: kindFor('b'),
              mode: { type: 'string', if: { minLength: 1 }, then: { default: 'y' }, else: { default: 'z' } },
            },
          },
        ],
      };
      const { node, onChange } = createFormComponent({ schema });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', mode: 'y' } }),
        'root__oneof_select',
      );
    });

    it("when constAsDefaults is 'never', so the fill writes no const", async () => {
      const schema: RJSFSchema = {
        oneOf: [
          { title: 'a', type: 'object', properties: { kind: { type: 'string', const: 'a', default: 'a' } } },
          { title: 'b', type: 'object', properties: { kind: { type: 'string', const: 'b' } } },
        ],
      };
      const { node, onChange } = createFormComponent({
        schema,
        defaultFormStateBehavior: { constAsDefaults: 'never' },
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b' } }),
        'root__oneof_select',
      );
    });

    it("when emptyObjectFields is 'skipDefaults', so the fill writes nothing", async () => {
      // Both sets of defaults are computed the same way, so they agree that there is nothing to replace
      const optionFor = (name: string): RJSFSchema => ({
        title: name,
        type: 'object',
        properties: {
          kind: kindFor(name),
          runner: { type: 'object', default: { name }, properties: { name: { type: 'string' } } },
        },
      });
      const { node, onChange } = createFormComponent({
        schema: { oneOf: [optionFor('a'), optionFor('b')] },
        initialFormData: { kind: 'a', runner: { name: 'a' } },
        defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', runner: { name: 'a' } } }),
        'root__oneof_select',
      );
    });
  });

  describe("applies the new option's default when the option itself is not an object", () => {
    // An option that is an array or a scalar declares its default on the option rather than on a property, so the
    // whole value is what goes stale
    it('replaces an array default', async () => {
      const schema: RJSFSchema = {
        oneOf: [
          { title: 'a', type: 'array', items: { type: 'number' }, default: [1] },
          { title: 'b', type: 'array', items: { type: 'number' }, default: [2] },
        ],
      };
      const { node, onChange } = createFormComponent({ schema });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: [2] }), 'root__oneof_select');
    });

    it('replaces an array-of-objects default', async () => {
      const optionFor = (name: string): RJSFSchema => ({
        title: name,
        type: 'array',
        default: [{ name: `${name}1` }],
        items: { type: 'object', properties: { name: { type: 'string' } } },
      });
      const { node, onChange } = createFormComponent({ schema: { oneOf: [optionFor('a'), optionFor('b')] } });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: [{ name: 'b1' }] }),
        'root__oneof_select',
      );
    });

    it('keeps an array the user edited away from the old default', async () => {
      const schema: RJSFSchema = {
        oneOf: [
          { title: 'a', type: 'array', items: { type: 'number' }, default: [1] },
          { title: 'b', type: 'array', items: { type: 'number' }, default: [2] },
        ],
      };
      const { node, onChange } = createFormComponent({ schema, initialFormData: [7, 8] });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: [7, 8] }), 'root__oneof_select');
    });
  });

  it('should replace an object supplied in formData that equals the old default', async () => {
    // Intended, and the cost of the fix rather than an oversight: a value equal to the old option's default cannot
    // be told apart from one the default wrote, and the form's own fill writes it at mount, so refusing to replace
    // a supplied value would leave #4476 unfixed for the case it was reported against
    const optionFor = (name: string): RJSFSchema => ({
      title: name,
      type: 'object',
      properties: {
        kind: { type: 'string', const: name, default: name },
        runner: {
          type: 'object',
          default: { name },
          properties: { name: { type: 'string' }, ratio: { type: 'number', default: 0 } },
        },
      },
    });
    const { node, onChange } = createFormComponent({
      schema: { oneOf: [optionFor('a'), optionFor('b')] },
      initialFormData: { kind: 'a', runner: { name: 'a', ratio: 0 } },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', runner: { name: 'b', ratio: 0 } } }),
      'root__oneof_select',
    );
  });

  it('should apply an option-level default when switching options', async () => {
    // A `default` on the option itself populates its keys exactly as a property-level one does, so it has to count
    // as the new option declaring a value for them
    const optionFor = (name: string): RJSFSchema => ({
      title: name,
      type: 'object',
      default: { kind: name, runner: { name } },
      properties: {
        kind: { type: 'string', const: name },
        runner: { type: 'object', properties: { name: { type: 'string' } } },
      },
    });
    const { node, onChange } = createFormComponent({ schema: { oneOf: [optionFor('a'), optionFor('b')] } });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', runner: { name: 'b' } } }),
      'root__oneof_select',
    );
  });

  it("should replace a value the old option's own uiSchema filled in", async () => {
    const optionFor = (name: string, mode: string): RJSFSchema => ({
      title: name,
      type: 'object',
      properties: { kind: { type: 'string', const: name, default: name }, mode: { type: 'string', default: mode } },
    });
    const { node, onChange } = createFormComponent({
      schema: { oneOf: [optionFor('a', 'x'), optionFor('b', 'y')] },
      uiSchema: { oneOf: [{ mode: { 'ui:initialValue': 'A0' } }, {}] },
      initialFormData: { kind: 'a', mode: 'A0' },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', mode: 'y' } }),
      'root__oneof_select',
    );
  });

  // Where the option switched to renders the key with the same uiSchema, its `ui:initialValue` still fills it out, as a
  // fresh mount of that option does; an option uiSchema of its own leaving it out renders it without
  it.each<{
    name: string;
    to: Partial<RJSFSchema>;
    uiSchemaOf?: (t: UiSchema) => UiSchema;
    minItems?: number;
    saved?: string[];
    expected: string[];
  }>([
    { name: 'a default the new option shares, under a new maxItems', to: { maxItems: 3 }, expected: ['i', 'i'] },
    { name: 'a new default', to: { default: ['y'] }, expected: ['i', 'i'] },
    { name: 'a new default without minItems', to: { default: ['y'] }, minItems: 0, expected: ['i'] },
    {
      name: "a new default, each option's uiSchema alike",
      to: { default: ['y'] },
      uiSchemaOf: (t) => ({ oneOf: [{ t }, { t }] }),
      expected: ['i', 'i'],
    },
    // The uiSchema the option switched to renders the key with fills it, though it differs from the old one elsewhere
    ...[
      { label: 'a new default', to: { default: ['y'] } },
      { label: 'a new maxItems', to: { maxItems: 3 } },
    ].map(({ label, to }) => ({
      name: `${label}, each option's uiSchema titling it apart`,
      to,
      uiSchemaOf: (t: UiSchema): UiSchema => ({
        oneOf: [{ t: { ...t, 'ui:title': 'A' } }, { t: { ...t, 'ui:title': 'B' } }],
      }),
      expected: ['i', 'i'],
    })),
    {
      name: "a new default, the new option's uiSchema titling it apart beside an additionalProperties uiSchema",
      to: { default: ['y'] },
      uiSchemaOf: (t) => ({
        oneOf: [{ t: { ...t, 'ui:title': 'A' } }, { t: { ...t, 'ui:title': 'B' }, additionalProperties: {} }],
      }),
      expected: ['i', 'i'],
    },
    {
      name: "a new default, the new option's uiSchema leaving it out over the field's",
      to: { default: ['y'] },
      uiSchemaOf: (t) => ({ t, oneOf: [{ t }, {}] }),
      expected: ['y', 'z'],
    },
    // An `additionalProperties` uiSchema renders no key the options declare, so the plain fill fills it on both sides
    {
      name: 'a new default, beside an additionalProperties uiSchema',
      to: { default: ['y'] },
      uiSchemaOf: (t) => ({ additionalProperties: t }),
      expected: ['y', 'z'],
    },
    {
      name: "a new default, the new option's uiSchema rendering it beside an additionalProperties uiSchema",
      to: { default: ['y'] },
      uiSchemaOf: (t) => ({ oneOf: [{ t }, { t: { items: { 'ui:initialValue': 'j' } }, additionalProperties: t }] }),
      expected: ['j', 'j'],
    },
    // The field's uiSchema alone renders the key, so a value only the plain fill gives was saved, not filled
    {
      name: 'a new default, a saved value the plain fill pads alike',
      to: { default: ['y'] },
      saved: ['x', 'z'],
      expected: ['x', 'z'],
    },
    // The field's uiSchema holds no entry for the key, so it renders with `{}`, never its `additionalProperties` one
    {
      name: 'a new default, a saved value an additionalProperties uiSchema fills alike',
      to: { default: ['y', 'y', 'y'] },
      uiSchemaOf: (t) => ({ additionalProperties: t }),
      saved: ['i', 'i'],
      expected: ['i', 'i'],
    },
    // The old option's uiSchema holds no entry for the key, so the plain fill filled it
    {
      name: "a new default, only the new option's uiSchema rendering it",
      to: { default: ['y'] },
      uiSchemaOf: (t) => ({ oneOf: [{}, { t }] }),
      expected: ['i', 'i'],
    },
  ])(
    'should fill out a key an items ui:initialValue filled anew as the option switched to renders it, for $name',
    async ({ to, uiSchemaOf = (t) => ({ t }), minItems = 2, saved, expected }) => {
      const optionFor = (kind: string, t: Partial<RJSFSchema>): RJSFSchema => ({
        title: kind,
        type: 'object',
        properties: {
          kind: { type: 'string', const: kind, default: kind },
          t: { type: 'array', minItems, items: { type: 'string', default: 'z' }, default: ['x'], ...t } as RJSFSchema,
        },
      });
      const t = { items: { 'ui:initialValue': 'i' } };
      const { node, onChange } = createFormComponent({
        schema: { oneOf: [optionFor('a', {}), optionFor('b', to)] },
        uiSchema: uiSchemaOf(t),
        initialFormData: saved && { kind: 'a', t: saved },
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', t: expected } }),
        'root__oneof_select',
      );
    },
  );

  // The fill reads the uiSchema of a field switched below the root, or of an array item, at the switched field's path
  it.each<{
    name: string;
    schemaOf: (option: RJSFSchema[]) => RJSFSchema;
    uiSchemaOf: (t: UiSchema) => UiSchema;
    select: string;
    formDataOf: (option: GenericObjectType) => unknown;
    expected?: string[];
  }>([
    {
      name: 'a property',
      schemaOf: (oneOf) => ({ type: 'object', properties: { o: { oneOf } } }),
      uiSchemaOf: (t) => ({ o: { t } }),
      select: '#root_o__oneof_select',
      formDataOf: (option) => ({ o: option }),
    },
    // An `additionalProperties` uiSchema renders no property the object declares
    ...[
      { label: 'its own', uiSchemaOf: (t: UiSchema): UiSchema => ({ additionalProperties: { t } }) },
      { label: 'an empty own', uiSchemaOf: (t: UiSchema): UiSchema => ({ o: {}, additionalProperties: { t } }) },
      {
        label: 'its options',
        uiSchemaOf: (t: UiSchema): UiSchema => ({ additionalProperties: { oneOf: [{}, { t }] } }),
      },
    ].map(({ label, uiSchemaOf }) => ({
      name: `a property beside an additionalProperties uiSchema in place of ${label}`,
      schemaOf: (oneOf: RJSFSchema[]): RJSFSchema => ({ type: 'object', properties: { o: { oneOf } } }),
      uiSchemaOf,
      select: '#root_o__oneof_select',
      formDataOf: (option: GenericObjectType) => ({ o: option }),
      expected: ['y', 'z'],
    })),
    // A list's `additionalItems` uiSchema renders none of its items
    {
      name: 'an array item beside an additionalItems uiSchema',
      schemaOf: (oneOf) => ({ type: 'array', minItems: 1, items: { oneOf } }),
      uiSchemaOf: (t) => ({ additionalItems: { t } }),
      select: '#root_0__oneof_select',
      formDataOf: (option) => [option],
      expected: ['y', 'z'],
    },
    {
      name: 'an array item',
      schemaOf: (oneOf) => ({ type: 'array', minItems: 1, items: { oneOf } }),
      uiSchemaOf: (t) => ({ items: { t } }),
      select: '#root_0__oneof_select',
      formDataOf: (option) => [option],
    },
  ])(
    'should fill out a key an items ui:initialValue filled anew when switching the options of $name',
    async ({ schemaOf, uiSchemaOf, select, formDataOf, expected = ['i', 'i'] }) => {
      const optionFor = (kind: string, fieldDefault: string[]): RJSFSchema => ({
        title: kind,
        type: 'object',
        properties: {
          kind: { type: 'string', const: kind, default: kind },
          t: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' }, default: fieldDefault },
        },
      });
      const { node, onChange } = createFormComponent({
        schema: schemaOf([optionFor('a', ['x']), optionFor('b', ['y'])]),
        uiSchema: uiSchemaOf({ items: { 'ui:initialValue': 'i' } }),
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>(select)!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: formDataOf({ kind: 'b', t: expected }) }),
        select.slice(1),
      );
    },
  );

  it('should fill out a key an items ui:initialValue under ui:definitions filled anew when switching options', async () => {
    const optionFor = (kind: string, fieldDefault: string[]): RJSFSchema => ({
      title: kind,
      type: 'object',
      properties: {
        kind: { type: 'string', const: kind, default: kind },
        t: { $ref: '#/$defs/T', default: fieldDefault },
      },
    });
    const { node, onChange } = createFormComponent({
      schema: {
        $defs: { T: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' } } },
        oneOf: [optionFor('a', ['x']), optionFor('b', ['y'])],
      },
      uiSchema: { 'ui:definitions': { '#/$defs/T': { items: { 'ui:initialValue': 'i' } } } },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', t: ['i', 'i'] } }),
      'root__oneof_select',
    );
  });

  it('should fill out a key an items ui:initialValue filled anew where the option switched to renders it through an option of its own', async () => {
    const t = (fieldDefault: string[]): RJSFSchema => ({
      type: 'array',
      minItems: 2,
      items: { type: 'string', default: 'z' },
      default: fieldDefault,
    });
    const kind = (name: string): RJSFSchema => ({ type: 'string', const: name, default: name });
    const ui = { t: { items: { 'ui:initialValue': 'i' } } };
    const { node, onChange } = createFormComponent({
      schema: {
        oneOf: [
          { title: 'a', type: 'object', properties: { kind: kind('a'), t: t(['x']) } },
          { title: 'b', type: 'object', properties: { kind: kind('b') }, oneOf: [{ properties: { t: t(['y']) } }] },
        ],
      },
      uiSchema: { oneOf: [ui, { oneOf: [ui] }] },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', t: ['i', 'i'] } }),
      'root__oneof_select',
    );
  });

  // Of the uiSchemas the option switched to holds for the key, the one that filled it where the old option rendered it
  it('should fill out a key an items ui:initialValue filled anew under the uiSchema that filled it, of those the option switched to holds', async () => {
    const t = (fieldDefault: string[]): RJSFSchema => ({
      type: 'array',
      minItems: 2,
      items: { type: 'string', default: 'z' },
      default: fieldDefault,
    });
    const kind = (name: string): RJSFSchema => ({ type: 'string', const: name, default: name });
    const iv = { items: { 'ui:initialValue': 'i' } };
    const ivj = { items: { 'ui:initialValue': 'j' } };
    const { node, onChange } = createFormComponent({
      schema: {
        oneOf: [
          { title: 'a', type: 'object', properties: { kind: kind('a'), t: t(['x']) } },
          {
            title: 'b',
            type: 'object',
            properties: { kind: kind('b'), t: t(['y']) },
            anyOf: [{ properties: { x: { type: 'string' } } }, { properties: { w: { type: 'string' } } }],
          },
        ],
      },
      uiSchema: { oneOf: [{ t: iv }, { t: ivj, anyOf: [{ t: iv }, {}] }] },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', t: ['i', 'i'] } }),
      'root__oneof_select',
    );
  });

  // Past a tuple an item's `additionalItems` uiSchema is its own
  it.each<{ name: string; additionalItemsOf: (d: string) => RJSFSchema; uiSchema: UiSchema; expected: unknown[] }>([
    {
      name: 'a scalar',
      additionalItemsOf: (d) => ({ type: 'string', default: d }),
      uiSchema: { 'ui:initialValue': 'i' },
      expected: ['k', 'i'],
    },
    {
      name: 'an array',
      additionalItemsOf: (d) => ({ type: 'array', minItems: 2, items: { type: 'string', default: 'z' }, default: [d] }),
      uiSchema: { items: { 'ui:initialValue': 'i' } },
      expected: ['k', ['i', 'i']],
    },
  ])(
    "should fill out a tuple's additional item $name its additionalItems uiSchema filled anew when switching options",
    async ({ additionalItemsOf, uiSchema, expected }) => {
      const optionFor = (kind: string, d: string): RJSFSchema => {
        const additionalItems = additionalItemsOf(d);
        return {
          title: kind,
          type: 'object',
          properties: {
            kind: { type: 'string', const: kind, default: kind },
            t: {
              type: 'array',
              minItems: 2,
              items: [{ type: 'string', default: 'k' }],
              additionalItems,
              ...(additionalItems.type === 'array' && { default: ['k', [d]] }),
            },
          },
        };
      };
      const { node, onChange } = createFormComponent({
        schema: { oneOf: [optionFor('a', 'x'), optionFor('b', 'y')] },
        uiSchema: { t: { additionalItems: uiSchema } },
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', t: expected } }),
        'root__oneof_select',
      );
    },
  );

  it('should fill a scalar key anew with the ui:initialValue the option switched to renders it with', async () => {
    const optionFor = (kind: string, fieldDefault: string): RJSFSchema => ({
      title: kind,
      type: 'object',
      properties: {
        kind: { type: 'string', const: kind, default: kind },
        t: { type: 'string', default: fieldDefault },
      },
    });
    const { node, onChange } = createFormComponent({
      schema: { oneOf: [optionFor('a', 'a'), optionFor('b', 'b')] },
      uiSchema: { oneOf: [{ t: { 'ui:initialValue': 'i' } }, { t: { 'ui:initialValue': 'j' } }] },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', t: 'j' } }),
      'root__oneof_select',
    );
  });

  it('should switch the same way wherever required is declared', async () => {
    // The field renders each option merged with the parent's `required` and `type`, so the defaults compared here
    // have to come from that same schema or the two placements disagree about what the old option had written
    const optionFor = (name: string, required?: string[]): RJSFSchema => ({
      title: name,
      type: 'object',
      ...(required ? { required } : {}),
      properties: {
        kind: { type: 'string', const: name, default: name },
        arr: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' }, default: [`${name}1`] },
      },
    });
    const schemaFor = (requiredOnParent: boolean): RJSFSchema => ({
      type: 'object',
      ...(requiredOnParent ? { required: ['arr'] } : {}),
      oneOf: requiredOnParent ? [optionFor('a'), optionFor('b')] : [optionFor('a', ['arr']), optionFor('b', ['arr'])],
    });
    const switchToB = async (requiredOnParent: boolean): Promise<unknown> => {
      const { node, onChange } = createFormComponent({
        schema: schemaFor(requiredOnParent),
        defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      return onChange.mock.lastCall![0].formData;
    };

    expect(await switchToB(false)).toEqual({ kind: 'b', arr: ['b1', 'z'] });
    expect(await switchToB(true)).toEqual({ kind: 'b', arr: ['b1', 'z'] });
  });

  it('should keep a value equal to a default the old option only computed', async () => {
    // `false` here is what the form computes for a required boolean, not something option a declares, so it is the
    // user's value and the new option's default does not displace it
    const schema: RJSFSchema = {
      oneOf: [
        {
          title: 'a',
          type: 'object',
          required: ['flag'],
          properties: { kind: { type: 'string', const: 'a', default: 'a' }, flag: { type: 'boolean' } },
        },
        {
          title: 'b',
          type: 'object',
          properties: { kind: { type: 'string', const: 'b', default: 'b' }, flag: { type: 'boolean', default: true } },
        },
      ],
    };
    const { node, onChange } = createFormComponent({ schema, initialFormData: { kind: 'a', flag: false } });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', flag: false } }),
      'root__oneof_select',
    );
  });

  it("should apply the new option's default to a readOnly property edited away from the old one", async () => {
    // Sanitize clears a readOnly value that no longer matches its option's default rather than replacing it, so the
    // key reaches the fill holding `undefined` and the new option's default only lands once the key is removed
    const optionFor = (kind: string, license: string): RJSFSchema => ({
      title: kind,
      type: 'object',
      properties: {
        kind: { type: 'string', const: kind, default: kind },
        license: { type: 'string', default: license, readOnly: true },
      },
    });
    const { node, onChange } = createFormComponent({
      schema: { oneOf: [optionFor('a', 'MIT'), optionFor('b', 'Apache')] },
      initialFormData: { kind: 'a', license: 'custom' },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', license: 'Apache' } }),
      'root__oneof_select',
    );
  });

  it("should apply the new option's default to a property whose type it changed", async () => {
    // Sanitize clears a value the new option cannot hold by assigning `undefined`, which is a value as far as the
    // fill is concerned, so the key has to be removed for the new option's default to land
    const schema: RJSFSchema = {
      oneOf: [
        {
          title: 'a',
          type: 'object',
          properties: {
            kind: { type: 'string', const: 'a', default: 'a' },
            runner: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
        {
          title: 'b',
          type: 'object',
          properties: {
            kind: { type: 'string', const: 'b', default: 'b' },
            runner: { type: 'string', default: 'solo' },
          },
        },
      ],
    };
    const { node, onChange } = createFormComponent({
      schema,
      initialFormData: { kind: 'a', runner: { name: 'typed' } },
    });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', runner: 'solo' } }),
      'root__oneof_select',
    );
  });

  it("should assign a default value and set defaults on option change with 'type': 'object' missing", async () => {
    const { node, onChange, getFormData } = createFormComponent({
      schema: {
        type: 'object',
        oneOf: [
          {
            properties: {
              foo: { type: 'string', default: 'defaultfoo' },
            },
          },
          {
            properties: {
              foo: { type: 'string', default: 'defaultbar' },
            },
          },
        ],
      },
    });

    expect(getFormData()).toEqual({ foo: 'defaultfoo' });

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'defaultbar' },
      }),
      'root__oneof_select',
    );
  });

  it('should assign a default value and set defaults on option change for scalar types schemas', async () => {
    const { node, onChange, getFormData } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          foo: {
            oneOf: [
              { type: 'string', default: 'defaultfoo' },
              { type: 'boolean', default: true },
            ],
          },
        },
      },
    });
    expect(getFormData()).toEqual({ foo: 'defaultfoo' });

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: true },
      }),
      'root_foo__oneof_select',
    );
  });

  it('should render a custom widget', () => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        {
          properties: {
            foo: { type: 'string' },
          },
        },
        {
          properties: {
            bar: { type: 'string' },
          },
        },
      ],
    };
    const widgets = {
      SelectWidget: () => <section id='CustomSelect'>Custom Widget</section>,
    };

    const { node } = createFormComponent({
      schema,
      widgets,
    });

    expect(node.querySelector('#CustomSelect')).toBeInTheDocument();
  });

  it('should change the rendered form when the select value is changed', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        {
          properties: {
            foo: { type: 'string' },
          },
        },
        {
          properties: {
            bar: { type: 'string' },
          },
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll('#root_foo')).toHaveLength(1);
    expect(node.querySelectorAll('#root_bar')).toHaveLength(0);

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect(node.querySelectorAll('#root_foo')).toHaveLength(0);
    expect(node.querySelectorAll('#root_bar')).toHaveLength(1);
  });

  it('should handle change events', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        {
          properties: {
            foo: { type: 'string' },
          },
        },
        {
          properties: {
            bar: { type: 'string' },
          },
        },
      ],
    };

    const { node, onChange } = createFormComponent({
      schema,
    });

    const input = node.querySelector('input#root_foo')!;
    await user.clear(input);
    await user.type(input, 'Lorem ipsum dolor sit amet');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'Lorem ipsum dolor sit amet' },
      }),
      'root_foo',
    );
  });

  it('should clear previous data when changing options', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        buzz: { type: 'string' },
      },
      oneOf: [
        {
          properties: {
            foo: { type: 'string' },
          },
        },
        {
          properties: {
            bar: { type: 'string' },
          },
        },
      ],
    };

    const { node, onChange } = createFormComponent({
      schema,
    });

    const buzzInput = node.querySelector('input#root_buzz')!;
    await user.clear(buzzInput);
    await user.type(buzzInput, 'Lorem ipsum dolor sit amet');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          buzz: 'Lorem ipsum dolor sit amet',
        },
      }),
      'root_buzz',
    );

    const fooInput = node.querySelector('input#root_foo')!;
    await user.clear(fooInput);
    await user.type(fooInput, 'Consectetur adipiscing elit');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          buzz: 'Lorem ipsum dolor sit amet',
          foo: 'Consectetur adipiscing elit',
        },
      }),
      'root_foo',
    );

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          buzz: 'Lorem ipsum dolor sit amet',
          foo: undefined,
        },
      }),
      'root__oneof_select',
    );
  });

  it('should support options with different types', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          oneOf: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
      },
    };

    const { node, onChange } = createFormComponent({
      schema,
    });

    const userIdInput = node.querySelector('input#root_userId')!;
    await user.clear(userIdInput);
    await user.type(userIdInput, '12345');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          userId: 12345,
        },
      }),
      'root_userId',
    );

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          userId: undefined,
        },
      }),
      'root_userId__oneof_select',
    );

    const userIdInput2 = node.querySelector('input#root_userId')!;
    await user.clear(userIdInput2);
    await user.type(userIdInput2, 'Lorem ipsum dolor sit amet');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          userId: 'Lorem ipsum dolor sit amet',
        },
      }),
      'root_userId',
    );
  });

  it('should support custom fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          oneOf: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
      },
    };

    const CustomField = () => <div id='custom-oneof-field' />;

    const { node } = createFormComponent({
      schema,
      fields: {
        OneOfField: CustomField,
      },
    });

    expect(node.querySelectorAll('#custom-oneof-field')).toHaveLength(1);
  });

  it('should support custom widget', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        choice: {
          oneOf: [
            {
              title: 'first',
              type: 'string',
              default: 'first',
              readOnly: true,
            },
            {
              title: 'second',
              type: 'string',
              default: 'second',
              readOnly: true,
            },
          ],
        },
      },
    };

    function CustomSelectWidget(props: WidgetProps) {
      const { schema, value } = props;
      // Remove the default so that we can select an empty value to clear the selection
      const schemaNoDefault = { ...schema, default: undefined };
      if (value === -1) {
        throw new Error('Value should not be -1 for oneOf');
      }
      return <SelectWidget {...props} schema={schemaNoDefault} />;
    }

    const { node, onChange } = createFormComponent({
      schema,
      uiSchema: { choice: { 'ui:placeholder': 'None' } },
      widgets: { SelectWidget: CustomSelectWidget },
      initialFormData: { choice: 'first' },
    });

    const select = node.querySelector('select');
    expect(select).toHaveValue(select?.options[1].value);

    await user.selectOptions(select!, select!.options[0].value);

    expect(select).toHaveValue(select?.options[0].value);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { choice: undefined },
      }),
      'root_choice__oneof_select',
    );
  });

  it('should pass form context to schema field', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          oneOf: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
      },
    };
    const formContext: Record<string, string> = { root: 'root-id', root_userId: 'userId-id' };

    function CustomSchemaField(props: FieldProps<unknown, RJSFSchema, Record<string, string>>) {
      const {
        registry: { formContext },
        id,
      } = props;
      return (
        <>
          <code id={formContext[id]}>Ha</code>
          <SchemaField {...props} />
        </>
      );
    }

    const { node } = createFormComponent({
      schema,
      initialFormData: { userId: 'foobarbaz' },
      formContext,
      fields: { SchemaField: CustomSchemaField },
    });

    const codeBlocks = node.querySelectorAll('code');
    expect(codeBlocks).toHaveLength(3);
    Object.keys(formContext).forEach((key) => {
      expect(node.querySelector(`code#${formContext[key]}`)).toBeInTheDocument();
    });
  });

  it('should select the correct field when the form is rendered from existing data', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          oneOf: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
      initialFormData: {
        userId: 'foobarbaz',
      },
    });

    expect(node.querySelector('select')).toHaveValue('1');
  });

  it('should select the correct field when the formData property is updated', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          oneOf: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
      },
    };

    const ref = createFormRef();
    const { node } = createFormComponent({
      ref,
      schema,
      initialFormData: {},
    });

    expect(node.querySelector('select')).toHaveValue('0');

    act(() => handleOf(ref).setFieldValue('userId', 'foobarbaz'));

    expect(node.querySelector('select')).toHaveValue('1');
  });

  it('should not change the selected option when entering values on a subschema with multiple required options', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        items: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'object',
              properties: {
                foo: {
                  type: 'integer',
                },
                bar: {
                  type: 'string',
                },
              },
              required: ['foo', 'bar'],
            },
          ],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    const $select = node.querySelector('select');

    expect($select).toHaveValue('0');

    await user.selectOptions($select!, $select!.options[1].value);

    expect($select).toHaveValue('1');

    const barInput = node.querySelector('input#root_items_bar')!;
    await user.clear(barInput);
    await user.type(barInput, 'Lorem ipsum dolor sit amet');

    expect($select).toHaveValue('1');
  });

  it("should empty the form data when switching from an option of type 'object'", async () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            foo: {
              type: 'integer',
            },
            bar: {
              type: 'string',
            },
          },
          required: ['foo', 'bar'],
        },
        {
          type: 'string',
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
      initialFormData: {
        foo: 1,
        bar: 'abc',
      },
    });

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect($select).toHaveValue('1');

    expect(node.querySelector('input#root')).toHaveValue('');
  });

  it('should use only the selected option when generating default values', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        {
          additionalProperties: false,
          properties: { lorem: { type: 'object' } },
        },
        {
          additionalProperties: false,
          properties: { ipsum: { type: 'object' } },
        },
        {
          additionalProperties: false,
          properties: { pyot: { type: 'object' } },
        },
      ],
    };

    const { node, onChange } = createFormComponent({
      schema,
      initialFormData: { lorem: {} },
    });

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect($select).toHaveValue('1');

    // After our fix, we no longer create unnecessary empty objects
    // The new behavior correctly avoids creating ipsum: {} when not needed
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { lorem: undefined } }),
      'root__oneof_select',
    );
  });

  it('should select oneOf in additionalProperties with oneOf', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        testProperty: {
          description: 'Any key name, fixed set of possible values',
          type: 'object',
          minProperties: 1,
          additionalProperties: {
            oneOf: [
              {
                title: 'my choice 1',
                type: 'object',
                properties: {
                  prop1: {
                    description: 'prop1 description',
                    type: 'string',
                  },
                },
                required: ['prop1'],
                additionalProperties: false,
              },
              {
                title: 'my choice 2',
                type: 'object',
                properties: {
                  prop2: {
                    description: 'prop2 description',
                    type: 'string',
                  },
                },
                required: ['prop2'],
                additionalProperties: false,
              },
            ],
          },
        },
      },
      required: ['testProperty'],
    };

    const { node, onChange } = createFormComponent({
      schema,
      initialFormData: { testProperty: { newKey: { prop2: 'foo' } } },
    });

    const $select: HTMLSelectElement | null = node.querySelector('select#root_testProperty_newKey__oneof_select');

    expect($select).toHaveValue('1');

    await user.selectOptions($select!, $select!.options[0].value);

    expect($select).toHaveValue('0');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          testProperty: { newKey: { prop1: undefined, prop2: undefined } },
        },
      }),
      'root_testProperty_newKey__oneof_select',
    );
  });

  it('should select oneOf dropdown be disabled when the schema is readOnly', async () => {
    const schema: RJSFSchema = {
      title: 'Example Schema',
      type: 'object',
      readOnly: true,
      properties: {
        contactPreference: {
          oneOf: [
            {
              $ref: '#/definitions/phoneContact',
            },
            {
              $ref: '#/definitions/emailContact',
            },
          ],
        },
      },
      required: ['contactPreference'],
      definitions: {
        phoneContact: {
          type: 'object',
          properties: {
            contactMethod: {
              type: 'string',
              enum: ['phone'],
            },
            phoneNumber: {
              type: 'string',
              pattern: '^[0-9]{10}$',
            },
          },
          required: ['contactMethod', 'phoneNumber'],
        },
        emailContact: {
          type: 'object',
          properties: {
            contactMethod: {
              type: 'string',
              enum: ['email'],
            },
            emailAddress: {
              type: 'string',
              format: 'email',
            },
          },
          required: ['contactMethod', 'emailAddress'],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
      initialFormData: {
        contactPreference: {
          contactMethod: 'phone',
          phoneNumber: '1231231231',
        },
      },
    });

    const $select: HTMLSelectElement | null = node.querySelector('select#root_contactPreference__oneof_select');

    expect($select).toHaveValue('0');
    expect($select).toBeDisabled();

    await user.selectOptions($select!, $select!.options[1].value);

    expect($select).toHaveValue('0');
  });

  it('keeps what is typed into a root option when another option holds a conditional (#5567)', async () => {
    const schema: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { animal: { type: 'string' } } },
        {
          title: 'B',
          type: 'object',
          properties: { animal: { type: 'string' } },
          allOf: [
            {
              if: { properties: { animal: { const: 'Cat' } } },
              then: { properties: { food: { type: 'string', default: 'meat' } } },
            },
          ],
        },
      ],
    };
    const { node, onChange } = createFormComponent({ schema });
    const input = elementOf(node, 'input#root_animal');

    await user.type(input, 'Fi');

    expect(input).toHaveValue('Fi');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { animal: 'Fi' } }), 'root_animal');
  });

  it('keeps the free-form object items both options share when switching options (#5736)', async () => {
    const tags: RJSFSchema = { type: 'array', items: { type: 'object' } };
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        { title: 'A', properties: { tags, a: { type: 'string' } } },
        { title: 'B', properties: { tags, b: { type: 'string' } } },
      ],
    };
    const { node, onChange } = createFormComponent({ schema, initialFormData: { tags: [{ k: 1 }], a: 'x' } });

    await user.selectOptions(elementOf(node, 'select'), 'B');

    expect(onChange.mock.lastCall?.[0].formData).toEqual({ tags: [{ k: 1 }] });
  });

  it.each([
    ['nullable cells', { type: 'array', items: { type: ['string', 'null'] } }],
    ['typeless cells', { type: 'array', items: {} }],
    ['no items', { type: 'array' }],
  ] as [string, RJSFSchema][])('keeps grid rows when switching to %s', async (_, rowB) => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        { title: 'A', properties: { grid: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
        { title: 'B', properties: { grid: { type: 'array', items: rowB } } },
      ],
    };
    const { node, onChange } = createFormComponent({ schema, initialFormData: { grid: [['a', 'b'], ['c']] } });

    await user.selectOptions(elementOf(node, 'select'), 'B');

    expect(onChange.mock.lastCall?.[0].formData).toEqual({ grid: [['a', 'b'], ['c']] });
  });

  it('leaves out an optional object the data does not hold when switching options, so it passes validation (#5768)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        { title: 'A', required: ['kind'], properties: { kind: { const: 'A' }, k: { type: 'string' } } },
        {
          title: 'B',
          required: ['kind'],
          properties: {
            kind: { const: 'B' },
            k: { type: 'string' },
            opt: { type: 'object', required: ['x'], properties: { x: { type: 'string' } } },
          },
        },
      ],
    };
    // The rendered `opt.x` input is `required`, which the browser's own validation would stop the submit on before the
    // schema's is reached
    const { node, onChange, onSubmit, onError } = createFormComponent({
      schema,
      initialFormData: { kind: 'A', k: 'a' },
      noHtml5Validate: true,
    });

    await user.selectOptions(elementOf(node, 'select'), 'B');
    await submitForm(node, user);

    expect(onChange.mock.lastCall?.[0].formData).toEqual({ kind: 'B', k: 'a' });
    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
  });

  it.each([
    ['the default behavior', undefined, { k: 'a', addr: { city: 'X' } }],
    ['skipDefaults', 'skipDefaults', { k: 'a' }],
    ['populateRequiredDefaults', 'populateRequiredDefaults', { k: 'a' }],
  ] as const)(
    'gives an optional object property the data does not hold the defaults a mount gives it under %s (#5768)',
    async (_title, emptyObjectFields, expected) => {
      const optionB: RJSFSchema = {
        title: 'B',
        properties: {
          k: { type: 'string' },
          addr: { type: 'object', properties: { city: { type: 'string', default: 'X' } } },
        },
      };
      const schemaWith = (oneOf: RJSFSchema[]): RJSFSchema => ({ type: 'object', oneOf });
      const defaultFormStateBehavior = emptyObjectFields ? { emptyObjectFields } : undefined;
      const { node, onChange } = createFormComponent({
        schema: schemaWith([{ title: 'A', properties: { k: { type: 'string' } } }, optionB]),
        initialFormData: { k: 'a' },
        defaultFormStateBehavior,
      });
      const mounted = createFormComponent({
        schema: schemaWith([optionB]),
        initialFormData: { k: 'a' },
        defaultFormStateBehavior,
      });

      await user.selectOptions(elementOf(node, 'select'), 'B');

      expect(onChange.mock.lastCall?.[0].formData).toEqual(expected);
      expect(mounted.getFormData()).toEqual(expected);
    },
  );

  it('gives nested values holding the old option const the new option const when switching options', async () => {
    const option = (title: string, a: number): RJSFSchema => ({
      title,
      required: ['kind'],
      properties: {
        kind: { const: title },
        w: {
          type: 'object',
          required: ['l', 'o', 's'],
          properties: {
            l: { type: 'array', const: [a], items: { type: 'number' } },
            o: { type: 'object', const: { a }, properties: { a: { type: 'number' } } },
            s: { type: 'number', const: a },
          },
        },
      },
    });
    const schema: RJSFSchema = { type: 'object', oneOf: [option('A', 1), option('B', 2)] };
    const { node, onChange } = createFormComponent({
      schema,
      initialFormData: { kind: 'A', w: { l: [1], o: { a: 1 }, s: 1 } },
    });

    await user.selectOptions(elementOf(node, 'select'), 'B');

    expect(onChange.mock.lastCall?.[0].formData).toEqual({ kind: 'B', w: { l: [2], o: { a: 2 }, s: 2 } });
  });

  it('drops a cleared nested key only the old option declares, rather than rendering it as an extra key (#5768)', async () => {
    const x = (key: string): RJSFSchema => ({
      type: 'object',
      additionalProperties: true,
      properties: { [key]: { type: 'string' } },
    });
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        { title: 'A', properties: { x: x('p') } },
        { title: 'B', properties: { x: x('q') } },
      ],
    };
    const { node, onChange } = createFormComponent({ schema });
    const input = elementOf(node, 'input#root_x_p');
    await user.type(input, 'v');
    await user.clear(input);

    await user.selectOptions(elementOf(node, 'select'), 'B');

    expect(node.querySelector('#root_x_p__key')).toBeNull();
    expect(Object.keys(onChange.mock.lastCall?.[0].formData.x)).toEqual([]);
  });

  it('fills a null array item with the new items default when switching to items of another type', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [
        { title: 'A', properties: { list: { type: 'array', items: { type: 'number' } } } },
        { title: 'B', properties: { list: { type: 'array', items: { type: 'string', default: 'x' } } } },
      ],
    };
    const { node, onChange } = createFormComponent({ schema, initialFormData: { list: [null] } });

    await user.selectOptions(elementOf(node, 'select'), 'B');

    expect(onChange.mock.lastCall?.[0].formData).toEqual({ list: ['x'] });
  });

  it('drops a cleared key only the old option declares when a condition of the new one fills it back in', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: true,
      oneOf: [
        { title: 'A', properties: { a: { type: 'string' } } },
        {
          title: 'B',
          properties: { k: { type: 'string', default: 'x' } },
          if: { properties: { k: { const: 'x' } }, required: ['k'] },
          then: { properties: { a: { type: 'number' } } },
        },
      ],
    };
    const { node, onChange } = createFormComponent({ schema });
    const input = elementOf(node, 'input#root_a');
    await user.type(input, 'v');
    await user.clear(input);

    await user.selectOptions(elementOf(node, 'select'), 'B');

    expect(Object.keys(onChange.mock.lastCall?.[0].formData)).toEqual(['k']);
  });

  describe('Arrays', () => {
    it('should correctly render mixed types for oneOf inside array items', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'object',
                  properties: {
                    foo: {
                      type: 'integer',
                    },
                    bar: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      expect(node.querySelector('.rjsf-array-item-add')).not.toEqual(null);

      await user.click(node.querySelector('.rjsf-array-item-add')!);

      const $select = node.querySelector('select');
      expect($select).not.toEqual(null);
      await user.selectOptions($select!, $select!.options[1].value);

      expect(node.querySelectorAll('input#root_items_0_foo')).toHaveLength(1);
      expect(node.querySelectorAll('input#root_items_0_bar')).toHaveLength(1);
    });

    it('should not change the selected option when switching order of items for oneOf inside array items', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              oneOf: [
                {
                  properties: {
                    foo: {
                      type: 'string',
                    },
                  },
                },
                {
                  properties: {
                    bar: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        initialFormData: {
          items: [
            {},
            {
              bar: 'defaultbar',
            },
          ],
        },
      });

      let selects = node.querySelectorAll('select');
      expect(selects[0]).toHaveValue('0');
      expect(selects[1]).toHaveValue('1');

      const moveUpBtns = node.querySelectorAll('.rjsf-array-item-move-up');
      await user.click(moveUpBtns[1]);

      selects = node.querySelectorAll('select');
      expect(selects[0]).toHaveValue('1');
      expect(selects[1]).toHaveValue('0');
    });

    it('should correctly update inputs for oneOf inside array items after being moved down', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              oneOf: [
                {
                  properties: {
                    foo: {
                      type: 'string',
                    },
                  },
                },
                {
                  properties: {
                    bar: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        initialFormData: {
          items: [{}, {}],
        },
      });

      const moveDownBtns = node.querySelectorAll('.rjsf-array-item-move-down');
      await user.click(moveDownBtns[0]);

      const strInputs = node.querySelectorAll('fieldset .rjsf-field-string input[type=text]');

      await user.clear(strInputs[1]);
      await user.type(strInputs[1], 'bar');

      expect(strInputs[1]).toHaveValue('bar');
    });

    it('should infer the value of an array with nested oneOfs properly', () => {
      // From https://github.com/rjsf-team/react-jsonschema-form/issues/2944
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          oneOf: [
            {
              properties: {
                lorem: {
                  type: 'string',
                },
              },
              required: ['lorem'],
            },
            {
              properties: {
                ipsum: {
                  oneOf: [
                    {
                      properties: {
                        day: {
                          type: 'string',
                        },
                      },
                    },
                    {
                      properties: {
                        night: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
              },
              required: ['ipsum'],
            },
          ],
        },
      };
      const { node } = createFormComponent({
        schema,
        initialFormData: [{ ipsum: { night: 'nicht' } }],
      });
      const outerOneOf = node.querySelector('select#root_0__oneof_select');
      expect(outerOneOf).toHaveValue('1');
      const innerOneOf = node.querySelector('select#root_0_ipsum__oneof_select');
      expect(innerOneOf).toHaveValue('1');
    });
  });

  describe('definitions', () => {
    it('should handle the $ref keyword correctly', async () => {
      const schema: RJSFSchema = {
        definitions: {
          fieldEither: {
            type: 'object',
            oneOf: [
              {
                type: 'object',
                properties: {
                  value: {
                    type: 'string',
                  },
                },
              },
              {
                type: 'object',
                properties: {
                  value: {
                    type: 'array',
                    items: {
                      $ref: '#/definitions/fieldEither',
                    },
                  },
                },
              },
            ],
          },
        },
        type: 'object',
        properties: {
          value: {
            type: 'array',
            items: {
              $ref: '#/definitions/fieldEither',
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      expect(node.querySelector('.rjsf-array-item-add')).not.toEqual(null);

      await user.click(node.querySelector('.rjsf-array-item-add')!);

      const $select = node.querySelector('select');
      expect($select).not.toEqual(null);
      await user.selectOptions($select!, $select!.options[1].value);

      // This works because the nested "add" button will now be the first to
      // appear in the dom
      await user.click(node.querySelector('.rjsf-array-item-add')!);

      expect($select).toHaveValue($select?.options[1].value);
    });

    it('should correctly set the label of the options', () => {
      const schema: RJSFSchema = {
        type: 'object',
        oneOf: [
          {
            title: 'Foo',
            properties: {
              foo: { type: 'string' },
            },
          },
          {
            properties: {
              bar: { type: 'string' },
            },
          },
          {
            $ref: '#/definitions/baz',
          },
        ],
        definitions: {
          baz: {
            title: 'Baz',
            properties: {
              baz: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const $select = node.querySelector('select');

      expect($select?.options[0].text).toEqual('Foo');
      expect($select?.options[1].text).toEqual('Option 2');
      expect($select?.options[2].text).toEqual('Baz');
    });

    it('should correctly set the label of the options, with schema title prefix', () => {
      const schema: RJSFSchema = {
        type: 'object',
        title: 'Root Title',
        oneOf: [
          {
            title: 'Foo',
            properties: {
              foo: { type: 'string' },
            },
          },
          {
            properties: {
              bar: { type: 'string' },
            },
          },
          {
            $ref: '#/definitions/baz',
          },
        ],
        definitions: {
          baz: {
            title: 'Baz',
            properties: {
              baz: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const $select = node.querySelector('select');

      expect($select?.options[0].text).toEqual('Foo');
      expect($select?.options[1].text).toEqual('Root Title option 2');
      expect($select?.options[2].text).toEqual('Baz');
    });

    it('should correctly set the label of the options, with uiSchema title prefix', () => {
      const schema: RJSFSchema = {
        type: 'object',
        oneOf: [
          {
            title: 'Foo',
            properties: {
              foo: { type: 'string' },
            },
          },
          {
            properties: {
              bar: { type: 'string' },
            },
          },
          {
            $ref: '#/definitions/baz',
          },
        ],
        definitions: {
          baz: {
            title: 'Baz',
            properties: {
              baz: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:title': 'My Title' },
      });

      const $select = node.querySelector('select');

      expect($select?.options[0].text).toEqual('Foo');
      expect($select?.options[1].text).toEqual('My Title option 2');
      expect($select?.options[2].text).toEqual('Baz');
    });

    it('should correctly set the label of the options, with uiSchema-based titles, for each oneOf option', () => {
      const schema: RJSFSchema = {
        type: 'object',
        oneOf: [
          {
            title: 'Foo',
            properties: {
              foo: { type: 'string' },
            },
          },
          {
            properties: {
              bar: { type: 'string' },
            },
          },
          {
            $ref: '#/definitions/baz',
          },
        ],
        definitions: {
          baz: {
            title: 'Baz',
            properties: {
              baz: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema: {
          oneOf: [
            {
              'ui:title': 'Custom foo',
            },
            {
              'ui:title': 'Custom bar',
            },
            {
              'ui:title': 'Custom baz',
            },
          ],
        },
      });
      const $select = node.querySelector('select');

      expect($select?.options[0].text).toEqual('Custom foo');
      expect($select?.options[1].text).toEqual('Custom bar');
      expect($select?.options[2].text).toEqual('Custom baz');

      // Also verify the uiSchema was passed down to the underlying widget by confirming the lable (in the legend)
      // matches the selected option's title
      expect($select).toHaveValue('0');
      const inputLabel = node.querySelector('legend #root__title');
      expect(inputLabel?.innerHTML).toEqual($select?.options[0].text);
    });

    it('should warn when the oneOf in the uiSchema is not an array, and pass the base uiSchema down', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
      const schema: RJSFSchema = {
        type: 'object',
        oneOf: [
          {
            title: 'Foo',
            properties: {
              foo: { type: 'string' },
            },
          },
          {
            properties: {
              bar: { type: 'string' },
            },
          },
          {
            $ref: '#/definitions/baz',
          },
        ],
        definitions: {
          baz: {
            title: 'Baz',
            properties: {
              baz: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:title': 'My Title',
          // @ts-expect-error: TS2353, deliberately not an array, to exercise the runtime warning below
          oneOf: { 'ui:title': 'UiSchema title' },
        },
      });

      expect(consoleWarnSpy).toHaveBeenLastCalledWith('uiSchema.oneOf is not an array for "root"');

      const $select = node.querySelector('select');

      // The base uiSchema's title labels the field, through its template, and the selected option keeps its own heading,
      // which says something else
      expect($select).toHaveValue('0');
      expect(node.querySelector('#root__label')?.closest('label')).toHaveTextContent('My Title');
      expect(node.querySelector('legend #root__title')).toHaveTextContent('Foo');
      consoleWarnSpy.mockRestore();
    });

    it('names a non-root oneOf field by its path as well as its id when warning', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          choice: {
            type: 'object',
            oneOf: [{ properties: { foo: { type: 'string' } } }, { properties: { bar: { type: 'string' } } }],
          },
        },
      };
      createFormComponent({
        schema,
        uiSchema: {
          // A nested field's uiSchema isn't checked as strictly as the root's, so unlike the test above this needs no
          // `@ts-expect-error` to hold a non-array `oneOf`
          choice: {
            oneOf: { 'ui:title': 'UiSchema title' },
          },
        },
      });

      expect(consoleWarnSpy).toHaveBeenLastCalledWith('uiSchema.oneOf is not an array for "root_choice" (choice)');
      consoleWarnSpy.mockRestore();
    });

    describe('a non-array uiSchema.oneOf', () => {
      const consoleWarnSuppression = setupConsoleWarnSuppression();

      // Both forms use the default idPrefix, so both warnings name `root` and are the same message. Two forms meant to
      // coexist on a page need distinct idPrefixes anyway, or their fields collide on the same DOM ids.
      it('should warn once, however many forms render it and however often they re-render', async () => {
        const schema: RJSFSchema = {
          oneOf: [
            { title: 'Foo', properties: { foo: { type: 'string' } } },
            { title: 'Bar', properties: { bar: { type: 'string' } } },
          ],
        };
        const uiSchema: UiSchema = {
          // @ts-expect-error: TS2353, deliberately not an array, to exercise the runtime warning below
          oneOf: { 'ui:title': 'UiSchema title' },
        };
        const { node } = createFormComponent({ schema, uiSchema });
        createFormComponent({ schema, uiSchema });
        await user.type(node.querySelector('input')!, 'abc');

        const warnings = consoleWarnSuppression.consoleSpy.mock.calls.filter(
          ([message]) => message === 'uiSchema.oneOf is not an array for "root"',
        );
        expect(warnings).toHaveLength(1);
      });
    });

    it('should correctly render mixed types for oneOf inside array items', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'object',
                  properties: {
                    foo: {
                      type: 'integer',
                    },
                    bar: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      expect(node.querySelector('.rjsf-array-item-add')).not.toEqual(null);

      await user.click(node.querySelector('.rjsf-array-item-add')!);

      const $select = node.querySelector('select');
      expect($select).not.toEqual(null);

      await user.selectOptions($select!, $select!.options[1].value);

      expect(node.querySelectorAll('input#root_items_0_foo')).toHaveLength(1);
      expect(node.querySelectorAll('input#root_items_0_bar')).toHaveLength(1);
    });

    it('should correctly infer the selected option based on value', () => {
      const schema: RJSFSchema = {
        $ref: '#/definitions/any',
        definitions: {
          chain: {
            type: 'object',
            title: 'Chain',
            properties: {
              id: {
                enum: ['chain'],
              },
              components: {
                type: 'array',
                items: { $ref: '#/definitions/any' },
              },
            },
          },

          map: {
            type: 'object',
            title: 'Map',
            properties: {
              id: { enum: ['map'] },
              fn: { $ref: '#/definitions/any' },
            },
          },

          to_absolute: {
            type: 'object',
            title: 'To Absolute',
            properties: {
              id: { enum: ['to_absolute'] },
              base_url: { type: 'string' },
            },
          },

          transform: {
            type: 'object',
            title: 'Transform',
            properties: {
              id: { enum: ['transform'] },
              property_key: { type: 'string' },
              transformer: { $ref: '#/definitions/any' },
            },
          },
          any: {
            oneOf: [
              { $ref: '#/definitions/chain' },
              { $ref: '#/definitions/map' },
              { $ref: '#/definitions/to_absolute' },
              { $ref: '#/definitions/transform' },
            ],
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        initialFormData: {
          id: 'chain',
          components: [
            {
              id: 'map',
              fn: {
                id: 'transform',
                property_key: 'uri',
                transformer: {
                  id: 'to_absolute',
                  base_url: 'http://localhost',
                },
              },
            },
          ],
        },
      });

      const rootId = node.querySelector<HTMLSelectElement>('select#root_id');
      expect(getSelectedOptionValue(rootId!)).toEqual('chain');
      const componentId = node.querySelector<HTMLSelectElement>('select#root_components_0_id');
      expect(getSelectedOptionValue(componentId!)).toEqual('map');

      const fnId = node.querySelector<HTMLSelectElement>('select#root_components_0_fn_id');
      expect(getSelectedOptionValue(fnId!)).toEqual('transform');

      const transformerId = node.querySelector<HTMLSelectElement>('select#root_components_0_fn_transformer_id');
      expect(getSelectedOptionValue(transformerId!)).toEqual('to_absolute');
    });

    it('should update formData to remove unnecessary data when oneOf option changes', async () => {
      const schema: RJSFSchema = {
        title: 'UFO Sightings',
        type: 'object',
        required: ['craftTypes'],
        properties: {
          craftTypes: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            title: 'Type of UFO',
            items: {
              oneOf: [
                {
                  title: 'Cigar Shaped',
                  type: 'object',
                  required: ['daysOfYear'],
                  properties: {
                    name: {
                      type: 'string',
                      title: 'What do you call it?',
                    },
                    daysOfYear: {
                      type: 'array',
                      minItems: 1,
                      uniqueItems: true,
                      title: 'What days of the year did you see it?',
                      items: {
                        type: 'number',
                        title: 'Day',
                      },
                    },
                  },
                },
                {
                  title: 'Round',
                  type: 'object',
                  required: ['keywords'],
                  properties: {
                    title: {
                      type: 'string',
                      title: 'What should we call it?',
                    },
                    keywords: {
                      type: 'array',
                      minItems: 1,
                      uniqueItems: true,
                      title: 'List of keywords related to the sighting',
                      items: {
                        type: 'string',
                        title: 'Keyword',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      };
      const { node, onChange, getFormData } = createFormComponent({
        schema,
      });

      // Added an empty array initially
      expect(getFormData()).toEqual({ craftTypes: [{ daysOfYear: [undefined] }] });

      const select: HTMLSelectElement | null = node.querySelector('select#root_craftTypes_0__oneof_select');

      await user.selectOptions(select!, select!.options[1].value);

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: {
            craftTypes: [{ keywords: [undefined], title: undefined, daysOfYear: undefined }],
          },
        }),
        'root_craftTypes_0__oneof_select',
      );
    });
  });

  describe('hideError works with oneOf', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          oneOf: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
      },
    };

    function customValidate(_: unknown, errors: FormValidation<{ userId?: number | string }>) {
      errors.userId?.addError('test');
      return errors;
    }

    it('should show error on options with different types', async () => {
      const { node } = createFormComponent({
        schema,
        customValidate,
      });

      const userIdInput = node.querySelector('input#root_userId')!;
      await user.clear(userIdInput);
      await user.type(userIdInput, '12345');
      await submitForm(node, user);

      let inputs = node.querySelectorAll('.rjsf-field.rjsf-field-error input[inputmode=decimal]');
      expect(inputs[0]).toHaveAttribute('id', 'root_userId');

      const $select = node.querySelector('select');

      await user.selectOptions($select!, $select!.options[1].value);

      const userIdInput2 = node.querySelector('input#root_userId')!;
      await user.clear(userIdInput2);
      await user.type(userIdInput2, 'Lorem ipsum dolor sit amet');
      await submitForm(node, user);

      inputs = node.querySelectorAll('.rjsf-field.rjsf-field-error input[type=text]');
      expect(inputs[0]).toHaveAttribute('id', 'root_userId');
    });
    it('should NOT show error on options with different types when hideError: true', async () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:hideError': true,
        },
        customValidate,
      });

      const userIdInput = node.querySelector('input#root_userId')!;
      await user.clear(userIdInput);
      await user.type(userIdInput, '12345');
      await submitForm(node, user);

      let inputs = node.querySelectorAll('.rjsf-field.rjsf-field-error input[inputmode=decimal]');
      expect(inputs).toHaveLength(0);

      const $select = node.querySelector('select');

      await user.selectOptions($select!, $select!.options[1].value);

      const userIdInput2 = node.querySelector('input#root_userId')!;
      await user.clear(userIdInput2);
      await user.type(userIdInput2, 'Lorem ipsum dolor sit amet');
      await submitForm(node, user);

      inputs = node.querySelectorAll('.rjsf-field.rjsf-field-error input[type=text]');
      expect(inputs).toHaveLength(0);
    });

    it('should tell the oneOf selector widget that its errors are hidden', async () => {
      const recordSelectorProps = vi.fn<(props: WidgetProps) => void>();
      function RecordingSelectWidget(props: WidgetProps) {
        if (props.name?.endsWith('__oneof_select')) {
          recordSelectorProps(props);
        }
        return <SelectWidget {...props} />;
      }

      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:hideError': true },
        customValidate,
        widgets: { SelectWidget: RecordingSelectWidget },
      });

      await submitForm(node, user);

      expect(recordSelectorProps.mock.lastCall?.[0]?.hideError).toBe(true);
    });
  });

  describe('OpenAPI discriminator support', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: {
        Foo: {
          title: 'Foo',
          type: 'object',
          properties: {
            code: { title: 'Code', default: 'foo_coding', enum: ['foo_coding'], type: 'string' },
          },
        },
        Bar: {
          title: 'Bar',
          type: 'object',
          properties: {
            code: { title: 'Code', default: 'bar_coding', enum: ['bar_coding'], type: 'string' },
          },
        },
        Baz: {
          title: 'Baz',
          type: 'object',
          properties: {
            code: { title: 'Code', default: 'baz_coding', enum: ['baz_coding'], type: 'string' },
          },
        },
      },
      discriminator: {
        propertyName: 'code',
        mapping: {
          foo_coding: '#/definitions/Foo',
          bar_coding: '#/definitions/Bar',
          baz_coding: '#/definitions/Baz',
        },
      },
      oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }, { $ref: '#/definitions/Baz' }],
    };
    it('Selects the first node by default when there is no formData', () => {
      const { node } = createFormComponent({
        schema,
      });
      const select = node.querySelector('select#root__oneof_select');
      expect(select).toHaveValue('0');
    });
    it('Selects the 3rd node by default when there is formData that points to it', () => {
      const { node } = createFormComponent({
        schema,
        initialFormData: { code: 'baz_coding' },
      });
      const select = node.querySelector('select#root__oneof_select');
      expect(select).toHaveValue('2');
    });
    describe('a non-string discriminator.propertyName', () => {
      const consoleWarnSuppression = setupConsoleWarnSuppression();

      it('warns when discriminator.propertyName is not a string', () => {
        const badSchema: RJSFSchema = {
          ...schema,
          // @ts-expect-error: TS2322, a `propertyName` that isn't a string is what this case checks
          discriminator: { propertyName: 5 },
        };
        const { node } = createFormComponent({
          schema: badSchema,
        });
        const select = node.querySelector('select#root__oneof_select');
        expect(select).toHaveValue('0');
        expect(consoleWarnSuppression.consoleSpy).toHaveBeenLastCalledWith(
          'Expecting discriminator to be a string, got "number" instead',
        );
      });
    });
  });
  it('puts the selector on the option the data fits when a custom parent field writes other data in place of a switch', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        choice: {
          oneOf: [
            { title: 'A', type: 'object', properties: { a: { type: 'string' } } },
            { title: 'B', type: 'object', properties: { b: { type: 'string' } }, required: ['b'] },
          ],
        },
      },
    };
    // Passes its data through, but keeps `choice` as it was, writing that back at the path in place of what was sent
    function KeepChoiceField(props: FieldProps<GenericObjectType>) {
      const { ObjectField } = props.registry.fields;
      return (
        <ObjectField
          {...props}
          onChange={(value, fieldPath, errorSchema, id) =>
            fieldPath === 'choice'
              ? props.onChange(props.formData?.choice, fieldPath, errorSchema, id)
              : props.onChange(value, fieldPath, errorSchema, id)
          }
        />
      );
    }
    const { node, getFormData } = createFormComponent({
      schema,
      uiSchema: { 'ui:field': KeepChoiceField },
      initialFormData: { choice: { a: 'x' } },
    });
    const select = elementOf(node, '#root_choice__oneof_select');

    await user.selectOptions(select, 'B');

    expect(getFormData()).toEqual({ choice: { a: 'x' } });
    // The selector's option values are the option indexes: '0' is A
    expect(select).toHaveValue('0');
    expect(node.querySelector('#root_choice_a')).toHaveValue('x');
  });

  describe('keeps the option picked for a value its container stores in place of a cleared one', () => {
    // Switching `'abc'` to `N` clears the value, which the string option would match again as its container stores it
    const options: RJSFSchema[] = [
      { title: 'S', type: ['string', 'null'] },
      { title: 'N', type: 'number' },
    ];

    it('an array item, stored as null', async () => {
      const { node, getFormData } = createFormComponent({
        schema: { type: 'array', items: { oneOf: options } },
        initialFormData: ['abc'],
      });
      const select = elementOf(node, '#root_0__oneof_select');

      await user.selectOptions(select, 'N');

      expect(getFormData()).toEqual([null]);
      // The selector's option values are the option indexes: '1' is N
      expect(select).toHaveValue('1');
    });

    it("an additional property, stored as ''", async () => {
      const { node, getFormData } = createFormComponent({
        schema: { type: 'object', additionalProperties: { oneOf: options } },
        initialFormData: { k: 'abc' },
      });
      const select = elementOf(node, '#root_k__oneof_select');

      await user.selectOptions(select, 'N');

      expect(getFormData()).toEqual({ k: '' });
      expect(select).toHaveValue('1');
    });
  });

  describe('Custom Field without ui:fieldReplacesAnyOrOneOf', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          type: 'number',
        },
        {
          type: 'string',
        },
      ],
    };
    const uiSchema = {
      'ui:field': () => <div className='custom-field'>Custom field</div>,
    };
    it('should be rendered once, beside the selected option, which renders its own field (#5358)', () => {
      const { node } = createFormComponent({ schema, uiSchema });
      const fields = node.querySelectorAll('.custom-field');
      expect(fields).toHaveLength(1);
      expect(node.querySelectorAll('.rjsf-field-number input#root')).toHaveLength(1);
    });
    it('should render <select>', () => {
      const { node } = createFormComponent({ schema, uiSchema });
      const selects = node.querySelectorAll('select');
      expect(selects).toHaveLength(1);
    });
  });

  describe('the selected option rendered for the same id as its field', () => {
    const europe: RJSFSchema = {
      title: 'Europe',
      oneOf: [
        { const: 'FR', title: 'France' },
        { const: 'DE', title: 'Germany' },
      ],
    };
    const regionSchema = (europeSchema: RJSFSchema): RJSFSchema => ({
      type: 'object',
      properties: {
        region: { oneOf: [{ title: 'None', type: 'null' }, { $ref: '#/$defs/europe' }] },
      },
      $defs: { europe: europeSchema },
    });
    const schema = regionSchema(europe);
    const formData = { region: 'DE' };
    const CustomField = () => <div className='custom-field'>Custom field</div>;

    it('labels the control once, with the field label', () => {
      const { node } = createFormComponent({ schema, initialFormData: formData });

      expect(node.querySelectorAll('label[for="root_region"]')).toHaveLength(1);
      // The field's label names the option's control and, through `aria-labelledby`, the option selector
      expect(screen.getAllByLabelText('region')).toEqual([
        node.querySelector('select#root_region__oneof_select'),
        node.querySelector('select#root_region'),
      ]);
      expect(screen.queryByLabelText('Europe')).toBeNull();
    });

    it('labels the control once, with the field label, when the field names FallbackField as its ui:field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { x: { oneOf: [{ type: 'string', title: 'Text' }, { type: 'number' }] } },
        },
        uiSchema: { x: { 'ui:field': 'FallbackField' } },
        initialFormData: { x: 'a' },
      });

      expect(node.querySelectorAll('label[for="root_x"]')).toHaveLength(1);
      expect(screen.getAllByLabelText('x')).toEqual([
        node.querySelector('select#root_x__oneof_select'),
        node.querySelector('input#root_x'),
      ]);
      expect(screen.queryByLabelText('Text')).toBeNull();
    });

    it('renders the field help once', () => {
      const { node } = createFormComponent({
        schema,
        initialFormData: formData,
        uiSchema: { region: { 'ui:help': 'pick a region' } },
      });

      expect(node.querySelectorAll('#root_region__help')).toHaveLength(1);
      expect(screen.getAllByText('pick a region')).toHaveLength(1);
    });

    it('renders the help an option declares for itself', () => {
      createFormComponent({
        schema,
        initialFormData: formData,
        uiSchema: { region: { oneOf: [{}, { 'ui:help': 'option help' }] } },
      });

      expect(screen.getByText('option help')).toBeInTheDocument();
    });

    it('describes the option once, under the id its control is described by', () => {
      const { node } = createFormComponent({
        schema: regionSchema({ ...europe, description: 'A country in Europe' }),
        initialFormData: formData,
      });

      expect(screen.getAllByText('A country in Europe')).toHaveLength(1);
      expect(node.querySelector('#root_region__description')).toHaveTextContent('A country in Europe');
      expect(node.querySelector('select#root_region')).toHaveAttribute(
        'aria-describedby',
        expect.stringContaining('root_region__description'),
      );
    });

    it("describes the option under an id of its own beneath the field's description", () => {
      const { node } = createFormComponent({
        schema: regionSchema({ ...europe, description: 'A country in Europe' }),
        uiSchema: { region: { 'ui:description': 'Where you live' } },
        initialFormData: formData,
      });

      expect(screen.getAllByText('Where you live')).toHaveLength(1);
      expect(screen.getAllByText('A country in Europe')).toHaveLength(1);
      expect(node.querySelectorAll('#root_region__description')).toHaveLength(1);
      expect(node.querySelector('#root_region__description')).toHaveTextContent('Where you live');
      expect(node.querySelector(`#${optionDescriptionId('root_region')}`)).toHaveTextContent('A country in Europe');
      expect(node.querySelector('select#root_region')).toHaveAttribute(
        'aria-describedby',
        expect.stringContaining(optionDescriptionId('root_region')),
      );
    });

    it("describes a checkbox option under an id of its own beneath the field's description", () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            x: {
              description: 'Field desc',
              oneOf: [
                { type: 'boolean', description: 'Opt desc' },
                { type: 'string', title: 'Text' },
              ],
            },
          },
        },
        initialFormData: { x: true },
      });

      expect(screen.getAllByText('Opt desc')).toHaveLength(1);
      expect(node.querySelectorAll('#root_x__description')).toHaveLength(1);
      expect(node.querySelector('#root_x__description')).toHaveTextContent('Field desc');
      expect(node.querySelector(`#${optionDescriptionId('root_x')}`)).toHaveTextContent('Opt desc');
    });

    it('leaves a checkbox option its own description when the field has none', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            x: {
              oneOf: [
                { type: 'boolean', description: 'Opt desc' },
                { type: 'string', title: 'Text' },
              ],
            },
          },
        },
        initialFormData: { x: true },
      });

      expect(screen.getAllByText('Opt desc')).toHaveLength(1);
      expect(node.querySelector('#root_x__description')).toHaveTextContent('Opt desc');
    });

    it.each([
      ['has no description', {}],
      ['has a description', { 'ui:description': 'Where you live' }],
    ])('hides the description of an option whose ui:label is false when the field %s', (_, fieldUiSchema) => {
      createFormComponent({
        schema: regionSchema({ ...europe, description: 'A country in Europe' }),
        uiSchema: { region: { ...fieldUiSchema, oneOf: [{}, { 'ui:label': false }] } },
        initialFormData: formData,
      });

      expect(screen.queryByText('A country in Europe')).toBeNull();
    });

    it('renders no second description under the field description id for a fallback value described apart', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            x: {
              title: 'X',
              description: 'Field desc',
              type: ['string', 'number'],
              if: { type: 'string' },
              then: { description: 'Value desc' },
            },
          },
        },
        initialFormData: { x: 'a' },
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelectorAll('#root_x__description')).toHaveLength(1);
      expect(node.querySelector('#root_x__description')).toHaveTextContent('Field desc');
    });

    it('describes an option whose constants render as a select', () => {
      createFormComponent({
        schema: {
          type: 'object',
          properties: {
            region: {
              oneOf: [
                { title: 'None', type: 'null' },
                {
                  type: 'boolean',
                  description: 'Yes or no',
                  oneOf: [
                    { const: true, title: 'Yes' },
                    { const: false, title: 'No' },
                  ],
                },
              ],
            },
          },
        },
        initialFormData: { region: true },
      });

      expect(screen.getAllByText('Yes or no')).toHaveLength(1);
    });

    it('describes the option with the ui:description it declares for itself', () => {
      const { node } = createFormComponent({
        schema,
        initialFormData: formData,
        uiSchema: { region: { oneOf: [{}, { 'ui:description': 'Pick a European country' }] } },
      });

      expect(node.querySelector('#root_region__description')).toHaveTextContent('Pick a European country');
    });

    it('renders the field ui:description once', () => {
      createFormComponent({
        schema,
        initialFormData: formData,
        uiSchema: { region: { 'ui:description': 'Where you live' } },
      });

      expect(screen.getAllByText('Where you live')).toHaveLength(1);
    });

    it('keeps the title and description of an object option', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          oneOf: [
            { title: 'Option A', description: 'The first option', properties: { a: { type: 'string' } } },
            { title: 'Option B', properties: { b: { type: 'number' } } },
          ],
        },
      });

      expect(node.querySelector('#root__title')).toHaveTextContent('Option A');
      expect(node.querySelector('#root__description')).toHaveTextContent('The first option');
    });

    it('labels a control once when the fallback UI renders the options of a field allowing several types', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            x: {
              title: 'X',
              type: ['string', 'number'],
              oneOf: [{ title: 'Text', description: 'Some text', minLength: 1 }, { title: 'Num' }],
            },
          },
        },
        uiSchema: { x: { oneOf: [{}, {}] } },
        initialFormData: { x: 'a' },
        useFallbackUiForUnsupportedType: true,
      });

      expect(node.querySelectorAll('label[for="root_x"]')).toHaveLength(1);
      expect(screen.getAllByLabelText('X')).toEqual([
        node.querySelector('select#root_x__oneof_select'),
        node.querySelector('input#root_x'),
      ]);
      expect(screen.getAllByText('Some text')).toHaveLength(1);
      expect(node.querySelector('#root_x__description')).toHaveTextContent('Some text');
    });

    it('renders a ui:field an option declares for itself', () => {
      const { node } = createFormComponent({
        schema: { oneOf: [{ type: 'number' }, { type: 'string' }] },
        uiSchema: { oneOf: [{ 'ui:field': CustomField }, {}] },
      });

      expect(node.querySelectorAll('.custom-field')).toHaveLength(1);
      expect(node.querySelector('input#root')).toBeNull();
    });

    it('renders an object field ui:field once, and the option with its own field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          oneOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'number' } } }],
        },
        uiSchema: { 'ui:field': CustomField },
      });

      expect(node.querySelectorAll('.custom-field')).toHaveLength(1);
      expect(node.querySelector('input#root_a')).toBeInTheDocument();
    });

    it('renders an option whose uiSchema entry is null beside a named field', () => {
      const { node } = createFormComponent({
        schema: { oneOf: [{ type: 'number' }, { type: 'string' }] },
        uiSchema: { 'ui:field': CustomField, oneOf: [null, {}] } as unknown as UiSchema,
      });

      expect(node.querySelectorAll('.custom-field')).toHaveLength(1);
      expect(node.querySelector('input#root')).toBeInTheDocument();
    });

    it('renders a named field once for a union nested in an option with its own uiSchema', () => {
      const { node } = createFormComponent({
        schema: { oneOf: [{ oneOf: [{ type: 'number' }, { type: 'string' }] }, { type: 'boolean' }] },
        uiSchema: { 'ui:field': CustomField, oneOf: [{ oneOf: [{}, {}] }, {}] },
      });

      expect(node.querySelectorAll('.custom-field')).toHaveLength(1);
      expect(node.querySelector('input#root')).toBeInTheDocument();
    });

    it('renders a field an option names for a union under another id, below a named field', () => {
      const { node } = createFormComponent({
        schema: {
          oneOf: [
            { type: 'object', properties: { x: { oneOf: [{ type: 'number' }, { type: 'string' }] } } },
            { type: 'boolean' },
          ],
        },
        uiSchema: {
          'ui:field': CustomField,
          oneOf: [{ x: { 'ui:field': CustomField, oneOf: [{}, {}] } }, {}],
        },
      });

      expect(node.querySelectorAll('.custom-field')).toHaveLength(2);
      expect(node.querySelector('select#root_x__oneof_select')).toBeInTheDocument();
      expect(node.querySelector('input#root_x')).toBeInTheDocument();
    });
  });

  describe('Custom Field with ui:fieldReplacesAnyOrOneOf', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          type: 'number',
        },
        {
          type: 'string',
        },
      ],
    };
    const uiSchema = {
      'ui:field': () => <div className='custom-field'>Custom field</div>,
      'ui:fieldReplacesAnyOrOneOf': true,
    };
    it('should be rendered once', () => {
      const { node } = createFormComponent({ schema, uiSchema });
      const fields = node.querySelectorAll('.custom-field');
      expect(fields).toHaveLength(1);
    });
    it('should not render <select>', () => {
      const { node } = createFormComponent({ schema, uiSchema });
      const selects = node.querySelectorAll('select');
      expect(selects).toHaveLength(0);
    });
    // An empty oneOf offers no choice to render, so the field is the schema without it, enabled as any field is (#5365)
    it('is not disabled when there are no options', () => {
      const recordDisabled = vi.fn<(disabled: boolean | undefined) => void>();
      function CustomField({ disabled }: FieldProps) {
        recordDisabled(disabled);
        return <div className='custom-field'>Custom field</div>;
      }
      createFormComponent({
        schema: { oneOf: [] },
        uiSchema: { 'ui:field': CustomField, 'ui:fieldReplacesAnyOrOneOf': true },
      });

      expect(recordDisabled).toHaveBeenLastCalledWith(false);
    });
  });

  describe('Boolean field value preservation', () => {
    it('should preserve boolean values when switching between oneOf options with shared properties', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              oneOf: [
                {
                  title: 'Type A',
                  properties: {
                    type: { type: 'string', enum: ['typeA'], default: 'typeA' },
                    showField: { type: 'boolean' },
                  },
                },
                {
                  title: 'Type B',
                  properties: {
                    type: { type: 'string', enum: ['typeB'], default: 'typeB' },
                    showField: { type: 'boolean' },
                  },
                },
              ],
            },
          },
        },
      };

      const { node, onChange } = createFormComponent({
        schema,
        initialFormData: {
          items: [{ type: 'typeA', showField: true }],
        },
        defaultFormStateBehavior: {
          mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
        },
      });

      // Switch to typeB
      const dropdown = node.querySelector('select[id="root_items_0__oneof_select"]');
      if (dropdown) {
        await user.selectOptions(dropdown, '1');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { items: [{ type: 'typeB', showField: true }] } }),
          'root_items_0__oneof_select',
        );
      }
    });

    it("keeps a clear both options declare the same way through a switch, under 'useDefaultIfFormDataUndefined'", async () => {
      const declared = { x: { type: 'string', default: 'D' } } as const;
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          p: {
            type: 'object',
            oneOf: [
              { title: 'A', properties: declared },
              { title: 'B', properties: declared },
            ],
          },
        },
      };
      const { node, onChange } = createFormComponent({
        schema,
        initialFormData: { p: { x: 'typed' } },
        defaultFormStateBehavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
      });

      await user.clear(node.querySelector('input#root_p_x') as HTMLInputElement);
      await user.selectOptions(node.querySelector('select#root_p__oneof_select') as HTMLSelectElement, 'B');

      expect(onChange.mock.lastCall?.[0].formData).toEqual({ p: { x: undefined } });
      expect(node.querySelector('input#root_p_x')).toHaveValue('');
    });

    it('should handle undefined boolean fields correctly when switching oneOf options', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              oneOf: [
                {
                  title: 'Type A',
                  properties: {
                    type: { type: 'string', enum: ['typeA'], default: 'typeA' },
                    showField: { type: 'boolean' },
                  },
                },
                {
                  title: 'Type B',
                  properties: {
                    type: { type: 'string', enum: ['typeB'], default: 'typeB' },
                    showField: { type: 'boolean' },
                  },
                },
              ],
            },
          },
        },
      };

      const { node, onChange } = createFormComponent({
        schema,
        initialFormData: {
          items: [{ type: 'typeA' }], // No showField defined
        },
        defaultFormStateBehavior: {
          mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
        },
      });

      // Switch to typeB
      const dropdown = node.querySelector('select[id="root_items_0__oneof_select"]');
      if (dropdown) {
        await user.selectOptions(dropdown, '1');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { items: [{ type: 'typeB', showField: undefined }] } }),
          'root_items_0__oneof_select',
        );
      }
    });
  });
  describe('constant options without a type (#4666)', () => {
    it('should render a select for a oneOf of consts without a type', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          myprop: {
            oneOf: [
              { title: 'none', const: 'X' },
              { title: 'some', const: 'some' },
            ],
          },
        },
      };
      const { node } = createFormComponent({ schema, initialFormData: { myprop: 'X' } });

      const select = node.querySelector<HTMLSelectElement>('select#root_myprop');
      expect(select).toBeInTheDocument();
      expect(getSelectedOptionValue(select!)).toEqual('none');
      expect(node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
    });

    it('should render a select for single value enum options without a type', async () => {
      const schema: RJSFSchema = {
        oneOf: [
          { type: 'string', enum: ['1'] },
          { type: 'string', enum: ['2'] },
        ],
      };
      const { node, onChange } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect(select).toBeInTheDocument();
      const option = [...select!.options].find((o) => o.text === '2');
      await user.selectOptions(select!, option!);

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: '2' }), 'root');
    });

    it('should render a select for a nested oneOf of consts selected through a $ref option', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          myprop: {
            oneOf: [{ title: 'none', type: 'object' }, { $ref: '#/$defs/some' }, { $ref: '#/$defs/mylist' }],
          },
        },
        $defs: {
          some: { title: 'some', const: 'some' },
          mylist: { oneOf: [{ const: 'foo' }, { const: 'bar' }] },
        },
      };
      const { node, onChange } = createFormComponent({ schema, initialFormData: { myprop: 'foo' } });

      expect(node.querySelector('#root_myprop__oneof_select')).toHaveValue('2');
      const select = node.querySelector<HTMLSelectElement>('select#root_myprop');
      expect(select).toBeInTheDocument();
      expect(getSelectedOptionValue(select!)).toEqual('foo');

      await user.selectOptions(select!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { myprop: 'bar' } }),
        'root_myprop',
      );
    });

    it('should preserve the value types of consts with mixed types', async () => {
      const schema: RJSFSchema = {
        oneOf: [
          { title: 'A', const: 'a' },
          { title: 'One', const: 1 },
          { title: 'Nothing', const: null },
        ],
      };
      const { node, onChange } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect(select).toBeInTheDocument();

      await user.selectOptions(select!, '1');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 1 }), 'root');

      await user.selectOptions(select!, '2');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: null }), 'root');
    });

    it.each([
      ['null', [null, 'a', 1]],
      ['boolean', [true, 'maybe']],
      ['number', [1, '10']],
    ])('should render a select of mixed type consts when the first const is %s', async (_, consts) => {
      const schema: RJSFSchema = { oneOf: consts.map((value) => ({ const: value })) };
      const { node, onChange } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect(select).toBeInTheDocument();
      expect(select!.options).toHaveLength(consts.length + 1);

      await user.selectOptions(select!, select!.options[2]);

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: consts[1] }), 'root');
    });

    it('should render a select of number consts that includes null', async () => {
      const schema: RJSFSchema = { oneOf: [{ const: null }, { const: 1 }, { const: 2 }] };
      const { node, onChange } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect(select).toBeInTheDocument();

      await user.selectOptions(select!, select!.options[2]);
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 1 }), 'root');

      await user.selectOptions(select!, select!.options[1]);
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: null }), 'root');
    });

    it.each([
      ['null, true and false', [null, true, false]],
      ['null and true', [null, true]],
      ['only true', [true]],
    ])('should render a select of boolean consts with %s', async (_, consts) => {
      const schema: RJSFSchema = { oneOf: consts.map((value) => ({ const: value })) };
      const { node, onChange } = createFormComponent({ schema });

      expect(node.querySelector('input[type=checkbox]')).not.toBeInTheDocument();
      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect(select).toBeInTheDocument();
      expect(select!.options).toHaveLength(consts.length + 1);

      await user.selectOptions(select!, select!.options[1]);

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: consts[0] }), 'root');
    });

    it('should render a select with the titles of boolean consts of exactly true and false', async () => {
      const schema: RJSFSchema = {
        oneOf: [
          { title: 'Yes', const: true },
          { title: 'No', const: false },
        ],
      };
      const { node, onChange } = createFormComponent({ schema });

      expect(node.querySelector('input[type=checkbox]')).not.toBeInTheDocument();
      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect(select).toBeInTheDocument();
      expect([...select!.options].map((option) => option.text)).toEqual(['', 'Yes', 'No']);

      await user.selectOptions(select!, select!.options[2]);

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: false }), 'root');
    });

    it('should keep the boolean type on the schema the field and widget are given', () => {
      const schemas: RJSFSchema[] = [];
      const FieldTemplate = ({ schema, children }: FieldTemplateProps) => {
        schemas.push(schema);
        return <div>{children}</div>;
      };
      const schema: RJSFSchema = {
        oneOf: [
          { title: 'Yes', const: true },
          { title: 'No', const: false },
        ],
      };
      createFormComponent({ schema, templates: { FieldTemplate } });

      expect(schemas.map(({ type }) => type)).toEqual(['boolean']);
    });

    it('should keep the label displayed for a select inferred from boolean consts', () => {
      // `getDisplayLabel()` hides the label of a `boolean` that has no `ui:widget`, so the inferred `select` is the
      // only reason this field still has one. A theme's FieldTemplate is where that label gets rendered, because the
      // select widget has none of its own
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      const FieldTemplate = ({ displayLabel, label, children }: FieldTemplateProps) => (
        <div>
          {displayLabel && <span className='shown-label'>{label}</span>}
          {children}
        </div>
      );
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          answer: {
            title: 'My Answer',
            oneOf: [
              { title: 'Yes', const: true },
              { title: 'No', const: false },
            ],
          },
        },
      };
      const { node } = createFormComponent({ schema, templates: { FieldTemplate } });

      expect(node.querySelector('.shown-label')).toHaveTextContent('My Answer');
    });

    it('should let the uiSchema override the select widget that boolean consts default to', () => {
      const schema: RJSFSchema = {
        oneOf: [
          { title: 'Yes', const: true },
          { title: 'No', const: false },
        ],
      };
      const { node } = createFormComponent({ schema, uiSchema: { 'ui:widget': 'checkbox' } });

      expect(node.querySelector('select#root')).not.toBeInTheDocument();
      expect(node.querySelector('input#root[type=checkbox]')).toBeInTheDocument();
    });

    it('should keep ui:widget winning over ui:options.widget when a widget is inferred', () => {
      // `getUiOptions()` reduces over the uiSchema in key order, so an inferred `ui:widget` merged into it would
      // decide that contest by where it landed rather than leaving the caller's own precedence alone
      const uiSchema: UiSchema = { 'ui:options': { widget: 'checkbox' }, 'ui:widget': 'radio' };
      const typeless: RJSFSchema = {
        oneOf: [
          { title: 'Yes', const: true },
          { title: 'No', const: false },
        ],
      };
      const typed: RJSFSchema = { type: 'boolean' };

      const inferred = createFormComponent({ schema: typeless, uiSchema });
      const explicit = createFormComponent({ schema: typed, uiSchema });

      expect(inferred.node.querySelectorAll('input#root__0[type=radio]')).toHaveLength(1);
      expect(explicit.node.querySelectorAll('input#root__0[type=radio]')).toHaveLength(1);
    });

    it('should keep the label when the caller spells the widget as a ui:option', () => {
      // `getDisplayLabel()` only reads `ui:widget`, so a widget named the other way has to reach it as that key or a
      // boolean loses the title that inferring the widget exists to preserve
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      const FieldTemplate = ({ displayLabel, label, children }: FieldTemplateProps) => (
        <div>
          {displayLabel && <span className='shown-label'>{label}</span>}
          {children}
        </div>
      );
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          answer: {
            title: 'My Answer',
            oneOf: [
              { title: 'Yes', const: true },
              { title: 'No', const: false },
            ],
          },
        },
      };
      const { node } = createFormComponent({
        schema,
        uiSchema: { answer: { 'ui:options': { widget: 'select' } } },
        templates: { FieldTemplate },
      });

      expect(node.querySelector('.shown-label')).toHaveTextContent('My Answer');
    });

    it('should render the anyOf options when a constant oneOf and anyOf disagree on the type', async () => {
      const schema: RJSFSchema = {
        oneOf: [{ const: 'a' }],
        anyOf: [{ const: 1 }, { const: 2 }],
      };
      const { node, onChange } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root')!;
      expect([...select.options].map((option) => option.text)).toEqual(['', '1', '2']);
      await user.selectOptions(select, '2');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 2 }), 'root');
    });

    it('should render the anyOf options when a constant oneOf and anyOf agree on the type', () => {
      const schema: RJSFSchema = {
        oneOf: [{ const: 'a' }],
        anyOf: [{ const: 'b' }, { const: 'c' }],
      };
      const { node } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect([...select!.options].map((option) => option.text)).toEqual(['', 'b', 'c']);
    });

    it('should not infer a type or write form data for an empty oneOf', () => {
      const schema: RJSFSchema = { type: 'object', properties: { myprop: { oneOf: [] } } };
      const { node, onChange } = createFormComponent({ schema, initialFormData: {} });

      expect(node.querySelector('.rjsf-unsupported-field')).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it.each([
      ['0', 0, 'input#root_myprop'],
      ['false', false, 'input#root_myprop[type=checkbox]'],
      ['an empty string', '', 'input#root_myprop[type=text]'],
    ])('should render a falsy const of %s selected through a $ref option', (_, value, selector) => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { myprop: { oneOf: [{ title: 'none', type: 'object' }, { $ref: '#/$defs/falsy' }] } },
        $defs: { falsy: { title: 'falsy', const: value } },
      };
      const { node } = createFormComponent({ schema, initialFormData: { myprop: value } });

      expect(node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
      expect(node.querySelector(selector)).toBeInTheDocument();
    });

    it('should render a select for a oneOf of only a null const', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { myprop: { title: 'X', oneOf: [{ title: 'None', const: null }] } },
      };
      const { node } = createFormComponent({ schema, initialFormData: { myprop: null } });

      const select = node.querySelector<HTMLSelectElement>('select#root_myprop');
      expect(select).toBeInTheDocument();
      expect([...select!.options].map((option) => option.text)).toEqual(['', 'None']);
      expect(select!.options[1].selected).toBe(true);
    });

    describe.each(['indexed', 'realValue'])('object and array consts (#5317) in the %s format', (optionValueFormat) => {
      const uiSchema: UiSchema = { v: { 'ui:options': { optionValueFormat } } };

      it('should render a select of object consts and select the one in the form data', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            v: {
              oneOf: [
                { const: { a: 1 }, title: 'One' },
                { const: { a: 2 }, title: 'Two' },
              ],
            },
          },
        };
        const { node, onChange } = createFormComponent({ schema, uiSchema, initialFormData: { v: { a: 1 } } });

        expect(node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
        const select = node.querySelector<HTMLSelectElement>('select#root_v')!;
        expect(getSelectedOptionValue(select)).toEqual('One');
        await user.selectOptions(select, 'Two');
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: { a: 2 } } }), 'root_v');
      });

      // The option widgets match an object const by deep equality, as the form data is never the const's own instance
      it('should render radios of object consts, check the one in the form data and select another', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            v: {
              oneOf: [
                { const: { a: 1 }, title: 'One' },
                { const: { a: 2 }, title: 'Two' },
              ],
            },
          },
        };
        const { onChange } = createFormComponent({
          schema,
          uiSchema: { v: { 'ui:widget': 'radio', 'ui:options': { optionValueFormat } } },
          initialFormData: { v: { a: 2 } },
        });

        const [one, two] = [screen.getByRole('radio', { name: 'One' }), screen.getByRole('radio', { name: 'Two' })];
        expect(two).toBeChecked();
        expect(one).not.toBeChecked();
        expect([one.id, two.id]).toEqual(['root_v__0', 'root_v__1']);
        await user.click(one);
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: { a: 1 } } }), 'root_v');
      });

      it('should check object consts by value, keep a selection in option order and deselect an equal one', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            v: {
              type: 'array',
              uniqueItems: true,
              items: {
                oneOf: [
                  { const: { a: 1 }, title: 'One' },
                  { const: { a: 2 }, title: 'Two' },
                ],
              },
            },
          },
        };
        const { onChange } = createFormComponent({
          schema,
          uiSchema: { v: { 'ui:widget': 'checkboxes', 'ui:options': { optionValueFormat } } },
          initialFormData: { v: [{ a: 2 }] },
        });

        expect(screen.getByRole('checkbox', { name: 'Two' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'One' })).not.toBeChecked();
        await user.click(screen.getByRole('checkbox', { name: 'One' }));
        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { v: [{ a: 1 }, { a: 2 }] } }),
          'root_v',
        );
        await user.click(screen.getByRole('checkbox', { name: 'Two' }));
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: [{ a: 1 }] } }), 'root_v');
      });

      it('should render a select of array and null consts labelled with their JSON', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { v: { anyOf: [{ const: [1, 2] }, { const: [3] }, { const: null }] } },
        };
        const { node, onChange } = createFormComponent({ schema, uiSchema, initialFormData: {} });

        const select = node.querySelector<HTMLSelectElement>('select#root_v')!;
        expect([...select.options].map((option) => option.text)).toEqual(['', '[1,2]', '[3]', 'null']);
        await user.selectOptions(select, '[3]');
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: [3] } }), 'root_v');
      });

      it('should select the array const in the form data', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { v: { anyOf: [{ const: [1, 2] }, { const: [3] }] } },
        };
        const { node } = createFormComponent({ schema, uiSchema, initialFormData: { v: [3] } });

        expect(getSelectedOptionValue(node.querySelector<HTMLSelectElement>('select#root_v')!)).toEqual('[3]');
      });
    });

    it.each<[string, RJSFSchema, unknown]>([
      [
        'object',
        {
          type: 'object',
          oneOf: [
            { const: { a: 1 }, title: 'One' },
            { const: { a: 2 }, title: 'Two' },
          ],
        },
        { a: 2 },
      ],
      [
        'array',
        {
          type: 'array',
          anyOf: [
            { const: [1], title: 'One' },
            { const: [2], title: 'Two' },
          ],
        },
        [2],
      ],
    ])('should render a select for a typed %s with constant options (#5317)', async (_, v, expected) => {
      const schema: RJSFSchema = { type: 'object', properties: { v } };
      const { node, onChange } = createFormComponent({ schema, initialFormData: {} });

      const select = node.querySelector<HTMLSelectElement>('select#root_v')!;
      expect([...select.options].map((option) => option.text)).toEqual(['', 'One', 'Two']);
      await user.selectOptions(select, 'Two');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: expected } }), 'root_v');
      expect(getSelectedOptionValue(select)).toEqual('Two');
    });

    it('should keep the declared type and label of a typed object select (#5317)', () => {
      const schemaTypes: unknown[] = [];
      const CustomSelect = (props: WidgetProps) => {
        schemaTypes.push(props.schema.type);
        return <SelectWidget {...props} />;
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          v: {
            type: 'object',
            title: 'Pick one',
            oneOf: [
              { const: { a: 1 }, title: 'One' },
              { const: { a: 2 }, title: 'Two' },
            ],
          },
        },
      };
      const { node } = createFormComponent({ schema, uiSchema: { v: { 'ui:widget': CustomSelect } } });

      expect(schemaTypes).toContain('object');
      expect(schemaTypes).not.toContain('string');
      expect(node.querySelector('label[for=root_v]')).toHaveTextContent('Pick one');
    });

    it('should keep the object type of a typeless object select, as a typed one does (#5317)', () => {
      const schemaTypes: unknown[] = [];
      const CustomSelect = (props: WidgetProps) => {
        schemaTypes.push(props.schema.type);
        return <SelectWidget {...props} />;
      };
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          v: {
            oneOf: [
              { const: { a: 1 }, title: 'One' },
              { const: { a: 2 }, title: 'Two' },
            ],
          },
        },
      };
      createFormComponent({ schema, uiSchema: { v: { 'ui:widget': CustomSelect } } });

      expect(schemaTypes).toContain('object');
      expect(schemaTypes).not.toContain('string');
    });

    it('should render a select, not NullField, for constant options whose type list starts with null', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          v: {
            type: ['null', 'object', 'string'],
            oneOf: [
              { const: null, title: 'None' },
              { const: { a: 1 }, title: 'One' },
              { const: 'b', title: 'Bee' },
            ],
          },
        },
      };
      const { node, onChange } = createFormComponent({ schema, initialFormData: {} });

      const select = node.querySelector<HTMLSelectElement>('select#root_v')!;
      expect([...select.options].map((option) => option.text)).toEqual(['', 'None', 'One', 'Bee']);
      await user.selectOptions(select, 'One');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: { a: 1 } } }), 'root_v');
    });

    it.each<[string, RJSFSchema['type']]>([
      ['starts with null', ['null', 'number', 'boolean']],
      ['does not start with null', ['number', 'null', 'boolean']],
    ])(
      'should keep the value of each constant whose type list %s, rather than cast it to the first type',
      async (_, type) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            v: {
              type,
              oneOf: [
                { const: null, title: 'None' },
                { const: 1, title: 'One' },
                { const: true, title: 'Yes' },
              ],
            },
          },
        };
        const { node, onChange } = createFormComponent({ schema, initialFormData: {} });

        const select = node.querySelector<HTMLSelectElement>('select#root_v')!;
        await user.selectOptions(select, 'Yes');
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: true } }), 'root_v');
        expect(getSelectedOptionValue(select)).toEqual('Yes');
      },
    );

    it('should label a select whose type list starts with boolean among other types', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          v: { title: 'Answer', type: ['boolean', 'string'], oneOf: [{ const: true }, { const: 'maybe' }] },
        },
      };
      const { node } = createFormComponent({ schema, uiSchema: { v: {} } });

      expect(node.querySelector('select#root_v')).toBeInTheDocument();
      expect(node.querySelector('label[for=root_v]')).toHaveTextContent('Answer');
    });

    it('should render a select, not a checkbox, for a nullable boolean whose unlabelled constants include null', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          v: { type: ['boolean', 'null'], oneOf: [{ const: true }, { const: false }, { const: null }] },
        },
      };
      const { node, onChange } = createFormComponent({ schema, initialFormData: {} });

      const select = node.querySelector<HTMLSelectElement>('select#root_v')!;
      expect([...select.options].map((option) => option.text)).toEqual(['', 'Yes', 'No', 'null']);
      await user.selectOptions(select, 'null');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: null } }), 'root_v');
    });

    it('should edit the properties of a typed object whose oneOf is empty rather than render a select', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          v: { type: 'object', properties: { name: { type: 'string' } }, oneOf: [] },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input#root_v_name')).toBeInTheDocument();
      expect(node.querySelector('select#root_v')).not.toBeInTheDocument();
    });

    it.each(['select', 'radio'])(
      'should show only the array constant that is the whole form data as selected in a %s',
      (widget) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            v: {
              oneOf: [
                { const: 'a', title: 'A' },
                { const: 'b', title: 'B' },
                { const: ['a', 'b'], title: 'Both' },
              ],
            },
          },
        };
        const { node } = createFormComponent({
          schema,
          uiSchema: { v: { 'ui:widget': widget } },
          initialFormData: { v: ['a', 'b'] },
        });

        if (widget === 'select') {
          expect(getSelectedOptionValue(node.querySelector<HTMLSelectElement>('select#root_v')!)).toEqual('Both');
        } else {
          const checked = [...node.querySelectorAll<HTMLInputElement>('input[type=radio]')].filter((r) => r.checked);
          expect(checked.map((radio) => radio.closest('label')?.textContent)).toEqual(['Both']);
        }
      },
    );

    it('should check only the selected object constant in a radio group, with no duplicate keys', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      try {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            v: {
              oneOf: [
                { const: { a: 1 }, title: 'One' },
                { const: { a: 2 }, title: 'Two' },
              ],
            },
          },
        };
        const { node, onChange } = createFormComponent({ schema, uiSchema: { v: { 'ui:widget': 'radio' } } });

        await user.click(node.querySelector('input[type=radio][value="1"]')!);
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: { a: 2 } } }), 'root_v');
        const radios = node.querySelectorAll<HTMLInputElement>('input[type=radio]');
        expect([...radios].map((radio) => radio.checked)).toEqual([false, true]);
        expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything());
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('should render a radio group for typed array constants and pick one whole array', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          v: {
            type: 'array',
            oneOf: [
              { const: [1], title: 'One' },
              { const: [2], title: 'Two' },
            ],
          },
        },
      };
      const { node, onChange } = createFormComponent({ schema, uiSchema: { v: { 'ui:widget': 'radio' } } });

      await user.click(node.querySelector('input[type=radio][value="1"]')!);

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: [2] } }), 'root_v');
    });

    it.each<[string, RJSFSchema, unknown]>([
      ['object', { type: 'object', title: 'Pick one', enum: [{ a: 1 }, { a: 2 }] }, { a: 2 }],
      ['array', { type: 'array', title: 'Pick one', enum: [[1], [2]] }, [2]],
    ])('should render a labelled select for a typed %s enum, as for its oneOf spelling', async (_, v, expected) => {
      const schema: RJSFSchema = { type: 'object', properties: { v } };
      const { node, onChange } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root_v');
      expect(select).toBeInTheDocument();
      expect(node.querySelector('label[for=root_v]')).toHaveTextContent('Pick one');
      await user.selectOptions(select!, select!.options[2]);
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: expected } }), 'root_v');
    });

    it('should render a select, not NullField, for an enum whose type list starts with null', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { v: { type: ['null', 'object', 'array'], enum: [null, { a: 1 }, [2]] } },
      };
      const { node, onChange } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root_v');
      expect(select).toBeInTheDocument();
      await user.selectOptions(select!, select!.options[2]);
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: { a: 1 } } }), 'root_v');
    });

    it('should fill a required null select typed null with null, as NullField does', async () => {
      const schema: RJSFSchema = { type: 'object', required: ['v'], properties: { v: { type: 'null', enum: [null] } } };
      const { node, onSubmit } = createFormComponent({ schema });

      await submitForm(node, user);

      expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { v: null } }), expect.anything());
    });

    describe('sanitizing the data a condition on an object constant select allows once another is picked', () => {
      const plan: RJSFSchema = {
        type: 'object',
        oneOf: [
          { const: { tier: 1 }, title: 'Basic' },
          { const: { tier: 2 }, title: 'Pro' },
        ],
      };
      const colorsByTier: RJSFSchema = {
        then: { properties: { color: { enum: ['red', 'green'] } } },
        else: { properties: { color: { enum: ['blue'] } } },
      };

      it.each<[string, RJSFSchema]>([
        [
          'a property',
          {
            type: 'object',
            properties: { plan, color: { type: 'string' } },
            if: { properties: { plan: { const: { tier: 1 } } } },
            ...colorsByTier,
          },
        ],
        [
          'a property an allOf declares',
          {
            type: 'object',
            allOf: [{ properties: { plan } }],
            properties: { color: { type: 'string' } },
            if: { properties: { plan: { const: { tier: 1 } } } },
            ...colorsByTier,
          },
        ],
        [
          'a property beside an anyOf of required lists',
          {
            type: 'object',
            properties: { plan, color: { type: 'string' } },
            anyOf: [{ required: ['plan'] }, { required: ['color'] }],
            if: { properties: { plan: { const: { tier: 1 } } } },
            ...colorsByTier,
          },
        ],
        [
          'a property a oneOf option declares',
          {
            type: 'object',
            properties: { color: { type: 'string' } },
            oneOf: [{ properties: { plan } }],
            if: { properties: { plan: { const: { tier: 1 } } } },
            ...colorsByTier,
          },
        ],
        [
          'a property the oneOf of a oneOf option declares',
          {
            type: 'object',
            properties: { color: { type: 'string' } },
            oneOf: [{ oneOf: [{ properties: { plan } }] }],
            if: { properties: { plan: { const: { tier: 1 } } } },
            ...colorsByTier,
          },
        ],
        [
          'a property the closest-matching option of a nested oneOf declares',
          {
            type: 'object',
            properties: { color: { type: 'string' } },
            oneOf: [
              {
                oneOf: [{ properties: { size: { type: 'number' } }, required: ['size'] }, { properties: { plan } }],
              },
            ],
            if: { properties: { plan: { const: { tier: 1 } } } },
            ...colorsByTier,
          },
        ],
      ])('should sanitize for %s', async (_, schema) => {
        const { node, onChange } = createFormComponent({
          schema,
          initialFormData: { plan: { tier: 1 }, color: 'red' },
        });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('select#root_plan')!, 'Pro');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { plan: { tier: 2 }, color: 'blue' } }),
          'root_plan',
        );
      });

      it('should sanitize for an array item', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { plans: { type: 'array', items: plan }, color: { type: 'string' } },
          if: { properties: { plans: { items: { const: { tier: 1 } } } } },
          ...colorsByTier,
        };
        const { node, onChange } = createFormComponent({
          schema,
          initialFormData: { plans: [{ tier: 1 }], color: 'red' },
        });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('select#root_plans_0')!, 'Pro');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { plans: [{ tier: 2 }], color: 'blue' } }),
          'root_plans_0',
        );
      });

      it('should sanitize for a property whose object constants are written as $refs', async () => {
        const schema: RJSFSchema = {
          definitions: { basic: { const: { tier: 1 }, title: 'Basic' }, pro: { const: { tier: 2 }, title: 'Pro' } },
          type: 'object',
          properties: {
            plan: { type: 'object', oneOf: [{ $ref: '#/definitions/basic' }, { $ref: '#/definitions/pro' }] },
            color: { type: 'string' },
          },
          if: { properties: { plan: { const: { tier: 1 } } } },
          ...colorsByTier,
        };
        const { onChange } = createFormComponent({
          schema,
          initialFormData: { plan: { tier: 1 }, color: 'red' },
        });

        await user.selectOptions(screen.getByRole('combobox', { name: 'plan' }), 'Pro');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { plan: { tier: 2 }, color: 'blue' } }),
          'root_plan',
        );
      });
    });

    it('should keep the schema a typeless select infers its type into when its uiSchema changes', () => {
      const schemas: RJSFSchema[] = [];
      const RecordingSelectWidget = (props: WidgetProps) => {
        schemas.push(props.schema);
        return <SelectWidget {...props} />;
      };
      const schema: RJSFSchema = { type: 'object', properties: { v: { oneOf: [{ const: 'a' }, { const: 'b' }] } } };
      const widgets = { SelectWidget: RecordingSelectWidget };
      const { rerender } = createFormComponent({ schema, widgets, uiSchema: { v: { 'ui:title': 'Pick' } } });
      rerender({ schema, widgets, uiSchema: { v: { 'ui:title': 'Pick one' } } });

      expect(schemas.length).toBeGreaterThan(1);
      expect(new Set(schemas).size).toBe(1);
    });

    it('should keep the uiSchema a typeless boolean select is written its widget into when its data changes', async () => {
      const uiSchemas: unknown[] = [];
      const RecordingSelectWidget = (props: WidgetProps) => {
        uiSchemas.push(props.uiSchema);
        return <SelectWidget {...props} />;
      };
      createFormComponent({
        schema: { type: 'object', properties: { v: { oneOf: [{ const: true }, { const: false }] } } },
        widgets: { SelectWidget: RecordingSelectWidget },
        uiSchema: { v: { 'ui:title': 'Pick' } },
      });
      const select = screen.getByRole('combobox', { name: 'Pick' });
      await user.selectOptions(select, 'Yes');
      await user.selectOptions(select, 'No');

      expect(select).toHaveDisplayValue('No');
      expect(uiSchemas.length).toBeGreaterThan(1);
      expect(new Set(uiSchemas).size).toBe(1);
    });

    it('should not hand a custom ui:field the select widget inferred for labelled boolean consts', () => {
      const uiWidgets: unknown[] = [];
      const MyToggle = ({ uiSchema }: FieldProps) => {
        uiWidgets.push(uiSchema?.['ui:widget']);
        return null;
      };
      const schema: RJSFSchema = {
        type: 'boolean',
        oneOf: [
          { const: true, title: 'On' },
          { const: false, title: 'Off' },
        ],
      };
      createFormComponent({ schema, uiSchema: { 'ui:field': 'MyToggle' }, fields: { MyToggle } });

      expect(uiWidgets.length).toBeGreaterThan(0);
      expect(uiWidgets.every((widget) => widget === undefined)).toBe(true);
    });

    it('should render a select for a ui:field that delegates to BooleanField once its uiSchema names the widget', async () => {
      const MyField = (props: FieldProps) => {
        const { BooleanField } = props.registry.fields;
        return <BooleanField {...props} />;
      };
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'Status',
        oneOf: [
          { const: true, title: 'Enabled' },
          { const: false, title: 'Disabled' },
        ],
      };
      // A custom field draws its own label unless declared otherwise; this one leaves it to the template
      const { node, onChange } = createFormComponent({
        schema,
        uiSchema: { 'ui:field': MyField, 'ui:widget': 'select' },
        presentation: { fieldDefault: { label: 'template' } },
      });

      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect(select).toBeInTheDocument();
      expect(node.querySelector('label[for=root]')).toHaveTextContent('Status');
      await user.selectOptions(select!, 'Disabled');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: false }), 'root');
    });

    it('should render a select for an empty enum beside a oneOf of object constants', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { v: { type: 'object', enum: [], oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] } },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('select#root_v')).toBeInTheDocument();
    });

    it('should keep the inferred select when ui:field names the BooleanField that reads it', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        oneOf: [
          { const: true, title: 'On' },
          { const: false, title: 'Off' },
        ],
      };
      const { node, onChange } = createFormComponent({ schema, uiSchema: { 'ui:field': 'BooleanField' } });

      const select = node.querySelector<HTMLSelectElement>('select#root');
      expect(select).toBeInTheDocument();
      await user.selectOptions(select!, 'Off');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: false }), 'root');
    });

    it('should keep the inferred select and the label for a custom field chosen by the schema $id', () => {
      const uiWidgets: unknown[] = [];
      const MyToggle = ({ uiSchema }: FieldProps) => {
        uiWidgets.push(uiSchema?.['ui:widget']);
        return null;
      };
      const schema: RJSFSchema = {
        $id: 'MyToggle',
        type: 'boolean',
        title: 'Power',
        oneOf: [
          { const: true, title: 'On' },
          { const: false, title: 'Off' },
        ],
      };
      // A custom field draws its own label unless declared otherwise; this one leaves it to the template
      const { node } = createFormComponent({
        schema,
        fields: { MyToggle },
        presentation: { fields: { MyToggle: { label: 'template' } } },
      });

      expect(uiWidgets.length).toBeGreaterThan(0);
      expect(uiWidgets.every((widget) => widget === 'select')).toBe(true);
      expect(node.querySelector('label[for=root]')).toHaveTextContent('Power');
    });

    it('should render a select, not an option selector, for an empty enum beside a non-constant oneOf', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { v: { type: 'string', enum: [], oneOf: [{ type: 'string' }, { type: 'number' }] } },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('select#root_v')).toBeInTheDocument();
      expect(node.querySelector('[id$=__oneof_select]')).not.toBeInTheDocument();
    });

    it('should label the anyOf options from uiSchema.anyOf when the schema also has a oneOf', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          v: {
            anyOf: [
              { type: 'string', title: 'A' },
              { type: 'number', title: 'B' },
            ],
            oneOf: [{ minLength: 1 }, { minLength: 2 }],
          },
        },
      };
      const uiSchema: UiSchema = {
        v: {
          anyOf: [{ 'ui:title': 'From anyOf A' }, { 'ui:title': 'From anyOf B' }],
          oneOf: [{ 'ui:title': 'From oneOf C' }, { 'ui:title': 'From oneOf D' }],
        },
      };
      const { node } = createFormComponent({ schema, uiSchema });

      const select = node.querySelector<HTMLSelectElement>('select#root_v__anyof_select')!;
      expect([...select.options].map((option) => option.text)).toEqual(['From anyOf A', 'From anyOf B']);
    });

    it('should render the anyOf, not throw, when only the oneOf of a typed schema is made of consts (#5309)', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          myprop: { type: 'string', anyOf: [{ minLength: 1 }], oneOf: [{ const: 'a' }, { const: 'b' }] },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('#root_myprop__anyof_select')).toBeInTheDocument();
      expect(node.querySelector('input#root_myprop[type=text]')).toBeInTheDocument();
    });

    it('should render the anyOf when a schema has both a const oneOf and a non-const anyOf', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          myprop: { anyOf: [{ type: 'string', minLength: 1 }], oneOf: [{ const: 'a' }, { const: 'b' }] },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
      expect(node.querySelector('#root_myprop__anyof_select')).toBeInTheDocument();
      expect(node.querySelector('input#root_myprop[type=text]')).toBeInTheDocument();
    });

    it('should still render a select when both the oneOf and the anyOf are consts', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          myprop: { anyOf: [{ const: 'a' }, { const: 'b' }], oneOf: [{ const: 'a' }, { const: 'b' }] },
        },
      };
      const { node } = createFormComponent({ schema });

      const select = node.querySelector<HTMLSelectElement>('select#root_myprop');
      expect(select).toBeInTheDocument();
      expect([...select!.options].map((option) => option.text)).toEqual(['', 'a', 'b']);
    });

    it('should select a null const in the realValue format (#5309)', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          p: {
            oneOf: [
              { const: null, title: 'Unknown' },
              { const: true, title: 'Yes' },
              { const: false, title: 'No' },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { p: { 'ui:options': { optionValueFormat: 'realValue' } } };
      const { node, onChange } = createFormComponent({ schema, uiSchema, initialFormData: { p: true } });

      const select = node.querySelector<HTMLSelectElement>('select#root_p')!;
      expect(new Set([...select.options].map((option) => option.value)).size).toBe(select.options.length);
      await user.selectOptions(select, 'Unknown');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { p: null } }), 'root_p');
      expect(getSelectedOptionValue(select)).toEqual('Unknown');
    });

    it('should keep a null const apart from a 0 const in the realValue format (#5309)', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { p: { oneOf: [{ const: null, title: 'None' }, { const: 0, title: 'Zero' }, { const: 1 }] } },
      };
      const uiSchema: UiSchema = { p: { 'ui:options': { optionValueFormat: 'realValue' } } };
      const { node, onChange } = createFormComponent({ schema, uiSchema, initialFormData: { p: 1 } });

      const select = node.querySelector<HTMLSelectElement>('select#root_p')!;
      expect(new Set([...select.options].map((option) => option.value)).size).toBe(select.options.length);
      await user.selectOptions(select, 'Zero');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { p: 0 } }), 'root_p');
      expect(getSelectedOptionValue(select)).toEqual('Zero');
      await user.selectOptions(select, 'None');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { p: null } }), 'root_p');
      expect(getSelectedOptionValue(select)).toEqual('None');
    });

    describe.each(['select', 'radio'])('consts whose String() is the same (#5315) as a %s', (widget) => {
      it('should select each of them in the realValue format', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            p: {
              oneOf: [
                { const: 1, title: 'Number' },
                { const: '1', title: 'String' },
                { const: true, title: 'True' },
                { const: 'true', title: 'String true' },
              ],
            },
          },
        };
        const uiSchema: UiSchema = { p: { 'ui:widget': widget, 'ui:options': { optionValueFormat: 'realValue' } } };
        const { node, onChange } = createFormComponent({ schema, uiSchema, initialFormData: { p: 1 } });
        const optionValues = [...node.querySelectorAll<HTMLInputElement | HTMLOptionElement>('option, input')]
          .map((option) => option.value)
          .filter((value) => value !== '');
        expect(new Set(optionValues).size).toBe(4);

        const select = widget === 'select' ? node.querySelector<HTMLSelectElement>('select#root_p')! : undefined;
        const pickAndExpect = async (label: string, value: unknown) => {
          await (select ? user.selectOptions(select, label) : user.click(screen.getByLabelText(label)));
          expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { p: value } }), 'root_p');
          // A select fires its change whatever it showed before, so what it shows now is checked on its own
          if (select) {
            expect(getSelectedOptionValue(select)).toEqual(label);
          } else {
            expect(screen.getByLabelText(label)).toBeChecked();
          }
        };
        await pickAndExpect('String', '1');
        await pickAndExpect('Number', 1);
        await pickAndExpect('String true', 'true');
        await pickAndExpect('True', true);
      });
    });

    it('should check each of the consts whose String() is the same in the realValue format (#5315)', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          p: {
            type: 'array',
            uniqueItems: true,
            items: {
              anyOf: [
                { const: 1, title: 'Number' },
                { const: '1', title: 'String' },
              ],
            },
          },
        },
      };
      const uiSchema: UiSchema = {
        p: { 'ui:widget': 'checkboxes', 'ui:options': { optionValueFormat: 'realValue' } },
      };
      const { onChange } = createFormComponent({ schema, uiSchema, initialFormData: { p: ['1'] } });

      const numberBox = screen.getByLabelText<HTMLInputElement>('Number');
      const stringBox = screen.getByLabelText<HTMLInputElement>('String');
      expect(numberBox.value).not.toBe(stringBox.value);
      expect(stringBox).toBeChecked();
      expect(numberBox).not.toBeChecked();
      await user.click(numberBox);
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { p: [1, '1'] } }), 'root_p');
    });

    it('should render a null const property the same way as an explicit type of null', () => {
      const constSchema: RJSFSchema = { type: 'object', properties: { note: { const: null } } };
      const typeSchema: RJSFSchema = { type: 'object', properties: { note: { type: 'null' } } };
      const fromConst = createFormComponent({ schema: constSchema });
      const fromType = createFormComponent({ schema: typeSchema });

      expect(fromConst.node.innerHTML).toEqual(fromType.node.innerHTML);
      // The constant is a seed default, so it is in the data on mount; the form reports edits only, so no
      // `onChange` fires for it
      expect(fromConst.getFormData()).toEqual({ note: null });
      expect(fromConst.onChange).not.toHaveBeenCalled();
    });
  });

  describe('primitive type with non-select oneOf', () => {
    const ipSchema: RJSFSchema = {
      type: 'string',
      oneOf: [
        { title: 'IPv4', pattern: '^(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(\\.(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})){3}$' },
        { title: 'IPv6', pattern: '^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)$' },
      ],
    };

    it('should not render a spurious XxxOf-prefixed input alongside the oneOf selector', () => {
      // Regression: { type: 'string', oneOf: [...] } was rendering an outer StringField
      // with id="root__XxxOf" in addition to the OneOfField selector. Typing into that
      // input corrupted formData (e.g. set { XxxOf: value } instead of a plain string).
      const { node } = createFormComponent({ schema: ipSchema });

      expect(node.querySelector('input#root__XxxOf')).not.toBeInTheDocument();
    });

    it('should render the option text input with the correct root id after selecting an option', () => {
      // Regression: option schemas without their own type rendered as FallbackField
      // (no input) because the parent type was not propagated to the option schema.
      const { node } = createFormComponent({ schema: ipSchema });

      // The selected option's input should be at the root id, not a spurious XxxOf id
      expect(node.querySelector('input#root')).toBeInTheDocument();
    });

    it('should produce a plain string formData value when typing into the option input', async () => {
      const { node, onChange } = createFormComponent({ schema: ipSchema });

      const input = node.querySelector<HTMLInputElement>('input#root');
      expect(input).toBeInTheDocument();

      await user.clear(input!);
      await user.type(input!, '192.168.1.1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: '192.168.1.1' }),
        expect.any(String),
      );
    });

    it('should not render a spurious XxxOf input for type number with non-select oneOf', () => {
      const schema: RJSFSchema = {
        type: 'number',
        oneOf: [
          { title: 'Positive', minimum: 0 },
          { title: 'Negative', maximum: 0 },
        ],
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input#root__XxxOf')).not.toBeInTheDocument();
      expect(node.querySelector('input#root')).toBeInTheDocument();
    });

    it('should produce a number formData value when typing into a type:number oneOf option input', async () => {
      const schema: RJSFSchema = {
        type: 'number',
        oneOf: [
          { title: 'Positive', minimum: 0 },
          { title: 'Negative', maximum: 0 },
        ],
      };
      const { node, onChange } = createFormComponent({ schema });

      const input = node.querySelector<HTMLInputElement>('input#root');
      expect(input).toBeInTheDocument();

      await user.clear(input!);
      await user.type(input!, '42');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 42 }), expect.any(String));
    });

    it('should not render a spurious XxxOf input for type array with non-select oneOf', () => {
      const schema: RJSFSchema = {
        type: 'array',
        oneOf: [
          { title: 'Strings', items: { type: 'string' } },
          { title: 'Numbers', items: { type: 'number' } },
        ],
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('[id="root__XxxOf"]')).not.toBeInTheDocument();
    });

    it('should still render common object properties alongside the oneOf selector', () => {
      // Regression guard: ObjectField must NOT be suppressed when type:object has a oneOf,
      // because shared properties defined at the parent level still need to render.
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          shared: { type: 'string' },
        },
        oneOf: [{ properties: { foo: { type: 'string' } } }, { properties: { bar: { type: 'string' } } }],
      };
      const { node } = createFormComponent({ schema });

      // Common property from ObjectField
      expect(node.querySelector('input#root_shared')).toBeInTheDocument();
      // OneOf selector
      expect(node.querySelector('select')).toBeInTheDocument();
    });
  });

  describe("a non-object field's selected option inherits its parent's keywords (#5359)", () => {
    const wrap = (opt: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { opt } });

    it("should render an array's items from the parent when its anyOf options only limit the length", async () => {
      const schema = wrap({ type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, { maxItems: 3 }] });
      const { node, onChange } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
      await user.type(node.querySelector<HTMLInputElement>('input#root_opt_0')!, 'x');
      await user.click(node.querySelector<HTMLButtonElement>('#root_opt__add')!);

      expect(node.querySelector('input#root_opt_1')).toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { opt: ['x', undefined] } }),
        'root_opt',
      );
    });

    it.each<[string, RJSFSchema['type']]>([
      ['an array', 'array'],
      ['a nullable array', ['array', 'null']],
    ])("should keep %s's items across a switch between options that only limit its length", async (_, type) => {
      const schema = wrap({ type, items: { type: 'string' }, anyOf: [{ minItems: 1 }, { maxItems: 3 }] });
      const { node, onChange } = createFormComponent({ schema, initialFormData: { opt: ['x', 'y'] } });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'Option 2');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { opt: ['x', 'y'] } }),
        'root_opt__anyof_select',
      );
      expect(node.querySelector<HTMLInputElement>('input#root_opt_1')).toHaveValue('y');
    });

    it.each<[string, RJSFSchema, unknown]>([
      ['keep', { maxItems: 3 }, { opt: { 0: { __errors: ['Custom error'] } } }],
      ['drop', { items: { maxLength: 5 } }, {}],
    ])(
      'should %s the errors an item raised when the item is carried over to an option rendering it as before or not',
      async (_, otherOption, expectedErrorSchema) => {
        function RaisingField({ fieldPath, onChange }: FieldProps) {
          return (
            <button type='button' onClick={() => onChange('bad', fieldPath, { __errors: ['Custom error'] })}>
              Raise
            </button>
          );
        }
        const schema = wrap({ type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, otherOption] });
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema: { opt: { items: { 'ui:field': RaisingField } } },
          initialFormData: { opt: ['x'] },
        });
        await user.click(screen.getByRole('button', { name: 'Raise' }));
        expect(onChange.mock.lastCall![0].errorSchema).toEqual({ opt: { 0: { __errors: ['Custom error'] } } });

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'Option 2');

        expect(onChange.mock.lastCall![0].formData).toEqual({ opt: ['bad'] });
        expect(onChange.mock.lastCall![0].errorSchema).toEqual(expectedErrorSchema);
      },
    );

    it.each<[string, RJSFSchema, UiSchema, string]>([
      [
        'the uiSchema of the option switched to renders the item with another field',
        { type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, { maxItems: 5 }] },
        { anyOf: [{ items: { 'ui:field': 'raising' } }, { items: { 'ui:field': 'other' } }] },
        'bad',
      ],
      [
        'the option switched to renders the enumerated items as one multi-select',
        { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, anyOf: [{ minItems: 1 }, { uniqueItems: true }] },
        { items: { 'ui:field': 'raising' } },
        'a',
      ],
      [
        'the option switched to is a select over whole arrays, which renders one control for the array',
        { type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, { enum: [['a'], ['b']] }] },
        { items: { 'ui:field': 'raising' } },
        'a',
      ],
      [
        'the option switched to holds options of its own, which render its items anew',
        {
          type: 'array',
          items: { type: 'string' },
          anyOf: [{ minItems: 1 }, { anyOf: [{ maxItems: 3 }, { maxItems: 4 }] }],
        },
        { items: { 'ui:field': 'raising' } },
        'a',
      ],
    ])('should drop the errors an item raised when %s', async (_, opt, optUiSchema, raised) => {
      function RaisingField({ fieldPath, onChange }: FieldProps) {
        return (
          <button type='button' onClick={() => onChange(raised, fieldPath, { __errors: ['Custom error'] })}>
            Raise
          </button>
        );
      }
      function OtherField() {
        return <span>Other field</span>;
      }
      const { node, onChange } = createFormComponent({
        schema: wrap(opt),
        uiSchema: { opt: optUiSchema },
        fields: { raising: RaisingField, other: OtherField },
        initialFormData: { opt: [raised] },
      });
      await user.click(screen.getByRole('button', { name: 'Raise' }));
      expect(onChange.mock.lastCall![0].errorSchema).toEqual({ opt: { 0: { __errors: ['Custom error'] } } });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'Option 2');

      expect(onChange.mock.lastCall![0].formData).toEqual({ opt: [raised] });
      expect(onChange.mock.lastCall![0].errorSchema).toEqual({});
    });

    it('should drop the errors an item raised when the switch trims the array, which mounts every item anew', async () => {
      function RaisingField({ fieldPath, formData, onChange }: FieldProps) {
        return (
          <button type='button' onClick={() => onChange(formData, fieldPath, { __errors: ['Custom error'] })}>
            Raise {String(formData)}
          </button>
        );
      }
      const schema = wrap({ type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, { maxItems: 2 }] });
      const { node, onChange } = createFormComponent({
        schema,
        uiSchema: { opt: { items: { 'ui:field': RaisingField } } },
        initialFormData: { opt: ['x', 'y', 'z'] },
      });
      await user.click(screen.getByRole('button', { name: 'Raise x' }));
      expect(onChange.mock.lastCall![0].errorSchema).toEqual({ opt: { 0: { __errors: ['Custom error'] } } });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'Option 2');

      expect(onChange.mock.lastCall![0].formData).toEqual({ opt: ['x', 'y'] });
      expect(onChange.mock.lastCall![0].errorSchema).toEqual({});
    });

    it('should drop the errors an item raised when the option switched to replaces the item with its default', async () => {
      function RaisingField({ fieldPath, onChange }: FieldProps) {
        return (
          <button type='button' onClick={() => onChange('x', fieldPath, { __errors: ['Custom error'] })}>
            Raise
          </button>
        );
      }
      const schema = wrap({
        type: 'array',
        items: { type: 'string' },
        anyOf: [
          { minItems: 1, default: ['x'] },
          { maxItems: 3, default: ['y'] },
        ],
      });
      const { node, onChange } = createFormComponent({
        schema,
        uiSchema: { opt: { items: { 'ui:field': RaisingField } } },
        initialFormData: { opt: ['x'] },
      });
      await user.click(screen.getByRole('button', { name: 'Raise' }));
      expect(onChange.mock.lastCall![0].errorSchema).toEqual({ opt: { 0: { __errors: ['Custom error'] } } });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'Option 2');

      expect(onChange.mock.lastCall![0].formData).toEqual({ opt: ['y'] });
      expect(onChange.mock.lastCall![0].errorSchema).toEqual({});
    });

    it.each<[string, RJSFSchema, number, unknown, unknown]>([
      [
        "the field's minItems filled with the items' default",
        {
          type: 'array',
          minItems: 2,
          items: { type: 'string', default: 'd' },
          anyOf: [
            { title: 'A', default: ['x'] },
            { title: 'B', default: ['y'] },
          ],
        },
        2,
        ['y'],
        ['x'],
      ],
      [
        "the form filled with its items' property defaults",
        {
          type: 'array',
          items: { type: 'object', properties: { a: { type: 'string', default: 'A' }, n: { type: 'string' } } },
          anyOf: [
            { title: 'A', default: [{ n: '1' }] },
            { title: 'B', default: [{ n: '2' }] },
          ],
        },
        2,
        [{ n: '2', a: 'A' }],
        [{ n: '1', a: 'A' }],
      ],
    ])('should replace an untouched default %s', async (_, opt, inputs, afterB, afterA) => {
      const { node, onChange } = createFormComponent({ schema: wrap(opt) });
      const select = node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!;
      expect(node.querySelectorAll('input')).toHaveLength(inputs);

      await user.selectOptions(select, 'B');
      expect(onChange.mock.lastCall![0].formData).toEqual({ opt: afterB });

      await user.selectOptions(select, 'A');
      expect(onChange.mock.lastCall![0].formData).toEqual({ opt: afterA });
    });

    it('should replace an untouched default the old option took from the field, its own const not being one', async () => {
      const schema = wrap({
        type: 'array',
        items: { type: 'string' },
        default: ['p'],
        anyOf: [
          { title: 'A', const: ['a'] },
          { title: 'B', minItems: 2, default: ['b', 'c'] },
        ],
      });
      const { node, onChange } = createFormComponent({
        schema,
        defaultFormStateBehavior: { constAsDefaults: 'never' },
      });
      const select = node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!;
      expect(getSelectedOptionValue(select)).toEqual('A');

      await user.selectOptions(select, 'B');

      expect(onChange.mock.lastCall![0].formData).toEqual({ opt: ['b', 'c'] });
    });

    it("should keep a tuple's items across a switch between options that only limit its length", async () => {
      const schema = wrap({
        type: 'array',
        items: [{ type: 'string' }, { type: 'number' }],
        additionalItems: { type: 'string' },
        anyOf: [{ minItems: 2 }, { maxItems: 4 }],
      });
      const { node, onChange } = createFormComponent({ schema, initialFormData: { opt: ['x', 1, 'more'] } });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'Option 2');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { opt: ['x', 1, 'more'] } }),
        'root_opt__anyof_select',
      );
      expect(node.querySelector<HTMLInputElement>('input#root_opt_2')).toHaveValue('more');
    });

    it('should offer no Add for a tuple declaring no additionalItems whose options give its items a schema', () => {
      const schema = wrap({
        type: 'array',
        items: [{ type: 'string' }, { type: 'string' }],
        anyOf: [{ items: { maxLength: 3 } }, { items: { minLength: 5 } }],
      });
      const { node } = createFormComponent({ schema, initialFormData: { opt: ['a', 'b'] } });

      expect(node.querySelector('input#root_opt_1')).not.toEqual(null);
      expect(node.querySelector('.rjsf-array-item-add')).toEqual(null);
    });

    it("should replace the items with the const of the option switched to when they don't equal it", async () => {
      const schema = wrap({
        type: 'array',
        items: { type: 'string' },
        anyOf: [
          { title: 'free', minItems: 1 },
          { title: 'fixed', const: ['a', 'b'] },
        ],
      });
      const { node, onChange } = createFormComponent({ schema, initialFormData: { opt: ['x'] } });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'fixed');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { opt: ['a', 'b'] } }),
        'root_opt__anyof_select',
      );
    });

    it("should keep rendering the parent's items when the selected option's items is true", () => {
      const schema = wrap({ type: 'array', items: { type: 'string' }, anyOf: [{ items: true }, { maxItems: 3 }] });
      const { node } = createFormComponent({ schema, initialFormData: { opt: ['x'] } });

      expect(node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input#root_opt_0')).toHaveValue('x');
    });

    it("should keep rendering the parent's tuple when the selected option's items is true", () => {
      const schema = wrap({
        type: 'array',
        items: [{ type: 'string' }, { type: 'number' }],
        anyOf: [{ items: true }, { maxItems: 3 }],
      });
      const { node } = createFormComponent({ schema, initialFormData: { opt: ['x', 1] } });

      expect(node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
      expect(node.querySelector<HTMLInputElement>('input#root_opt_0')).toHaveValue('x');
      expect(node.querySelector<HTMLInputElement>('input#root_opt_1')).toHaveValue('1');
    });

    it("should stop adding items at the parent's maxItems when the option allows more", async () => {
      const schema = wrap({ type: 'array', items: { type: 'string' }, maxItems: 3, anyOf: [{ maxItems: 5 }] });
      const { node } = createFormComponent({ schema, initialFormData: { opt: ['a', 'b'] } });

      await user.click(node.querySelector<HTMLButtonElement>('#root_opt__add')!);

      expect(node.querySelector('input#root_opt_2')).toBeInTheDocument();
      expect(node.querySelector('#root_opt__add')).not.toBeInTheDocument();
    });

    it("should render a multi-select from the parent's uniqueItems and enum items", async () => {
      const schema = wrap({
        type: 'array',
        items: { type: 'string', enum: ['a', 'b'] },
        uniqueItems: true,
        oneOf: [{ minItems: 1 }, { maxItems: 1 }],
      });
      const { node, onChange } = createFormComponent({ schema });

      expect(node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
      await user.selectOptions(node.querySelector<HTMLSelectElement>('select[multiple]#root_opt')!, 'b');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: { opt: ['b'] } }), 'root_opt');
    });

    it("should render a string option with the parent's format", () => {
      const schema = wrap({ type: 'string', format: 'date', oneOf: [{ minLength: 1 }, { maxLength: 20 }] });
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input#root_opt')).toHaveAttribute('type', 'date');
    });

    it('should let an option override the keyword it shares with the parent', () => {
      const schema = wrap({ type: 'string', format: 'date', oneOf: [{ format: 'email' }, { maxLength: 20 }] });
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input#root_opt')).toHaveAttribute('type', 'email');
    });

    it("should leave the parent's title and description to the parent's own field", () => {
      const schema = wrap({
        type: 'string',
        title: 'Parent title',
        description: 'Parent description',
        oneOf: [{ minLength: 1 }, { maxLength: 20 }],
      });
      const { node } = createFormComponent({ schema });

      expect(screen.getAllByText('Parent title')).toHaveLength(1);
      expect(screen.getAllByText('Parent description')).toHaveLength(1);
      expect(node.querySelector('input#root_opt')).toBeInTheDocument();
    });

    it.each<[string, RJSFSchema]>([
      ['an array', { type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, { maxItems: 3 }] }],
      ['a checkbox', { type: 'boolean', oneOf: [{ const: true }, { type: 'boolean' }] }],
    ])('should render the title and description of %s, which its own field leaves unlabelled, once', (_, opt) => {
      createFormComponent({ schema: wrap({ ...opt, title: 'Parent title', description: 'Parent description' }) });

      expect(screen.getAllByText('Parent title')).toHaveLength(1);
      expect(screen.getAllByText('Parent description')).toHaveLength(1);
    });

    it.each([false, null, 0, ''])(
      "should leave a field's title and description unrendered when its ui:label is %j, whatever its options' uiSchemas",
      (label) => {
        const schema = wrap({
          type: 'string',
          title: 'Parent title',
          description: 'Parent description',
          anyOf: [{ minLength: 1 }, { maxLength: 3 }],
        });
        createFormComponent({
          schema,
          uiSchema: { opt: { 'ui:label': label, anyOf: [{ 'ui:placeholder': 'p' }, {}] } },
        });

        expect(screen.queryByText('Parent title')).not.toBeInTheDocument();
        expect(screen.queryByText('Parent description')).not.toBeInTheDocument();
      },
    );

    it.each<[string, RJSFSchema]>([
      [
        'an array',
        {
          type: 'array',
          items: { type: 'string' },
          anyOf: [
            { title: 'Short list', description: 'Option description', maxItems: 3 },
            { title: 'Long list', minItems: 1 },
          ],
        },
      ],
      [
        'a checkbox',
        {
          type: 'boolean',
          anyOf: [
            { title: 'Short list', description: 'Option description', type: 'boolean' },
            { title: 'Long list', type: 'boolean' },
          ],
        },
      ],
    ])(
      "should render %s's own title and description through the field's template, and its option's description beneath them",
      async (_, opt) => {
        const { node } = createFormComponent({
          schema: wrap({ ...opt, title: 'Parent title', description: 'Parent description' }),
        });

        expect(screen.getAllByText('Parent title')).toHaveLength(1);
        expect(screen.getAllByText('Parent description')).toHaveLength(1);
        expect(node.querySelector('#root_opt__optionDescription')).toHaveTextContent('Option description');
        expect(screen.getByRole('option', { name: 'Short list' })).toBeInTheDocument();

        await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'Long list');

        expect(screen.getAllByText('Parent description')).toHaveLength(1);
        expect(screen.queryByText('Option description')).not.toBeInTheDocument();
      },
    );

    it("should render an unlabelled field's own title through its template, and its option's ui:title and ui:description beneath it", () => {
      const schema = wrap({
        type: 'array',
        title: 'Parent title',
        description: 'Parent description',
        items: { type: 'string' },
        anyOf: [{ maxItems: 3 }, { minItems: 1 }],
      });
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          opt: {
            anyOf: [{ 'ui:title': 'Short list', 'ui:options': { description: 'Option description' } }, {}],
          },
        },
      });

      expect(node.querySelector('#root_opt__label')?.closest('label')).toHaveTextContent('Parent title');
      expect(node.querySelector('legend')).toHaveTextContent('Short list');
      expect(screen.getAllByText('Parent description')).toHaveLength(1);
      expect(node.querySelector('#root_opt__optionDescription')).toHaveTextContent('Option description');
    });

    it("should render an option's own description beneath the ui:description of a field whose uiSchema it is handed", async () => {
      const schema = wrap({
        type: 'array',
        title: 'Parent title',
        items: { type: 'string' },
        anyOf: [
          { title: 'Short list', description: 'Option description', maxItems: 3 },
          { title: 'Long list', minItems: 1 },
        ],
      });
      const { node } = createFormComponent({ schema, uiSchema: { opt: { 'ui:description': 'Field description' } } });

      expect(screen.getAllByText('Field description')).toHaveLength(1);
      expect(node.querySelector('#root_opt__optionDescription')).toHaveTextContent('Option description');

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_opt__anyof_select')!, 'Long list');

      expect(screen.getAllByText('Field description')).toHaveLength(1);
      expect(screen.queryByText('Option description')).not.toBeInTheDocument();
    });

    it("should render an option's own ui:description over its schema's description", () => {
      const schema = wrap({
        type: 'array',
        items: { type: 'string' },
        anyOf: [{ description: 'Option description', maxItems: 3 }, { minItems: 1 }],
      });
      createFormComponent({
        schema,
        uiSchema: { opt: { anyOf: [{ 'ui:description': 'Option UI description' }, {}] } },
      });

      expect(screen.getAllByText('Option UI description')).toHaveLength(1);
      expect(screen.queryByText('Option description')).not.toBeInTheDocument();
    });

    it("should render a typeless object parent's typeless option as the object a typed parent's renders", () => {
      const properties: RJSFSchema['properties'] = { a: { type: 'string' }, b: { type: 'string' } };
      const oneOf: RJSFSchema[] = [{ required: ['a'] }, { required: ['b'] }];
      const typeless = createFormComponent({ schema: wrap({ properties, oneOf }) });
      const typed = createFormComponent({ schema: wrap({ type: 'object', properties, oneOf }) });

      expect(typeless.node.querySelector('.rjsf-unsupported-field')).not.toBeInTheDocument();
      expect(typeless.node.innerHTML).toEqual(typed.node.innerHTML);
    });
  });

  it('$ref objects pointing to objects with oneOf lists do not change (#3833)', async () => {
    const schema: RJSFSchema = {
      title: 'oneOf Example',
      type: 'object',
      properties: {
        status: {
          $ref: '#/definitions/status',
        },
      },
      definitions: {
        status: {
          title: 'Field Status',
          type: 'object',
          oneOf: [
            {
              title: 'Approved',
              type: 'object',
            },
            {
              title: 'Rejected',
              type: 'object',
              properties: {
                reason: {
                  title: 'Rejection Reason',
                  type: 'string',
                },
              },
            },
          ],
        },
      },
    };
    const formData = { status: {} };
    const { node } = createFormComponent({ schema, initialFormData: formData });
    const select = node.querySelector('#root_status__oneof_select');
    await user.selectOptions(select!, '1');

    expect(select).toHaveValue('1');
  });

  it("gives the object's own errors to the option's field, not to the object the selector is rendered for", () => {
    // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
    function RawErrorsObjectFieldTemplate({ id, properties, rawErrors }: ObjectFieldTemplateProps) {
      return (
        <div>
          {properties.map((property) => property.content)}
          {rawErrors?.map((error) => (
            <p key={error} className='object-errors' data-id={id}>
              {error}
            </p>
          ))}
        </div>
      );
    }
    const { node } = createFormComponent({
      schema: { type: 'object', oneOf: [{ properties: { a: { type: 'string' } } }] },
      templates: { ObjectFieldTemplate: RawErrorsObjectFieldTemplate },
      extraErrors: { __errors: ['Own error'] },
      showErrorList: false,
    });

    const errors = node.querySelectorAll('.object-errors');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveAttribute('data-id', 'root');
  });

  it('passes MultiSchemaFieldTemplate the id of the field whose option is selected', () => {
    function IdMultiSchemaFieldTemplate({ id, selector, optionSchemaField }: MultiSchemaFieldTemplateProps) {
      return (
        <div className='multi' data-id={id}>
          {selector}
          {optionSchemaField}
        </div>
      );
    }
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { foo: { oneOf: [{ type: 'string' }, { type: 'number' }] } } },
      templates: { MultiSchemaFieldTemplate: IdMultiSchemaFieldTemplate },
    });

    expect(node.querySelector('.multi')).toHaveAttribute('data-id', 'root_foo');
  });

  it("renders the field's own ui:MultiSchemaFieldTemplate", () => {
    function OwnMultiSchemaFieldTemplate({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps) {
      return (
        <div className='own-multi'>
          {selector}
          {optionSchemaField}
        </div>
      );
    }
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { foo: { oneOf: [{ type: 'string' }, { type: 'number' }] } } },
      uiSchema: { foo: { 'ui:MultiSchemaFieldTemplate': OwnMultiSchemaFieldTemplate } },
    });

    expect(node.querySelector('.own-multi select#root_foo__oneof_select')).toBeInTheDocument();
  });

  it.each([
    ['rendered beside its selector', 'root__XxxOf__add'],
    ['rendered as the selected option', 'root__add'],
  ])('keeps the own errors of an array %s when it adds an item', async (_, addButtonId) => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        oneOf: [{ items: { type: 'string' }, maxItems: 5 }],
      },
      uiSchema: { 'ui:field': 'ArrayField' },
      initialFormData: [],
      showErrorList: false,
    });
    await submitForm(node, user);

    await user.click(node.querySelector(`[id="${addButtonId}"]`)!);

    expect(onChange.mock.lastCall![0].errorSchema.__errors).toEqual(['must NOT have fewer than 2 items']);
  });

  it('keeps the fields of an object beside its selector mounted as its own errors come and go', () => {
    const props = {
      schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        oneOf: [{ properties: { a: { type: 'string' } } }],
      } satisfies RJSFSchema,
      showErrorList: false as const,
    };
    const { node, rerender } = createFormComponent(props);
    const input = node.querySelector('#root_name');
    expect(input).toBeInTheDocument();

    rerender({ ...props, extraErrors: { __errors: ['Own error'] } });
    expect(node.querySelector('#root_name')).toBe(input);
    rerender(props);

    expect(node.querySelector('#root_name')).toBe(input);
  });

  it('keeps the own errors of an object beside its selector out of the errors an array inside it raises', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        properties: { list: { type: 'array', items: { type: 'string' } } },
        oneOf: [{ required: ['list'] }],
      },
      initialFormData: { list: [] },
      extraErrors: { __errors: ['Own error'] },
      showErrorList: false,
    });

    await user.click(node.querySelector('button[id$="list__add"]')!);

    expect(onChange.mock.lastCall![0].errorSchema.list).toBeUndefined();
  });

  it('lets a ui:field rendered beside its selector clear an error it raised at its own path', async () => {
    function RaisingField({ fieldPath, onChange }: FieldProps) {
      return (
        <>
          <button type='button' onClick={() => onChange('b', fieldPath, { __errors: ['Custom error'] })}>
            Raise
          </button>
          <button type='button' onClick={() => onChange('c', fieldPath, {})}>
            Clear
          </button>
        </>
      );
    }
    const { onChange } = createFormComponent({
      schema: { type: 'string', oneOf: [{ minLength: 1 }, { maxLength: 5 }] },
      // The options get their own uiSchema, so only the field beside the selector is the `ui:field`
      uiSchema: { 'ui:field': RaisingField, oneOf: [{}, {}] },
      initialFormData: 'a',
    });
    await user.click(screen.getByRole('button', { name: 'Raise' }));
    expect(onChange.mock.lastCall![0].errorSchema).toEqual({ __errors: ['Custom error'] });
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onChange.mock.lastCall![0].errorSchema).toEqual({});
  });

  it('puts the selector back on the option the data fits when onChange answers a switch by setting the field back', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        status: {
          oneOf: [
            { title: 'Approved', type: 'object', properties: { by: { type: 'string' } }, required: ['by'] },
            { title: 'Rejected', type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] },
          ],
        },
      },
    };
    const ref = createFormRef();
    let refuses = false;
    const { node } = createFormComponent({
      ref,
      schema,
      initialFormData: { status: { by: 'me' } },
      onChange: () => {
        if (refuses) {
          refuses = false;
          handleOf(ref).setFieldValue('status', { by: 'me' });
        }
      },
    });
    refuses = true;

    await user.selectOptions(elementOf(node, 'select'), 'Rejected');

    expect(handleOf(ref).getFormData()).toEqual({ status: { by: 'me' } });
    expect(node.querySelector('select')).toHaveValue('0');
    expect(node.querySelector('#root_status_by')).toBeInTheDocument();
    expect(node.querySelector('#root_status_reason')).not.toBeInTheDocument();
  });
  describe('definitions offering each other as options (#4990)', () => {
    it('opens data nested 11 levels deep and switches its deepest option, matching no option below its child', async () => {
      const counting = customizeValidator();
      const isValid = vi.spyOn(counting, 'isValid');
      createFormComponent({ schema: CROSS_REFERENCING_SCHEMA, initialFormData: nestedChildren(11) }, counting);

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(12);
      const deepest = selects[11];
      expect(deepest).toHaveDisplayValue('None');
      const [, firstDefinition] = within(deepest).getAllByRole('option');
      await user.selectOptions(deepest, firstDefinition);

      expect(screen.getAllByRole('combobox')).toHaveLength(13);
      // Every `$ref` the schema writes leads into the definitions, where a validator would walk every option of each
      // `oneOf` below the child, four times as long for each level deeper; the field below matches its own options. A
      // pointer to an option that writes none, such as `None`, names nothing further.
      expect(isValid).toHaveBeenCalled();
      const named = (schema: unknown) =>
        isPlainObject(schema) && typeof schema.$ref === 'string'
          ? getByPath(CROSS_REFERENCING_SCHEMA, schema.$ref.slice(2).split('/'))
          : schema;
      expect(isValid.mock.calls.filter(([schema]) => JSON.stringify(named(schema)).includes('$ref'))).toEqual([]);
    });
  });
});

describe.each(['oneOf', 'anyOf'] as const)('an %s option switch the form takes', (keyword) => {
  it('keeps the chosen option when the defaults the switch brings in add to the data it sent', async () => {
    // Option A describes data with a `kind` and a `note` better than option B does, so only the user's choice keeps B
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        status: {
          [keyword]: [
            {
              title: 'A',
              type: 'object',
              properties: { kind: { type: 'string' }, note: { type: 'string' }, by: { type: 'string' } },
              required: ['by'],
            },
            {
              title: 'B',
              type: 'object',
              properties: { kind: { const: 'b' }, reason: { type: 'string' } },
              required: ['reason'],
            },
          ],
        },
      },
      // The switched value turns this on, so the form's own derivation adds `note` under the field's path
      allOf: [
        {
          if: {
            properties: { status: { properties: { kind: { const: 'b' } }, required: ['kind'] } },
            required: ['status'],
          },
          then: { properties: { status: { properties: { note: { type: 'string', default: 'n' } } } } },
        },
      ],
    };
    const { node, onChange } = createFormComponent({ schema, initialFormData: { status: { by: 'me' } } });
    const selector = elementOf(node, `#root_status__${keyword.toLowerCase()}_select`);

    await user.selectOptions(selector, 'B');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { status: { kind: 'b', note: 'n' } } }),
      `root_status__${keyword.toLowerCase()}_select`,
    );
    expect(selector).toHaveValue('1');
    expect(node.querySelector('#root_status_reason')).toBeInTheDocument();
  });
  it('keeps the chosen option when transformChange rewrites only another part of the data', async () => {
    // Option A describes data with a `kind` and a `note` better than option B does, so only the user's choice keeps B
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        stamp: { type: 'number' },
        status: {
          [keyword]: [
            {
              title: 'A',
              type: 'object',
              properties: { kind: { type: 'string' }, note: { type: 'string' }, by: { type: 'string' } },
              required: ['by'],
            },
            {
              title: 'B',
              type: 'object',
              properties: { kind: { const: 'b' }, reason: { type: 'string' } },
              required: ['reason'],
            },
          ],
        },
      },
      allOf: [
        {
          if: {
            properties: { status: { properties: { kind: { const: 'b' } }, required: ['kind'] } },
            required: ['status'],
          },
          then: { properties: { status: { properties: { note: { type: 'string', default: 'n' } } } } },
        },
      ],
    };
    const { node, onChange } = createFormComponent({
      schema,
      initialFormData: { status: { by: 'me' } },
      transformChange: (next) => (isPlainObject(next) ? { ...next, stamp: 1 } : next),
    });
    const selector = elementOf(node, `#root_status__${keyword.toLowerCase()}_select`);

    await user.selectOptions(selector, 'B');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { stamp: 1, status: { kind: 'b', note: 'n' } } }),
      `root_status__${keyword.toLowerCase()}_select`,
    );
    expect(selector).toHaveValue('1');
    expect(node.querySelector('#root_status_reason')).toBeInTheDocument();
  });

  // The same rules as for a conditional that stops declaring the property (#5778)
  describe('a property the new option stops declaring, judged as an extra key (#5782)', () => {
    interface KindData {
      kind?: string;
      a?: unknown;
      /** A field or extra key of the object holding the options, beside the options' own */
      [key: string]: unknown;
    }
    const selectorId = `#root__${keyword.toLowerCase()}_select`;
    const unionOf = (
      rest: RJSFSchema = {},
      a: RJSFSchema = { type: 'string' },
      s: RJSFSchema = {},
      t: RJSFSchema = {},
    ): RJSFSchema => ({
      type: 'object',
      [keyword]: [
        { title: 'S', properties: { kind: { const: 's' }, a }, ...s },
        { title: 'T', properties: { kind: { const: 't' } }, ...t },
      ],
      ...rest,
    });

    async function selectT(
      schema: RJSFSchema,
      {
        whenAbsent,
        initialFormData = { kind: 's', a: 'x' },
        uiSchema,
        beforeSwitch,
      }: {
        whenAbsent?: 'allow';
        initialFormData?: KindData;
        uiSchema?: UiSchema<KindData>;
        beforeSwitch?: (node: Element) => Promise<void>;
      } = {},
    ) {
      const { node, onChange, getFormData } = createFormComponent({
        schema,
        initialFormData,
        uiSchema,
        additionalPropertiesWhenAbsent: whenAbsent,
      });
      await beforeSwitch?.(node);
      const before = getFormData();
      await user.selectOptions(elementOf(node, selectorId), 'T');
      const formData: unknown = onChange.mock.lastCall?.[0].formData;
      return { node, before, formData };
    }

    it.each<{ extras: string; schema: RJSFSchema; whenAbsent?: 'allow' }>([
      { extras: 'true', schema: unionOf({ additionalProperties: true }) },
      { extras: 'absent under allow', schema: unionOf(), whenAbsent: 'allow' },
      { extras: 'an annotation alone', schema: unionOf({ additionalProperties: { title: 'Anything' } }) },
      {
        extras: "absent under forbid, but true on the new option's own",
        schema: unionOf({}, undefined, {}, { additionalProperties: true }),
      },
    ])('keeps a string when extra keys are $extras', async ({ schema, whenAbsent }) => {
      const { node, formData } = await selectT(schema, { whenAbsent });

      expect(formData).toEqual({ kind: 't', a: 'x' });
      expect(node.querySelector('#root_a__key')).not.toBeNull();
      expect(input(node, 'root_a').value).toBe('x');
    });

    it('keeps a number the user typed over the default', async () => {
      const schema = unionOf({ additionalProperties: true }, { type: 'number', default: 1 });
      const { node, formData } = await selectT(schema, {
        initialFormData: { kind: 's' },
        beforeSwitch: async (form) => {
          await user.clear(input(form, 'root_a'));
          await user.type(input(form, 'root_a'), '5');
        },
      });

      expect(formData).toEqual({ kind: 't', a: 5 });
      expect(input(node, 'root_a').value).toBe('5');
    });

    // The key is the new option's field rather than an extra key, so it is judged as that field
    it('leaves a key the new option declares through allOf to its field', async () => {
      const schema = unionOf(
        { additionalProperties: true },
        undefined,
        {},
        { allOf: [{ properties: { a: { type: 'number' } } }] },
      );
      const { node, formData } = await selectT(schema);

      expect(formData).toEqual({ kind: 't' });
      expect(node.querySelector('#root_a__key')).toBeNull();
    });

    it('keeps a string as an extra key of an option field below the root', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { pet: unionOf({ additionalProperties: true }) } };
      const { node, onChange } = createFormComponent({ schema, initialFormData: { pet: { kind: 's', a: 'x' } } });

      await user.selectOptions(elementOf(node, `#root_pet__${keyword.toLowerCase()}_select`), 'T');

      expect(onChange.mock.lastCall?.[0].formData).toEqual({ pet: { kind: 't', a: 'x' } });
      expect(node.querySelector('#root_pet_a__key')).not.toBeNull();
    });

    // The sanitize has no `properties` to sanitize by, so it carries nothing over
    it.each<{ declares: string; t: RJSFSchema; a: RJSFSchema; initial: unknown; expected?: KindData }>([
      {
        declares: 'only its type',
        t: { title: 'T', type: 'object' },
        a: { type: 'string' },
        initial: 'x',
        expected: { a: 'x' },
      },
      { declares: 'nothing', t: { title: 'T' }, a: { type: 'string' }, initial: 'x', expected: { a: 'x' } },
      // What the old option's default filled in still drops
      {
        declares: 'nothing, for a default',
        t: { title: 'T' },
        a: { type: 'string', default: 'd' },
        initial: 'd',
        expected: {},
      },
    ])('judges a value as an extra key when the new option declares $declares', async ({ t, a, initial, expected }) => {
      const schema: RJSFSchema = {
        type: 'object',
        [keyword]: [{ title: 'S', properties: { a } }, t],
        additionalProperties: true,
      };
      const { node, formData } = await selectT(schema, { initialFormData: { a: initial } });

      expect(formData).toEqual(expected);
      expect(node.querySelector('#root_a__key') !== null).toBe(expected?.a !== undefined);
    });

    // The sanitize clears data the new option's object `const` or `enum` rejects, which the switch leaves as v7 does
    it.each<{ declares: string; option: RJSFSchema; expected: unknown }>([
      { declares: 'a const beside properties', option: { properties: { b: {} }, const: { b: 1 } }, expected: { b: 1 } },
      { declares: 'a const alone', option: { const: { b: 1 } }, expected: {} },
      { declares: 'an enum alone', option: { enum: [{ b: 1 }] }, expected: undefined },
    ])('leaves the data $declares clears as it was, keeping no extra key', async ({ option, expected }) => {
      const schema: RJSFSchema = {
        type: 'object',
        [keyword]: [
          { title: 'S', properties: { a: { type: 'string' } } },
          { title: 'T', ...option },
        ],
        additionalProperties: true,
      };
      const { node, formData } = await selectT(schema, { initialFormData: { a: 'x' } });

      expect(formData).toEqual(expected);
      expect(node.querySelector('#root_a__key')).toBeNull();
    });

    // As when the new option declares a property, which the sanitize keeps the object's own keys beside, whether or not
    // the form's sanitize keeps the key the switch leaves beside them
    it.each<{ case: string; a: RJSFSchema; name?: RJSFSchema; initial: string; expected?: KindData }>([
      {
        case: "keeps the object's own fields and extra keys beside the kept key",
        a: { type: 'string' },
        initial: 'x',
        expected: { name: 'N', a: 'x', foo: 'y' },
      },
      // The old option narrowing the object's own field still leaves it the object's
      {
        case: "keeps the object's own field where the old option re-declares it",
        a: { type: 'string' },
        name: { type: 'string', maxLength: 9 },
        initial: 'x',
        expected: { name: 'N', a: 'x', foo: 'y' },
      },
      {
        case: "keeps the object's own fields and extra keys where the key drops",
        a: { type: 'string', default: 'd' },
        initial: 'd',
        expected: { name: 'N', foo: 'y' },
      },
    ])('$case, when the new option declares nothing', async ({ a, name, initial, expected }) => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        [keyword]: [{ title: 'S', properties: { a, ...(name && { name }) } }, { title: 'T' }],
        additionalProperties: true,
      };
      const { node, formData } = await selectT(schema, { initialFormData: { name: 'N', a: initial, foo: 'y' } });

      expect(formData).toEqual(expected);
      expect(node.querySelector('#root_a__key') !== null).toBe(expected?.a !== undefined);
    });

    // With no key for the switch to leave, the object's own fields stay as they do beside a kept or dropped key. The data
    // matches T, so S is picked first
    it("keeps the object's own fields and extra keys when no key is left, when the new option declares nothing", async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        [keyword]: [{ title: 'S', properties: { a: { type: 'string' } } }, { title: 'T' }],
        additionalProperties: true,
      };
      const { node, formData } = await selectT(schema, {
        initialFormData: { name: 'N', foo: 'y' },
        beforeSwitch: (form) => user.selectOptions(elementOf(form, selectorId), 'S'),
      });

      expect(formData).toEqual({ name: 'N', foo: 'y' });
      expect(node.querySelector('#root_a__key')).toBeNull();
    });

    // Only where the object takes extra keys does `a` stay for the form's sanitize to judge
    it.each([{ ap: undefined }, { ap: false }, { ap: true }])(
      "keeps the object's own fields when the new option declares nothing, additionalProperties $ap",
      async ({ ap }) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { name: { type: 'string' } },
          [keyword]: [{ title: 'S', properties: { a: { type: 'string' } } }, { title: 'T' }],
          ...(ap !== undefined && { additionalProperties: ap }),
        };
        const { formData } = await selectT(schema, { initialFormData: { name: 'N', a: 'x' } });

        expect(formData).toEqual(ap ? { name: 'N', a: 'x' } : { name: 'N' });
      },
    );

    // Without `a` the `if` holds vacuously and fills `n`; with `kind: 'B'` beside it nothing fills `n`
    it('judges a nested value by the fill made with its siblings in place', async () => {
      const schema = unionOf(
        {},
        {
          type: 'object',
          properties: { kind: { type: 'string' }, n: { type: 'number' } },
          if: { properties: { kind: { const: 'A' } } },
          then: { properties: { n: { default: 1 } } },
        },
      );
      const { node, formData } = await selectT(schema, {
        whenAbsent: 'allow',
        initialFormData: { kind: 's', a: { kind: 'B', n: 1 } },
      });

      expect(formData).toEqual({ kind: 't', a: { kind: 'B', n: 1 } });
      expect(node.querySelector('#root_a_n__key')).not.toBeNull();
    });

    it('keeps an object whose keys its extra key renders, as extra keys of their own', async () => {
      const schema = unionOf({}, { type: 'object', properties: { b: { type: 'string' } } });
      const { node, formData } = await selectT(schema, {
        whenAbsent: 'allow',
        initialFormData: { kind: 's', a: { b: 'x' } },
      });

      expect(formData).toEqual({ kind: 't', a: { b: 'x' } });
      expect(node.querySelector('#root_a_b__key')).not.toBeNull();
      expect(input(node, 'root_a_b').value).toBe('x');
    });

    it.each([
      { held: 'only an array, and the object it empties', a: { b: ['x'] }, expected: { kind: 't' }, rendersA: false },
      {
        held: 'an array beside a string, keeping the string',
        a: { b: ['x'], c: 'y' },
        expected: { kind: 't', a: { c: 'y' } },
        rendersA: true,
      },
    ])('drops an array inside an object holding $held', async ({ a, expected, rendersA }) => {
      const schema = unionOf(
        {},
        { type: 'object', properties: { b: { type: 'array', items: { type: 'string' } }, c: { type: 'string' } } },
      );
      const { node, formData } = await selectT(schema, { whenAbsent: 'allow', initialFormData: { kind: 's', a } });

      expect(formData).toEqual(expected);
      expect(node.querySelector('#root_a__key') !== null).toBe(rendersA);
      expect(node.querySelector('#root_a_b__key')).toBeNull();
    });

    it.each<{ extras: string; schema: RJSFSchema; initialFormData?: KindData }>([
      { extras: '{ type: number }', schema: unionOf({ additionalProperties: { type: 'number' } }) },
      { extras: 'false', schema: unionOf({ additionalProperties: false }) },
      // The object stubs its extra keys with the selected option's `additionalProperties`
      {
        extras: "true, but false on the new option's own",
        schema: unionOf({ additionalProperties: true }, undefined, {}, { additionalProperties: false }),
      },
      { extras: 'absent under forbid', schema: unionOf() },
      // A guessed array stub declares no `items`, so it renders none of the items it would hold
      {
        extras: 'true, for an array',
        schema: unionOf({ additionalProperties: true }, { type: 'array', items: { type: 'string' } }),
        initialFormData: { kind: 's', a: ['x', 'y'] },
      },
      // The guessed object stub takes no extra keys of its own under `'forbid'`, so it would render none of `b`
      {
        extras: 'true, for an object whose keys the stub forbids',
        schema: unionOf({ additionalProperties: true }, { type: 'object', properties: { b: { type: 'string' } } }),
        initialFormData: { kind: 's', a: { b: 'x' } },
      },
    ])('drops the value when extra keys are $extras', async ({ schema, initialFormData }) => {
      const { node, formData } = await selectT(schema, { initialFormData });

      expect(formData).toEqual({ kind: 't' });
      expect(node.querySelector('#root_a__key')).toBeNull();
    });

    // The form fills these in by itself, so keeping them would leave extra-key rows the user never typed
    it.each<{
      filled: string;
      schema: RJSFSchema;
      held: unknown;
      initialFormData?: KindData;
      whenAbsent?: 'allow';
    }>([
      {
        filled: 'a default',
        schema: unionOf({ additionalProperties: true }, { type: 'string', default: 'd' }),
        held: 'd',
      },
      {
        filled: 'a const',
        schema: unionOf({ additionalProperties: true }, { type: 'string', const: 'x' }),
        held: 'x',
      },
      {
        filled: "a required object's empty object",
        schema: unionOf(
          { additionalProperties: true },
          { type: 'object', properties: { b: { type: 'string' } } },
          { required: ['a'] },
        ),
        held: {},
      },
      {
        filled: "a required boolean's false",
        schema: unionOf({ additionalProperties: true }, { type: 'boolean' }, { required: ['a'] }),
        held: false,
      },
      // Required on the schema holding the options, which the option inherits
      {
        filled: "a boolean's false the parent's required fills",
        schema: unionOf({ additionalProperties: true, required: ['a'] }, { type: 'boolean' }),
        held: false,
      },
      {
        filled: "an object its properties' defaults fill",
        schema: unionOf({}, { type: 'object', properties: { b: { type: 'string', default: 'q' } } }),
        held: { b: 'q' },
        whenAbsent: 'allow',
      },
      {
        filled: "the option's own default",
        schema: unionOf({ additionalProperties: true }, { type: 'string' }, { default: { a: 'o' } }),
        held: 'o',
      },
      {
        filled: "the parent's default",
        schema: unionOf({ additionalProperties: true, default: { kind: 's', a: 'p' } }),
        held: 'p',
      },
      {
        filled: 'an empty object',
        schema: unionOf({ additionalProperties: true }, { type: 'object', properties: { b: { type: 'string' } } }),
        held: {},
        initialFormData: { kind: 's', a: {} },
      },
    ])(
      'drops $filled rather than keeping it as an extra key',
      async ({ schema, held, initialFormData = { kind: 's' }, whenAbsent }) => {
        const { node, before, formData } = await selectT(schema, { initialFormData, whenAbsent });

        expect(before).toEqual({ kind: 's', a: held });
        expect(formData).toEqual({ kind: 't' });
        expect(node.querySelector('#root_a__key')).toBeNull();
      },
    );

    it('keeps a required boolean the user checked', async () => {
      const schema = unionOf({ additionalProperties: true }, { type: 'boolean' }, { required: ['a'] });
      const { node, formData } = await selectT(schema, {
        initialFormData: { kind: 's' },
        beforeSwitch: (form) => user.click(input(form, 'root_a')),
      });

      expect(formData).toEqual({ kind: 't', a: true });
      expect(node.querySelector('#root_a__key')).not.toBeNull();
    });

    it("drops what the option's ui:initialValue filled in, and keeps what the user typed over it", async () => {
      const schema = unionOf({ additionalProperties: true });
      const uiSchema: UiSchema<KindData> = { [keyword]: [{ a: { 'ui:initialValue': 'd' } }, {}] };
      const filled = await selectT(schema, {
        initialFormData: { kind: 's' },
        uiSchema,
        beforeSwitch: async (form) => expect(input(form, 'root_a').value).toBe('d'),
      });
      expect(filled.formData).toEqual({ kind: 't' });

      const typed = await selectT(schema, {
        initialFormData: { kind: 's' },
        uiSchema,
        beforeSwitch: async (form) => {
          await user.clear(input(form, 'root_a'));
          await user.type(input(form, 'root_a'), 'x');
        },
      });
      expect(typed.formData).toEqual({ kind: 't', a: 'x' });
    });

    it("drops what the parent's default filled in beside what the user typed", async () => {
      const schema = unionOf(
        { default: { kind: 's', a: { c: 'y' } } },
        { type: 'object', properties: { b: { type: 'string' }, c: { type: 'string' } } },
      );
      const { node, formData } = await selectT(schema, {
        whenAbsent: 'allow',
        initialFormData: { kind: 's' },
        beforeSwitch: (form) => user.type(input(form, 'root_a_b'), 'x'),
      });

      expect(formData).toEqual({ kind: 't', a: { b: 'x' } });
      expect(input(node, 'root_a_b').value).toBe('x');
      expect(node.querySelector('#root_a_c__key')).toBeNull();
    });

    // The form fills the option field from the root, whose `default` reaches it from above (#5812)
    it('drops what a default declared above the option field filled in', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { pet: unionOf({ additionalProperties: true }) },
        default: { pet: { kind: 's', a: 'p' } },
      };
      const { node, onChange, getFormData } = createFormComponent({ schema });
      expect(getFormData()).toEqual({ pet: { kind: 's', a: 'p' } });

      await user.selectOptions(elementOf(node, `#root_pet__${keyword.toLowerCase()}_select`), 'T');

      expect(onChange.mock.lastCall?.[0].formData).toEqual({ pet: { kind: 't' } });
      expect(node.querySelector('#root_pet_a__key')).toBeNull();
    });

    // Both options fit `{ b: 'y' }`, which matches the first, so only the selection says Y filled it (#5812)
    it('drops what the option the user picked inside the value filled in', async () => {
      const schema = unionOf(
        {},
        {
          type: 'object',
          anyOf: [
            { title: 'X', properties: { b: { type: 'string', default: 'x' } } },
            { title: 'Y', properties: { b: { type: 'string', default: 'y' } } },
          ],
        },
      );
      const { node, before, formData } = await selectT(schema, {
        whenAbsent: 'allow',
        initialFormData: { kind: 's' },
        beforeSwitch: (form) => user.selectOptions(elementOf(form, '#root_a__anyof_select'), 'Y'),
      });

      expect(before).toEqual({ kind: 's', a: { b: 'y' } });
      expect(formData).toEqual({ kind: 't' });
      expect(node.querySelector('#root_a__key')).toBeNull();
    });

    /** A parent field that sends each property's change as the whole object at its own path, as one that keeps the data
     * does, with the property's value as `copy` makes it */
    function objectFieldSendingWhole(copy: (value: unknown) => unknown) {
      return function WholeObjectSendingField(props: FieldProps<GenericObjectType>) {
        const { ObjectField: InnerObjectField } = props.registry.fields;
        return (
          <InnerObjectField
            {...props}
            onChange={(value, fieldPath, errorSchema, id) =>
              props.onChange({ ...props.formData, [String(fieldPath)]: copy(value) }, props.fieldPath, errorSchema, id)
            }
          />
        );
      };
    }
    const WholeObjectField = objectFieldSendingWhole((value) => value);

    // The second row has no `const`, so the old data without `a` matches T, and only the option switched away from
    // fills `a` there
    it.each<{
      case: string;
      pet: RJSFSchema;
      rootDefault?: RJSFSchema['default'];
      initialFormData?: KindData;
      filled: KindData;
      switched: KindData;
    }>([
      {
        case: "the old option's default",
        pet: unionOf({ additionalProperties: true }, { type: 'string', default: 'd' }),
        initialFormData: { pet: { kind: 's' } },
        filled: { pet: { kind: 's', a: 'd' } },
        switched: { pet: { kind: 't' } },
      },
      {
        case: 'a root default, for options told apart by required alone',
        pet: {
          type: 'object',
          additionalProperties: true,
          [keyword]: [
            { title: 'S', properties: { a: { type: 'string' } }, required: ['a'] },
            { title: 'T', properties: { b: { type: 'string' } } },
          ],
        },
        rootDefault: { pet: { a: 'p' } },
        filled: { pet: { a: 'p' } },
        switched: { pet: {} },
      },
    ])('drops what $case filled in when a parent field sends the switch at its own path', async (row) => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { pet: row.pet },
        ...(row.rootDefault && { default: row.rootDefault }),
      };
      const { node, onChange, getFormData } = createFormComponent({
        schema,
        uiSchema: { 'ui:field': WholeObjectField },
        initialFormData: row.initialFormData,
      });
      expect(getFormData()).toEqual(row.filled);

      await user.selectOptions(elementOf(node, `#root_pet__${keyword.toLowerCase()}_select`), 'T');

      expect(onChange.mock.lastCall?.[0].formData).toEqual(row.switched);
      expect(node.querySelector('#root_pet_a__key')).toBeNull();
    });

    // The form takes a parent's change as the switch only where it holds the value the switch sent, so a copy of it
    // leaves the keys out, as outside a `Form`, while the switch itself has the typed key judged and kept
    it.each([
      { sends: 'the value the switch sent', copy: (value: unknown) => value, expected: { kind: 't', a: 'x' } },
      { sends: 'a copy of it', copy: (value: unknown) => structuredClone(value), expected: { kind: 't' } },
    ])('judges a typed key the switch leaves where a parent field sends $sends', async ({ copy, expected }) => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { pet: unionOf({ additionalProperties: true }, { type: 'string', default: 'd' }) },
      };
      const { node, onChange } = createFormComponent({
        schema,
        uiSchema: { 'ui:field': objectFieldSendingWhole(copy) },
        initialFormData: { pet: { kind: 's', a: 'x' } },
      });

      await user.selectOptions(elementOf(node, `#root_pet__${keyword.toLowerCase()}_select`), 'T');

      expect(onChange.mock.lastCall?.[0].formData).toEqual({ pet: expected });
      expect(node.querySelector('#root_pet_a__key') !== null).toBe('a' in expected);
    });

    // `{}` fits T as it fits S, so only the form's refusal, which the field hears of, shows S again
    it('shows the option switched away from when transformChange refuses a switch a parent field sends', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          pet: {
            type: 'object',
            [keyword]: [
              { title: 'S', properties: { a: { type: 'string' } } },
              { title: 'T', properties: { b: { type: 'string' } } },
            ],
          },
        },
      };
      const { node, onChange } = createFormComponent({
        schema,
        uiSchema: { 'ui:field': WholeObjectField },
        initialFormData: { pet: {} },
        transformChange: (_next, previous) => previous,
      });
      const selector = elementOf(node, `#root_pet__${keyword.toLowerCase()}_select`);
      expect(selector).toHaveValue('0');

      await user.selectOptions(selector, 'T');

      expect(onChange.mock.lastCall?.[0].formData).toEqual({ pet: {} });
      expect(selector).toHaveValue('0');
    });

    // Without a `const`, the key `a` the switch leaves makes the data match S again, so the fill holds T at the switched
    // field as for the field's own switch, and writes none of S's defaults, in a `transformChange` rewrite too
    it.each<{ rewrite: string; transformChange?: (next: unknown) => unknown; extra?: object }>([
      { rewrite: 'no rewrite' },
      {
        rewrite: 'a transformChange rewrite',
        transformChange: (next) => ({ ...(isPlainObject(next) ? next : {}), other: 1 }),
        extra: { other: 1 },
      },
    ])(
      'fills no default of the option switched away from where a parent field sends a switch that leaves a key, with $rewrite',
      async ({ transformChange, extra }) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            pet: {
              type: 'object',
              additionalProperties: true,
              [keyword]: [
                { title: 'S', properties: { a: { type: 'string' }, c: { type: 'string', default: 'cd' } } },
                { title: 'T', properties: { b: { type: 'string' } } },
              ],
            },
          },
        };
        const { node, onChange, getFormData } = createFormComponent({
          schema,
          uiSchema: { 'ui:field': WholeObjectField },
          initialFormData: { pet: { a: 'x' } },
          transformChange,
        });
        expect(getFormData()).toEqual({ pet: { a: 'x', c: 'cd' } });
        const selector = elementOf(node, `#root_pet__${keyword.toLowerCase()}_select`);

        await user.selectOptions(selector, 'T');

        expect(onChange.mock.lastCall?.[0].formData).toEqual({ pet: { a: 'x' }, ...extra });
        expect(selector).toHaveValue('1');
      },
    );

    // Neither list has a place in the root, so both key their selection by `''`, and only the inner one switches
    it('judges a key the inner of two option lists at one path leaves against the inner old option', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          pet: {
            type: 'object',
            additionalProperties: true,
            [keyword]: [
              { title: 'C', properties: { c: { type: 'string' } }, required: ['c'] },
              {
                title: 'Inner',
                anyOf: [
                  { title: 'A', properties: { a: { type: 'string', default: 'd' } } },
                  { title: 'B', properties: { b: { type: 'string' } } },
                ],
              },
            ],
          },
        },
      };
      const { node, onChange, getFormData } = createFormComponent({ schema, initialFormData: { pet: {} } });
      expect(getFormData()).toEqual({ pet: { a: 'd' } });

      const innerSelector = keyword === 'anyOf' ? '#root_pet__anyof_select2' : '#root_pet__anyof_select';
      await user.selectOptions(elementOf(node, innerSelector), 'B');

      expect(onChange.mock.lastCall?.[0].formData).toEqual({ pet: {} });
      expect(node.querySelector('#root_pet_a__key')).toBeNull();
    });

    // Nothing outside a `Form` judges the key, so the switch leaves it out, as the sanitize did
    it('leaves out a key only the old option declares outside a Form', async () => {
      const schema = unionOf({ additionalProperties: true });
      const onChange = vi.fn();
      render(
        <SchemaField
          name=''
          id='root'
          fieldPath={ROOT_FIELD_PATH}
          schema={schema}
          uiSchema={{}}
          formData={{ kind: 's', a: 'x' }}
          errorSchema={{}}
          registry={getTestRegistry(schema)}
          required={false}
          readonly={false}
          disabled={false}
          autofocus={false}
          hideError={false}
          onChange={onChange}
          onBlur={noop}
          onFocus={noop}
        />,
      );

      await user.selectOptions(screen.getByRole('combobox'), 'T');

      expect(onChange.mock.lastCall?.[0]).toEqual({ kind: 't' });
    });
  });
});

describe('oneOf with a precompiled validator', () => {
  function precompiledValidator(schema: RJSFSchema) {
    const validateFns: ValidatorFunctions = {};
    // The compiled module is CommonJS that writes its functions to `exports` and loads Ajv's runtime helpers, such as
    // the one a `minLength` counts characters with, through `require`, which is how a bundler would load it
    // oxlint-disable-next-line no-new-func, typescript/no-implied-eval
    new Function('exports', 'require', compileSchemaValidatorsCode(schema)).call(
      undefined,
      validateFns,
      createRequire(import.meta.url),
    );
    return createPrecompiledValidator(validateFns, schema);
  }
  function oneOfField(option: RJSFSchema): RJSFSchema {
    return { type: 'object', properties: { v: { oneOf: [option, { type: 'number' }] } } };
  }
  function input(node: Element, id: string): HTMLInputElement {
    const element = node.querySelector(`#${id}`);
    if (!(element instanceof HTMLInputElement)) {
      throw new Error(`No input #${id}`);
    }
    return element;
  }

  it('renders an option whose if has no else before the if holds, and adds the then once it does (#5453)', async () => {
    const schema = oneOfField({
      type: 'object',
      properties: { a: { type: 'string' } },
      if: { properties: { a: { const: 'x' } }, required: ['a'] },
      then: { properties: { extra: { type: 'string' } } },
    });
    const { node, onChange } = createFormComponent(
      { schema, initialFormData: { v: { a: 'y' } } },
      precompiledValidator(schema),
    );
    expect(input(node, 'root_v_a')).toHaveValue('y');
    expect(node.querySelector('#root_v_extra')).toBeNull();

    await user.type(input(node, 'root_v_a'), 'x', { initialSelectionStart: 0, initialSelectionEnd: 1 });
    await user.type(input(node, 'root_v_extra'), 'e');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { v: { a: 'x', extra: 'e' } } }),
      'root_v_extra',
    );
  });
  it("renders and edits an option whose own patternProperties match the data's keys (#5454)", async () => {
    const schema = oneOfField({
      type: 'object',
      properties: { id: { type: 'string' } },
      patternProperties: { '^s_': { type: 'string' }, '^s_n': { minLength: 2 } },
    });
    const { node, onChange } = createFormComponent(
      { schema, initialFormData: { v: { id: 'a', s_na: 'xx' } } },
      precompiledValidator(schema),
    );
    expect(input(node, 'root_v_id')).toHaveValue('a');
    expect(input(node, 'root_v_s_na')).toHaveValue('xx');

    await user.type(input(node, 'root_v_s_na'), 'y');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { v: { id: 'a', s_na: 'xxy' } } }),
      'root_v_s_na',
    );
  });
  it('opens and switches definitions offering each other as options, whose matching it compiled (#4990)', async () => {
    createFormComponent(
      { schema: CROSS_REFERENCING_SCHEMA, initialFormData: nestedChildren(4) },
      precompiledValidator(CROSS_REFERENCING_SCHEMA),
    );
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(5);
    const deepest = selects[4];
    const [, firstDefinition] = within(deepest).getAllByRole('option');

    await user.selectOptions(deepest, firstDefinition);

    expect(screen.getAllByRole('combobox')).toHaveLength(6);
  });
  it('renders and edits an option that carries an $id, with a key its additionalProperties match (#5455)', async () => {
    const schema = oneOfField({
      $id: 'myOption',
      type: 'object',
      properties: { id: { type: 'string' } },
      additionalProperties: { type: 'string' },
    });
    const { node, onChange } = createFormComponent(
      { schema, initialFormData: { v: { id: 'a', extra: 'x' } } },
      precompiledValidator(schema),
    );
    expect(input(node, 'root_v_extra')).toHaveValue('x');
    expect(input(node, 'root_v_id')).toHaveValue('a');

    await user.type(input(node, 'root_v_id'), 'b');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { v: { id: 'ab', extra: 'x' } } }),
      'root_v_id',
    );
  });
});
