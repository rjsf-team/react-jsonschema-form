import { createRef } from 'react';
import type { FieldProps, FormValidation, GenericObjectType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { noop } from '@rjsf/utils';
import userEvent from '@testing-library/user-event';

import SchemaField from '../src/components/fields/SchemaField.tsx';
import SelectWidget from '../src/components/widgets/SelectWidget.tsx';
import { createFormComponent, getSelectedOptionValue, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

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
    expect(node.querySelectorAll('span.required')).toHaveLength(1);
    expect(node.querySelectorAll('#root_XxxOf__description')).toHaveLength(1);
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
    expect(node.querySelectorAll('span.required')).toHaveLength(2);
  });

  it('should assign a default value and set defaults on option change', async () => {
    const { node, onChange } = createFormComponent({
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

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'defaultfoo' },
      }),
    );

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
    const { node, onChange } = createFormComponent({
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

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'defaultfoo' },
      }),
    );

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
        experimental_defaultFormStateBehavior: { constAsDefaults: 'never' },
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
        formData: { kind: 'a', runner: { name: 'a' } },
        experimental_defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { kind: 'b', runner: { name: 'a' } } }),
        'root__oneof_select',
      );
    });
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
    const switchToB = async (requiredOnParent: boolean) => {
      const { node, onChange } = createFormComponent({
        schema: schemaFor(requiredOnParent),
        experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
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
    const { node, onChange } = createFormComponent({ schema, formData: { kind: 'a', flag: false } });

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
      formData: { kind: 'a', license: 'custom' },
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
    const { node, onChange } = createFormComponent({ schema, formData: { kind: 'a', runner: { name: 'typed' } } });

    await user.selectOptions(node.querySelector<HTMLSelectElement>('#root__oneof_select')!, '1');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { kind: 'b', runner: 'solo' } }),
      'root__oneof_select',
    );
  });

  it("should assign a default value and set defaults on option change with 'type': 'object' missing", async () => {
    const { node, onChange } = createFormComponent({
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

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'defaultfoo' },
      }),
    );

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
    const { node, onChange } = createFormComponent({
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
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'defaultfoo' },
      }),
    );

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
      formData: { choice: 'first' },
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
    const formContext: GenericObjectType = { root: 'root-id', root_userId: 'userId-id' };

    function CustomSchemaField(props: FieldProps) {
      const {
        registry: { formContext },
        fieldPathId,
      } = props;
      return (
        <>
          <code id={formContext[fieldPathId.$id]}>Ha</code>
          <SchemaField {...props} />
        </>
      );
    }

    const { node } = createFormComponent({
      schema,
      formData: { userId: 'foobarbaz' },
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
      formData: {
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

    const { rerender, node } = createFormComponent({
      ref: createRef(),
      schema,
    });

    expect(node.querySelector('select')).toHaveValue('0');

    rerender({
      schema,
      formData: {
        userId: 'foobarbaz',
      },
    });

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
      formData: {
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
      formData: { lorem: {} },
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
      formData: { testProperty: { newKey: { prop2: 'foo' } } },
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
      formData: {
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

      expect(node.querySelector('.rjsf-array-item-add button')).not.toEqual(null);

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

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
        formData: {
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
        formData: {
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
        formData: [{ ipsum: { night: 'nicht' } }],
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

      expect(node.querySelector('.rjsf-array-item-add button')).not.toEqual(null);

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

      const $select = node.querySelector('select');
      expect($select).not.toEqual(null);
      await user.selectOptions($select!, $select!.options[1].value);

      // This works because the nested "add" button will now be the first to
      // appear in the dom
      await user.click(node.querySelector('.rjsf-array-item-add button')!);

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
      const inputLabel = node.querySelector('legend#root__title');
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
          oneOf: { 'ui:title': 'UiSchema title' },
        },
      });

      expect(consoleWarnSpy).toHaveBeenLastCalledWith('uiSchema.oneOf is not an array for "My Title"');

      const $select = node.querySelector('select');

      // Also verify the base uiSchema was passed down to the underlying widget by confirming the label (in the legend)
      // matches the selected option's title
      expect($select).toHaveValue('0');
      const inputLabel = node.querySelector('legend#root__title');
      expect(inputLabel?.innerHTML).toEqual('My Title');
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

      expect(node.querySelector('.rjsf-array-item-add button')).not.toEqual(null);

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

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
        formData: {
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
      const { node, onChange } = createFormComponent({
        schema,
      });

      // Added an empty array initially
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { craftTypes: [{ daysOfYear: [undefined] }] },
        }),
      );

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

    function customValidate(_: any, errors: FormValidation) {
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

      let inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=number]');
      expect(inputs[0]).toHaveAttribute('id', 'root_userId');

      const $select = node.querySelector('select');

      await user.selectOptions($select!, $select!.options[1].value);

      const userIdInput2 = node.querySelector('input#root_userId')!;
      await user.clear(userIdInput2);
      await user.type(userIdInput2, 'Lorem ipsum dolor sit amet');
      await submitForm(node, user);

      inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=text]');
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

      let inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=number]');
      expect(inputs).toHaveLength(0);

      const $select = node.querySelector('select');

      await user.selectOptions($select!, $select!.options[1].value);

      const userIdInput2 = node.querySelector('input#root_userId')!;
      await user.clear(userIdInput2);
      await user.type(userIdInput2, 'Lorem ipsum dolor sit amet');
      await submitForm(node, user);

      inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=text]');
      expect(inputs).toHaveLength(0);
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
        formData: { code: 'baz_coding' },
      });
      const select = node.querySelector('select#root__oneof_select');
      expect(select).toHaveValue('2');
    });
    it('warns when discriminator.propertyName is not a string', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
      const badSchema = { ...schema, discriminator: { propertyName: 5 } };
      const { node } = createFormComponent({
        schema: badSchema,
      });
      const select = node.querySelector('select#root__oneof_select');
      expect(select).toHaveValue('0');
      expect(consoleWarnSpy).toHaveBeenLastCalledWith('Expecting discriminator to be a string, got "number" instead');
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
    it('should be rendered twice', () => {
      const { node } = createFormComponent({ schema, uiSchema });
      const fields = node.querySelectorAll('.custom-field');
      expect(fields).toHaveLength(2);
    });
    it('should render <select>', () => {
      const { node } = createFormComponent({ schema, uiSchema });
      const selects = node.querySelectorAll('select');
      expect(selects).toHaveLength(1);
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
        formData: {
          items: [{ type: 'typeA', showField: true }],
        },
        experimental_defaultFormStateBehavior: {
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
        formData: {
          items: [{ type: 'typeA' }], // No showField defined
        },
        experimental_defaultFormStateBehavior: {
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
      // with id="root_XxxOf" in addition to the OneOfField selector. Typing into that
      // input corrupted formData (e.g. set { XxxOf: value } instead of a plain string).
      const { node } = createFormComponent({ schema: ipSchema });

      expect(node.querySelector('input#root_XxxOf')).not.toBeInTheDocument();
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

      expect(node.querySelector('input#root_XxxOf')).not.toBeInTheDocument();
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

      expect(node.querySelector('[id="root_XxxOf"]')).not.toBeInTheDocument();
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
    const { node } = createFormComponent({ schema, formData });
    const select = node.querySelector('#root_status__oneof_select');
    await user.selectOptions(select!, '1');

    expect(select).toHaveValue('1');
  });
});
