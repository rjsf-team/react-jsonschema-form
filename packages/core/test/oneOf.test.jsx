import * as React from 'react';
import { expect } from 'chai';
import { fireEvent, act } from '@testing-library/react';
import sinon from 'sinon';

import { createFormComponent, createSandbox, getSelectedOptionValue, setProps } from './test_utils';
import SchemaField from '../src/components/fields/SchemaField';
import SelectWidget from '../src/components/widgets/SelectWidget';

describe('oneOf', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should not render a select element if the oneOf keyword is not present', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll('select')).to.have.length.of(0);
  });

  it('should render a select element if the oneOf keyword is present, merges top level required', () => {
    const schema = {
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

    expect(node.querySelectorAll('select')).to.have.length.of(1);
    expect(node.querySelector('select').id).eql('root__oneof_select');
    expect(node.querySelectorAll('span.required')).to.have.length.of(1);
    expect(node.querySelectorAll('#root__description')).to.have.length.of(1);
    expect(node.querySelectorAll('#root_baz')).to.have.length.of(1);
  });

  it('should render a select element if the oneOf keyword is present, merges top level and oneOf required', () => {
    const schema = {
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

    expect(node.querySelectorAll('select')).to.have.length.of(1);
    expect(node.querySelector('select').id).eql('root__oneof_select');
    expect(node.querySelectorAll('span.required')).to.have.length.of(2);
  });

  it('should assign a default value and set defaults on option change', () => {
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

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: 'defaultfoo' },
    });

    const $select = node.querySelector('select');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'defaultbar' },
      },
      'root__oneof_select',
    );
  });

  it('should assign a default value and set defaults on option change when using refs', () => {
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

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: 'defaultfoo' },
    });

    const $select = node.querySelector('select');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'defaultbar' },
      },
      'root__oneof_select',
    );
  });

  it("should assign a default value and set defaults on option change with 'type': 'object' missing", () => {
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

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: 'defaultfoo' },
    });

    const $select = node.querySelector('select');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'defaultbar' },
      },
      'root__oneof_select',
    );
  });

  it('should assign a default value and set defaults on option change for scalar types schemas', () => {
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
    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: 'defaultfoo' },
    });

    const $select = node.querySelector('select');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: true },
    });
  });

  it('should render a custom widget', () => {
    const schema = {
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
      SelectWidget: () => {
        return <section id='CustomSelect'>Custom Widget</section>;
      },
    };

    const { node } = createFormComponent({
      schema,
      widgets,
    });

    expect(node.querySelector('#CustomSelect')).to.exist;
  });

  it('should change the rendered form when the select value is changed', () => {
    const schema = {
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

    expect(node.querySelectorAll('#root_foo')).to.have.length.of(1);
    expect(node.querySelectorAll('#root_bar')).to.have.length.of(0);

    const $select = node.querySelector('select');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    expect(node.querySelectorAll('#root_foo')).to.have.length.of(0);
    expect(node.querySelectorAll('#root_bar')).to.have.length.of(1);
  });

  it('should handle change events', () => {
    const schema = {
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

    act(() => {
      fireEvent.change(node.querySelector('input#root_foo'), {
        target: { value: 'Lorem ipsum dolor sit amet' },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'Lorem ipsum dolor sit amet' },
      },
      'root_foo',
    );
  });

  it('should clear previous data when changing options', () => {
    const schema = {
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

    act(() => {
      fireEvent.change(node.querySelector('input#root_buzz'), {
        target: { value: 'Lorem ipsum dolor sit amet' },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          buzz: 'Lorem ipsum dolor sit amet',
        },
      },
      'root_buzz',
    );

    act(() => {
      fireEvent.change(node.querySelector('input#root_foo'), {
        target: { value: 'Consectetur adipiscing elit' },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          buzz: 'Lorem ipsum dolor sit amet',
          foo: 'Consectetur adipiscing elit',
        },
      },
      'root_foo',
    );

    const $select = node.querySelector('select');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: {
        buzz: 'Lorem ipsum dolor sit amet',
        foo: undefined,
      },
    });
  });

  it('should support options with different types', () => {
    const schema = {
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

    act(() => {
      fireEvent.change(node.querySelector('input#root_userId'), {
        target: { value: 12345 },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          userId: 12345,
        },
      },
      'root_userId',
    );

    const $select = node.querySelector('select');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          userId: undefined,
        },
      },
      'root_userId',
    );

    act(() => {
      fireEvent.change(node.querySelector('input#root_userId'), {
        target: { value: 'Lorem ipsum dolor sit amet' },
      });
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          userId: 'Lorem ipsum dolor sit amet',
        },
      },
      'root_userId',
    );
  });

  it('should support custom fields', () => {
    const schema = {
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

    const CustomField = () => {
      return <div id='custom-oneof-field' />;
    };

    const { node } = createFormComponent({
      schema,
      fields: {
        OneOfField: CustomField,
      },
    });

    expect(node.querySelectorAll('#custom-oneof-field')).to.have.length(1);
  });

  it('should support custom widget', () => {
    const schema = {
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

    function CustomSelectWidget(props) {
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
    expect(select.value).eql(select.options[1].value);

    act(() => {
      fireEvent.change(select, {
        target: { value: select.options[0].value },
      });
    });

    expect(select.value).eql(select.options[0].value);

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { choice: undefined },
    });
  });

  it('should pass form context to schema field', () => {
    const schema = {
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
    const formContext = { root: 'root-id', root_userId: 'userId-id' };

    function CustomSchemaField(props) {
      const { formContext, idSchema } = props;
      return (
        <>
          <code id={formContext[idSchema.$id]}>Ha</code>
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
    expect(codeBlocks).to.have.length(3);
    Object.keys(formContext).forEach((key) => {
      expect(node.querySelector(`code#${formContext[key]}`)).to.exist;
    });
  });

  it('should select the correct field when the form is rendered from existing data', () => {
    const schema = {
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

    expect(node.querySelector('select').value).eql('1');
  });

  it('should select the correct field when the formData property is updated', () => {
    const schema = {
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

    const { comp, node } = createFormComponent({
      ref: React.createRef(),
      schema,
    });

    expect(node.querySelector('select').value).eql('0');

    setProps(comp, {
      schema,
      formData: {
        userId: 'foobarbaz',
      },
    });

    expect(node.querySelector('select').value).eql('1');
  });

  it('should not change the selected option when entering values on a subschema with multiple required options', () => {
    const schema = {
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

    expect($select.value).eql('0');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    expect($select.value).eql('1');

    act(() => {
      fireEvent.change(node.querySelector('input#root_items_bar'), {
        target: { value: 'Lorem ipsum dolor sit amet' },
      });
    });

    expect($select.value).eql('1');
  });

  it("should empty the form data when switching from an option of type 'object'", () => {
    const schema = {
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

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    expect($select.value).eql('1');

    expect(node.querySelector('input#root').value).eql('');
  });

  it('should use only the selected option when generating default values', () => {
    const schema = {
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

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    expect($select.value).eql('1');

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { ipsum: {}, lorem: undefined },
      },
      'root__oneof_select',
    );
  });

  it('should select oneOf in additionalProperties with oneOf', () => {
    const schema = {
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

    const $select = node.querySelector('select#root_testProperty_newKey__oneof_select');

    expect($select.value).eql('1');

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[0].value },
      });
    });

    expect($select.value).eql('0');

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: {
        testProperty: { newKey: { prop1: undefined, prop2: undefined } },
      },
    });
  });

  it('should select oneOf dropdown be disabled when the schema is readOnly', () => {
    const schema = {
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

    const $select = node.querySelector('select#root_contactPreference__oneof_select');

    expect($select.value).eql('0');
    expect($select).to.have.property('disabled', true);

    act(() => {
      fireEvent.change($select, {
        target: { value: $select.options[1].value },
      });
    });

    expect($select.value).eql('0');
  });

  describe('Arrays', () => {
    it('should correctly render mixed types for oneOf inside array items', () => {
      const schema = {
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

      expect(node.querySelector('.rjsf-array-item-add button')).not.eql(null);

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

      const $select = node.querySelector('select');
      expect($select).not.eql(null);
      act(() => {
        fireEvent.change($select, {
          target: { value: $select.options[1].value },
        });
      });

      expect(node.querySelectorAll('input#root_items_0_foo')).to.have.length.of(1);
      expect(node.querySelectorAll('input#root_items_0_bar')).to.have.length.of(1);
    });

    it('should not change the selected option when switching order of items for oneOf inside array items', () => {
      const schema = {
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
      expect(selects[0].value).eql('0');
      expect(selects[1].value).eql('1');

      const moveUpBtns = node.querySelectorAll('.rjsf-array-item-move-up');
      fireEvent.click(moveUpBtns[1]);

      selects = node.querySelectorAll('select');
      expect(selects[0].value).eql('1');
      expect(selects[1].value).eql('0');
    });

    it('should correctly update inputs for oneOf inside array items after being moved down', () => {
      const schema = {
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
      fireEvent.click(moveDownBtns[0]);

      const strInputs = node.querySelectorAll('fieldset .rjsf-field-string input[type=text]');

      act(() => {
        fireEvent.change(strInputs[1], { target: { value: 'bar' } });
      });

      expect(strInputs[1].value).eql('bar');
    });

    it('should infer the value of an array with nested oneOfs properly', () => {
      // From https://github.com/rjsf-team/react-jsonschema-form/issues/2944
      const schema = {
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
      expect(outerOneOf.value).eql('1');
      const innerOneOf = node.querySelector('select#root_0_ipsum__oneof_select');
      expect(innerOneOf.value).eql('1');
    });
  });

  describe('definitions', () => {
    beforeEach(() => {
      sandbox = createSandbox();
      sandbox.stub(console, 'warn');
    });
    afterEach(() => {
      sandbox.restore();
    });

    it('should handle the $ref keyword correctly', () => {
      const schema = {
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

      expect(node.querySelector('.rjsf-array-item-add button')).not.eql(null);

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

      const $select = node.querySelector('select');
      expect($select).not.eql(null);
      act(() => {
        fireEvent.change($select, {
          target: { value: $select.options[1].value },
        });
      });

      // This works because the nested "add" button will now be the first to
      // appear in the dom
      act(() => {
        fireEvent.click(node.querySelector('.rjsf-array-item-add button'));
      });

      expect($select.value).to.eql($select.options[1].value);
    });

    it('should correctly set the label of the options', () => {
      const schema = {
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

      expect($select.options[0].text).eql('Foo');
      expect($select.options[1].text).eql('Option 2');
      expect($select.options[2].text).eql('Baz');
    });

    it('should correctly set the label of the options, with schema title prefix', () => {
      const schema = {
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

      expect($select.options[0].text).eql('Foo');
      expect($select.options[1].text).eql('Root Title option 2');
      expect($select.options[2].text).eql('Baz');
    });

    it('should correctly set the label of the options, with uiSchema title prefix', () => {
      const schema = {
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

      expect($select.options[0].text).eql('Foo');
      expect($select.options[1].text).eql('My Title option 2');
      expect($select.options[2].text).eql('Baz');
    });

    it('should correctly set the label of the options, with uiSchema-based titles, for each oneOf option', () => {
      const schema = {
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

      expect($select.options[0].text).eql('Custom foo');
      expect($select.options[1].text).eql('Custom bar');
      expect($select.options[2].text).eql('Custom baz');

      // Also verify the uiSchema was passed down to the underlying widget by confirming the lable (in the legend)
      // matches the selected option's title
      expect($select.value).eql('0');
      const inputLabel = node.querySelector('legend#root__title');
      expect(inputLabel.innerHTML).eql($select.options[$select.value].text);
    });

    it('should warn when the oneOf in the uiSchema is not an array, and pass the base uiSchema down', () => {
      const schema = {
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

      expect(console.warn.calledWithMatch(/uiSchema.oneOf is not an array for "My Title"/)).to.be.true;

      const $select = node.querySelector('select');

      // Also verify the base uiSchema was passed down to the underlying widget by confirming the label (in the legend)
      // matches the selected option's title
      expect($select.value).eql('0');
      const inputLabel = node.querySelector('legend#root__title');
      expect(inputLabel.innerHTML).eql('My Title');
    });

    it('should correctly render mixed types for oneOf inside array items', () => {
      const schema = {
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

      expect(node.querySelector('.rjsf-array-item-add button')).not.eql(null);

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

      const $select = node.querySelector('select');
      expect($select).not.eql(null);

      act(() => {
        fireEvent.change($select, {
          target: { value: $select.options[1].value },
        });
      });

      expect(node.querySelectorAll('input#root_items_0_foo')).to.have.length.of(1);
      expect(node.querySelectorAll('input#root_items_0_bar')).to.have.length.of(1);
    });

    it('should correctly infer the selected option based on value', () => {
      const schema = {
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

      const rootId = node.querySelector('select#root_id');
      expect(getSelectedOptionValue(rootId)).eql('chain');
      const componentId = node.querySelector('select#root_components_0_id');
      expect(getSelectedOptionValue(componentId)).eql('map');

      const fnId = node.querySelector('select#root_components_0_fn_id');
      expect(getSelectedOptionValue(fnId)).eql('transform');

      const transformerId = node.querySelector('select#root_components_0_fn_transformer_id');
      expect(getSelectedOptionValue(transformerId)).eql('to_absolute');
    });

    it('should update formData to remove unnecessary data when oneOf option changes', () => {
      const schema = {
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
      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: { craftTypes: [{ daysOfYear: [undefined] }] },
      });

      const select = node.querySelector('select#root_craftTypes_0__oneof_select');

      act(() => {
        fireEvent.change(select, {
          target: { value: select.options[1].value },
        });
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: {
          craftTypes: [{ keywords: [undefined], title: undefined, daysOfYear: undefined }],
        },
      });
    });
  });

  describe('hideError works with oneOf', () => {
    const schema = {
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

    function customValidate(formData, errors) {
      errors.userId.addError('test');
      return errors;
    }

    it('should show error on options with different types', () => {
      const { node } = createFormComponent({
        schema,
        customValidate,
      });

      act(() => {
        fireEvent.change(node.querySelector('input#root_userId'), {
          target: { value: 12345 },
        });
      });
      fireEvent.submit(node);

      let inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=number]');
      expect(inputs[0].id).eql('root_userId');

      const $select = node.querySelector('select');

      act(() => {
        fireEvent.change($select, {
          target: { value: $select.options[1].value },
        });
      });

      act(() => {
        fireEvent.change(node.querySelector('input#root_userId'), {
          target: { value: 'Lorem ipsum dolor sit amet' },
        });
      });
      fireEvent.submit(node);

      inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=text]');
      expect(inputs[0].id).eql('root_userId');
    });
    it('should NOT show error on options with different types when hideError: true', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          'ui:hideError': true,
        },
        customValidate,
      });

      act(() => {
        fireEvent.change(node.querySelector('input#root_userId'), {
          target: { value: 12345 },
        });
      });
      fireEvent.submit(node);

      let inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=number]');
      expect(inputs).to.have.length.of(0);

      const $select = node.querySelector('select');

      act(() => {
        fireEvent.change($select, {
          target: { value: $select.options[1].value },
        });
      });

      act(() => {
        fireEvent.change(node.querySelector('input#root_userId'), {
          target: { value: 'Lorem ipsum dolor sit amet' },
        });
      });
      fireEvent.submit(node);

      inputs = node.querySelectorAll('.form-group.rjsf-field-error input[type=text]');
      expect(inputs).to.have.length.of(0);
    });
  });

  describe('OpenAPI discriminator support', () => {
    const schema = {
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
    beforeEach(() => {
      sandbox = createSandbox();
      sandbox.stub(console, 'warn');
    });
    afterEach(() => {
      sandbox.restore();
    });
    it('Selects the first node by default when there is no formData', () => {
      const { node } = createFormComponent({
        schema,
      });
      const select = node.querySelector('select#root__oneof_select');
      expect(select.value).eql('0');
    });
    it('Selects the 3rd node by default when there is formData that points to it', () => {
      const { node } = createFormComponent({
        schema,
        formData: { code: 'baz_coding' },
      });
      const select = node.querySelector('select#root__oneof_select');
      expect(select.value).eql('2');
    });
    it('warns when discriminator.propertyName is not a string', () => {
      const badSchema = { ...schema, discriminator: { propertyName: 5 } };
      const { node } = createFormComponent({
        schema: badSchema,
      });
      const select = node.querySelector('select#root__oneof_select');
      expect(select.value).eql('0');
      expect(console.warn.calledWithMatch(/Expecting discriminator to be a string, got "number" instead/)).to.be.true;
    });
  });
  describe('Custom Field without ui:fieldReplacesAnyOrOneOf', function () {
    const schema = {
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
    it('should be rendered twice', function () {
      const { node } = createFormComponent({ schema, uiSchema });
      const fields = node.querySelectorAll('.custom-field');
      expect(fields).to.have.length.of(2);
    });
    it('should render <select>', function () {
      const { node } = createFormComponent({ schema, uiSchema });
      const selects = node.querySelectorAll('select');
      expect(selects).to.have.length.of(1);
    });
  });

  describe('Custom Field with ui:fieldReplacesAnyOrOneOf', function () {
    const schema = {
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
    it('should be rendered once', function () {
      const { node } = createFormComponent({ schema, uiSchema });
      const fields = node.querySelectorAll('.custom-field');
      expect(fields).to.have.length.of(1);
    });
    it('should not render <select>', function () {
      const { node } = createFormComponent({ schema, uiSchema });
      const selects = node.querySelectorAll('select');
      expect(selects).to.have.length.of(0);
    });
  });
});
