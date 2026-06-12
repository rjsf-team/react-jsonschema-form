import { createRef } from 'react';
import type { FormValidation, RJSFSchema, WidgetProps } from '@rjsf/utils';
import userEvent from '@testing-library/user-event';
import noop from 'lodash/noop';

import SelectWidget from '../src/components/widgets/SelectWidget';
import { createFormComponent, getSelectedOptionValue, submitForm } from './testUtils';

const user = userEvent.setup();

describe('anyOf', () => {
  it('should not render a select element if the anyOf keyword is not present', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const { node } = createFormComponent({
      ref: createRef(),
      schema,
    });

    expect(node.querySelectorAll('select')).toHaveLength(0);
  });

  it('should not render an empty fieldset for pure anyOf schemas without properties', () => {
    const schema: RJSFSchema = {
      type: 'object',
      anyOf: [
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

    // The root element should NOT be a fieldset#root with empty content.
    // Instead, the form should render the anyOf select and selected variant directly.
    // There should be only ONE fieldset (from the selected variant), not a nested empty wrapper.
    const fieldsets = node.querySelectorAll('fieldset');
    expect(fieldsets.length).toBeLessThanOrEqual(1);

    // The anyOf select should still be rendered
    const anyOfSelect = node.querySelector('select[id="root__anyof_select"]');
    expect(anyOfSelect).not.toBeNull();
  });

  it('should render a select element if the anyOf keyword is present, merges top level required', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['baz'],
      properties: {
        baz: { type: 'number' },
      },
      description: 'top level description',
      anyOf: [
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
      ref: createRef(),
      schema,
    });

    expect(node.querySelectorAll('select')).toHaveLength(1);
    expect(node.querySelector('select')).toHaveAttribute('id', 'root__anyof_select');
    expect(node.querySelectorAll('span.required')).toHaveLength(1);
    expect(node.querySelectorAll('#root_XxxOf__description')).toHaveLength(1);
    expect(node.querySelectorAll('#root_baz')).toHaveLength(1);
  });

  it('should render a select element if the anyOf keyword is present, merges top level and anyOf required', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['baz'],
      properties: {
        baz: { type: 'number' },
      },
      anyOf: [
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
    expect(node.querySelector('select')).toHaveAttribute('id', 'root__anyof_select');
    expect(node.querySelectorAll('span.required')).toHaveLength(2);
  });

  it('should render a root select element with default value', () => {
    const formData = { foo: 'b' };
    const schema: RJSFSchema = {
      type: 'object',
      anyOf: [
        {
          title: 'foo1',
          properties: {
            foo: { type: 'string', enum: ['a', 'b'], default: 'a' },
          },
        },
        {
          title: 'foo2',
          properties: {
            foo: { type: 'string', enum: ['a', 'b'], default: 'b' },
          },
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
      formData,
    });
    expect(node.querySelector('select')).toHaveValue('1');
  });

  it('should assign a default value and set defaults on option change', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        anyOf: [
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
      'root__anyof_select',
    );
  });

  it('should assign a default value and set defaults on option change for scalar types schemas', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          foo: {
            anyOf: [
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
      'root_foo__anyof_select',
    );
  });

  it('should assign a default value and set defaults on option change when using references', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        anyOf: [
          {
            type: 'object',
            properties: {
              foo: { type: 'string', default: 'defaultfoo' },
            },
          },
          {
            $ref: '#/definitions/bar',
          },
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
      'root__anyof_select',
    );
  });

  it("should assign a default value and set defaults on option change with 'type': 'object' missing", async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        anyOf: [
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
      'root__anyof_select',
    );
  });

  it('should render a custom widget', () => {
    const schema: RJSFSchema = {
      type: 'object',
      anyOf: [
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
      anyOf: [
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
      anyOf: [
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
      anyOf: [
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
      'root__anyof_select',
    );
  });

  it('should support options with different types', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          anyOf: [
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
        formData: { userId: 12345 },
      }),
      'root_userId',
    );

    const $select = node.querySelector('select');

    await user.selectOptions($select!, $select!.options[1].value);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { userId: undefined },
      }),
      'root_userId__anyof_select',
    );

    const userIdInput2 = node.querySelector('input#root_userId')!;
    await user.clear(userIdInput2);
    await user.type(userIdInput2, 'Lorem ipsum dolor sit amet');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { userId: 'Lorem ipsum dolor sit amet' },
      }),
      'root_userId',
    );
  });

  it('should support custom fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          anyOf: [
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

    const CustomField = () => <div id='custom-anyof-field' />;

    const { node } = createFormComponent({
      schema,
      fields: {
        AnyOfField: CustomField,
      },
    });

    expect(node.querySelectorAll('#custom-anyof-field')).toHaveLength(1);
  });

  it('should support custom widget', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        choice: {
          anyOf: [
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
        throw new Error('Value should not be -1 for anyOf');
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
      'root_choice__anyof_select',
    );
  });

  it('should select the correct field when the form is rendered from existing data', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          anyOf: [
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
          anyOf: [
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

    rerender({ schema, formData: { userId: 'foobarbaz' } });

    expect(node.querySelector('select')).toHaveValue('1');
  });

  it('should not change the selected option when entering values', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      anyOf: [
        {
          title: 'First method of identification',
          properties: {
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
          },
        },
        {
          title: 'Second method of identification',
          properties: {
            idCode: {
              type: 'string',
            },
          },
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    const $select = node.querySelector('select');

    expect($select).toHaveValue('0');

    await user.selectOptions($select!, $select!.options[1].value);

    expect($select).toHaveValue('1');

    const idCodeInput = node.querySelector('input#root_idCode')!;
    await user.clear(idCodeInput);
    await user.type(idCodeInput, 'Lorem ipsum dolor sit amet');

    expect($select).toHaveValue('1');
  });

  it('should not change the selected option when entering values and the subschema uses `anyOf`', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      anyOf: [
        {
          title: 'First method of identification',
          properties: {
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
          },
        },
        {
          title: 'Second method of identification',
          properties: {
            idCode: {
              type: 'string',
            },
          },
          anyOf: [
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
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    const $select = node.querySelector('select');

    expect($select).toHaveValue('0');

    await user.selectOptions($select!, $select!.options[1].value);

    expect($select).toHaveValue('1');

    const idCodeInput = node.querySelector('input#root_idCode')!;
    await user.clear(idCodeInput);
    await user.type(idCodeInput, 'Lorem ipsum dolor sit amet');

    expect($select).toHaveValue('1');
  });

  it('should not change the selected option when entering values and the subschema uses `allOf`', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      anyOf: [
        {
          title: 'First method of identification',
          properties: {
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
          },
        },
        {
          title: 'Second method of identification',
          properties: {
            idCode: {
              type: 'string',
            },
          },
          allOf: [
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
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    const $select = node.querySelector('select');

    expect($select).toHaveValue('0');

    await user.selectOptions($select!, $select!.options[1].value);

    expect($select).toHaveValue('1');

    const idCodeInput = node.querySelector('input#root_idCode')!;
    await user.clear(idCodeInput);
    await user.type(idCodeInput, 'Lorem ipsum dolor sit amet');

    expect($select).toHaveValue('1');
  });

  it('should not mutate a schema that contains nested anyOf and allOf', () => {
    const schema: RJSFSchema = {
      type: 'object',
      anyOf: [
        {
          properties: {
            foo: { type: 'string' },
          },
          allOf: [
            {
              properties: {
                baz: { type: 'string' },
              },
            },
          ],
          anyOf: [
            {
              properties: {
                buzz: { type: 'string' },
              },
            },
          ],
        },
      ],
    };

    createFormComponent({
      schema,
    });

    expect(schema).toEqual({
      type: 'object',
      anyOf: [
        {
          properties: {
            foo: { type: 'string' },
          },
          allOf: [
            {
              properties: {
                baz: { type: 'string' },
              },
            },
          ],
          anyOf: [
            {
              properties: {
                buzz: { type: 'string' },
              },
            },
          ],
        },
      ],
    });
  });

  it('should use title from refs schema before using fallback generated value as title', () => {
    const schema: RJSFSchema = {
      definitions: {
        address: {
          title: 'Address',
          type: 'object',
          properties: {
            street: {
              title: 'Street',
              type: 'string',
            },
          },
        },
        person: {
          title: 'Person',
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
            },
          },
        },
        nested: {
          $ref: '#/definitions/person',
        },
      },
      anyOf: [
        {
          $ref: '#/definitions/address',
        },
        {
          $ref: '#/definitions/nested',
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    const options = node.querySelectorAll('option');
    expect(options[0].firstChild?.nodeValue).toEqual('Address');
    expect(options[1].firstChild?.nodeValue).toEqual('Person');
  });

  it('should collect schema from $ref even when ref is within properties', () => {
    const schema: RJSFSchema = {
      properties: {
        address: {
          title: 'Address',
          type: 'object',
          properties: {
            street: {
              title: 'Street',
              type: 'string',
            },
          },
        },
        person: {
          title: 'Person',
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
            },
          },
        },
        nested: {
          $ref: '#/properties/person',
        },
      },
      anyOf: [
        {
          $ref: '#/properties/address',
        },
        {
          $ref: '#/properties/nested',
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    const options = node.querySelectorAll('option');
    expect(options[0].firstChild?.nodeValue).toEqual('Address');
    expect(options[1].firstChild?.nodeValue).toEqual('Person');
  });

  it('should select anyOf in additionalProperties with anyOf', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        testProperty: {
          description: 'Any key name, fixed set of possible values',
          type: 'object',
          minProperties: 1,
          additionalProperties: {
            anyOf: [
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

    const $select: HTMLSelectElement | null = node.querySelector('select#root_testProperty_newKey__anyof_select');

    expect($select).toHaveValue('1');

    await user.selectOptions($select!, $select!.options[0].value);

    expect($select).toHaveValue('0');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          testProperty: { newKey: { prop1: undefined, prop2: undefined } },
        },
      }),
      'root_testProperty_newKey__anyof_select',
    );
  });

  describe('Arrays', () => {
    it('should correctly render form inputs for anyOf inside array items', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              anyOf: [
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
      });

      expect(node.querySelector('.rjsf-array-item-add button')).not.toBeNull();

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

      expect(node.querySelectorAll('select')).toHaveLength(1);

      expect(node.querySelectorAll('input#root_items_0_foo')).toHaveLength(1);
    });

    it('should not change the selected option when switching order of items for anyOf inside array items', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              anyOf: [
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

    it('should correctly update inputs for anyOf inside array items after being moved down', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              anyOf: [
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
    it('should correctly render mixed types for anyOf inside array items', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              anyOf: [
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

      expect(node.querySelector('.rjsf-array-item-add button')).not.toBeNull();

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

      const $select = node.querySelector('select');
      expect($select).not.toBeNull();
      await user.selectOptions($select!, $select!.options[1].value);

      expect(node.querySelectorAll('input#root_items_0_foo')).toHaveLength(1);
      expect(node.querySelectorAll('input#root_items_0_bar')).toHaveLength(1);
    });
  });

  describe('definitions', () => {
    it('should correctly set the label of the options', () => {
      const schema: RJSFSchema = {
        type: 'object',
        anyOf: [
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
        anyOf: [
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
        anyOf: [
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

    it('should correctly set the label of the options, with uiSchema-based titles, for each anyOf option', () => {
      const schema: RJSFSchema = {
        type: 'object',
        anyOf: [
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
          anyOf: [
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

    it('should warn when the anyOf in the uiSchema is not an array, and pass the base uiSchema down', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
      const schema: RJSFSchema = {
        type: 'object',
        anyOf: [
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
          anyOf: { 'ui:title': 'UiSchema title' },
        },
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('uiSchema.anyOf is not an array for "My Title"');
      consoleWarnSpy.mockRestore();

      const $select = node.querySelector('select');

      // Also verify the base uiSchema was passed down to the underlying widget by confirming the label (in the legend)
      // matches the selected option's title
      expect($select).toHaveValue('0');
      const inputLabel = node.querySelector('legend#root__title');
      expect(inputLabel?.innerHTML).toEqual('My Title');
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
            anyOf: [
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
  });
  describe('hideError works with anyOf', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        userId: {
          anyOf: [
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
      anyOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }, { $ref: '#/definitions/Baz' }],
    };
    it('Selects the first node by default when there is no formData', () => {
      const { node } = createFormComponent({
        schema,
      });
      const select = node.querySelector('select#root__anyof_select');
      expect(select).toHaveValue('0');
    });
    it('Selects the 3rd node by default when there is formData that points to it', () => {
      const { node } = createFormComponent({
        schema,
        formData: { code: 'baz_coding' },
      });
      const select = node.querySelector('select#root__anyof_select');
      expect(select).toHaveValue('2');
    });
    it('warns when discriminator.propertyName is not a string', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
      const badSchema = { ...schema, discriminator: { propertyName: 5 } };
      const { node } = createFormComponent({
        schema: badSchema,
      });
      const select = node.querySelector('select#root__anyof_select');
      expect(select).toHaveValue('0');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Expecting discriminator to be a string, got "number" instead');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Custom Field without ui:fieldReplacesAnyOrOneOf', () => {
    const schema: RJSFSchema = {
      anyOf: [
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
      anyOf: [
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
    it('should preserve boolean values when switching between anyOf options with shared properties', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              anyOf: [
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
      const dropdown = node.querySelector('select[id="root_items_0__anyof_select"]');
      if (dropdown) {
        await user.selectOptions(dropdown, '1');

        // After switching, the boolean value should be preserved, not converted to {}
        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { items: [{ type: 'typeB', showField: true }] } }),
          'root_items_0__anyof_select',
        );
      }
    });

    it('should handle undefined boolean fields correctly when switching anyOf options', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              anyOf: [
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
      const dropdown = node.querySelector('select[id="root_items_0__anyof_select"]');
      if (dropdown) {
        await user.selectOptions(dropdown, '1');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { items: [{ type: 'typeB', showField: undefined }] } }),
          'root_items_0__anyof_select',
        );
      }
    });

    it('should handle boolean field values correctly in direct anyOf schemas', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        anyOf: [
          {
            title: 'Option A',
            properties: {
              type: { type: 'string', enum: ['optionA'], default: 'optionA' },
              enabled: { type: 'boolean' },
            },
          },
          {
            title: 'Option B',
            properties: {
              type: { type: 'string', enum: ['optionB'], default: 'optionB' },
              enabled: { type: 'boolean' },
            },
          },
        ],
      };

      const { node, onChange } = createFormComponent({
        schema,
        formData: { type: 'optionA', enabled: false },
        experimental_defaultFormStateBehavior: {
          mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
        },
      });

      // Switch to optionB
      const dropdown = node.querySelector('select[id="root__anyof_select"]');
      if (dropdown) {
        await user.selectOptions(dropdown, '1');

        expect(onChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ formData: { type: 'optionB', enabled: false } }),
          'root__anyof_select',
        );
      }
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
          anyOf: [
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
    const select = node.querySelector('#root_status__anyof_select');
    await user.selectOptions(select!, '1');

    expect(select).toHaveValue('1');
  });

  describe('primitive type with non-select anyOf', () => {
    const schema: RJSFSchema = {
      type: 'string',
      anyOf: [
        { title: 'Short', maxLength: 10 },
        { title: 'Long', minLength: 11 },
      ],
    };

    it('should not render a spurious XxxOf-prefixed input alongside the anyOf selector', () => {
      // Mirror of the oneOf regression: { type: 'string', anyOf: [...] } must not
      // render an outer StringField input with id="root_XxxOf".
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input#root_XxxOf')).not.toBeInTheDocument();
    });

    it('should render the option text input with the correct root id', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input#root')).toBeInTheDocument();
    });

    it('should produce a plain string formData value when typing into the option input', async () => {
      const { node, onChange } = createFormComponent({ schema });

      const input = node.querySelector<HTMLInputElement>('input#root');
      expect(input).toBeInTheDocument();

      await user.clear(input!);
      await user.type(input!, 'hello');

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: 'hello' }), expect.any(String));
    });
  });
});
