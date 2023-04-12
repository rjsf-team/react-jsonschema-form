import { expect } from 'chai';
import { Simulate } from 'react-dom/test-utils';
import sinon from 'sinon';

import { createFormComponent, createSandbox, setProps, getSelectedOptionValue } from './test_utils';
import SelectWidget from '../src/components/widgets/SelectWidget';

describe('anyOf', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should not render a select element if the anyOf keyword is not present', () => {
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

  it('should render a select element if the anyOf keyword is present', () => {
    const schema = {
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

    expect(node.querySelectorAll('select')).to.have.length.of(1);
    expect(node.querySelector('select').id).eql('root__anyof_select');
  });

  it('should render a root select element with default value', () => {
    const formData = { foo: 'b' };
    const schema = {
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
    expect(node.querySelector('select').value).eql('1');
  });

  it('should assign a default value and set defaults on option change', () => {
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
    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: 'defaultfoo' },
    });

    const $select = node.querySelector('select');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'defaultbar' },
      },
      'root__anyof_select'
    );
  });

  it('should assign a default value and set defaults on option change when using references', () => {
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
    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: 'defaultfoo' },
    });

    const $select = node.querySelector('select');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'defaultbar' },
      },
      'root__anyof_select'
    );
  });

  it("should assign a default value and set defaults on option change with 'type': 'object' missing", () => {
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

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: 'defaultfoo' },
    });

    const $select = node.querySelector('select');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'defaultbar' },
      },
      'root__anyof_select'
    );
  });

  it('should render a custom widget', () => {
    const schema = {
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

    expect(node.querySelectorAll('#root_foo')).to.have.length.of(1);
    expect(node.querySelectorAll('#root_bar')).to.have.length.of(0);

    const $select = node.querySelector('select');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect(node.querySelectorAll('#root_foo')).to.have.length.of(0);
    expect(node.querySelectorAll('#root_bar')).to.have.length.of(1);
  });

  it('should handle change events', () => {
    const schema = {
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

    Simulate.change(node.querySelector('input#root_foo'), {
      target: { value: 'Lorem ipsum dolor sit amet' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'Lorem ipsum dolor sit amet' },
      },
      'root_foo'
    );
  });

  it('should clear previous data when changing options', () => {
    const schema = {
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

    Simulate.change(node.querySelector('input#root_buzz'), {
      target: { value: 'Lorem ipsum dolor sit amet' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          buzz: 'Lorem ipsum dolor sit amet',
        },
      },
      'root_buzz'
    );

    Simulate.change(node.querySelector('input#root_foo'), {
      target: { value: 'Consectetur adipiscing elit' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          buzz: 'Lorem ipsum dolor sit amet',
          foo: 'Consectetur adipiscing elit',
        },
      },
      'root_foo'
    );

    const $select = node.querySelector('select');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
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

    Simulate.change(node.querySelector('input#root_userId'), {
      target: { value: 12345 },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { userId: 12345 },
      },
      'root_userId'
    );

    const $select = node.querySelector('select');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { userId: undefined },
      },
      'root_userId'
    );

    Simulate.change(node.querySelector('input#root_userId'), {
      target: { value: 'Lorem ipsum dolor sit amet' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { userId: 'Lorem ipsum dolor sit amet' },
      },
      'root_userId'
    );
  });

  it('should support custom fields', () => {
    const schema = {
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

    const CustomField = () => {
      return <div id='custom-anyof-field' />;
    };

    const { node } = createFormComponent({
      schema,
      fields: {
        AnyOfField: CustomField,
      },
    });

    expect(node.querySelectorAll('#custom-anyof-field')).to.have.length(1);
  });

  it('should support custom widget', () => {
    const schema = {
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

    function CustomSelectWidget(props) {
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
    expect(select.value).eql(select.options[1].value);

    Simulate.change(select, {
      target: { value: select.options[0].value },
    });

    expect(select.value).eql(select.options[0].value);

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { choice: undefined },
    });
  });

  it('should select the correct field when the form is rendered from existing data', () => {
    const schema = {
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

    expect(node.querySelector('select').value).eql('1');
  });

  it('should select the correct field when the formData property is updated', () => {
    const schema = {
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

    const { comp, node } = createFormComponent({
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

  it('should not change the selected option when entering values', () => {
    const schema = {
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

    expect($select.value).eql('0');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect($select.value).eql('1');

    Simulate.change(node.querySelector('input#root_idCode'), {
      target: { value: 'Lorem ipsum dolor sit amet' },
    });

    expect($select.value).eql('1');
  });

  it('should not change the selected option when entering values and the subschema uses `anyOf`', () => {
    const schema = {
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

    expect($select.value).eql('0');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect($select.value).eql('1');

    Simulate.change(node.querySelector('input#root_idCode'), {
      target: { value: 'Lorem ipsum dolor sit amet' },
    });

    expect($select.value).eql('1');
  });

  it('should not change the selected option when entering values and the subschema uses `allOf`', () => {
    const schema = {
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

    expect($select.value).eql('0');

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect($select.value).eql('1');

    Simulate.change(node.querySelector('input#root_idCode'), {
      target: { value: 'Lorem ipsum dolor sit amet' },
    });

    expect($select.value).eql('1');
  });

  it('should not mutate a schema that contains nested anyOf and allOf', () => {
    const schema = {
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

    expect(schema).to.eql({
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
    const schema = {
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

    let options = node.querySelectorAll('option');
    expect(options[0].firstChild.nodeValue).eql('Address');
    expect(options[1].firstChild.nodeValue).eql('Person');
  });

  it('should collect schema from $ref even when ref is within properties', () => {
    const schema = {
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

    let options = node.querySelectorAll('option');
    expect(options[0].firstChild.nodeValue).eql('Address');
    expect(options[1].firstChild.nodeValue).eql('Person');
  });

  it('should select anyOf in additionalProperties with anyOf', () => {
    const schema = {
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

    const $select = node.querySelector('select#root_testProperty_newKey__anyof_select');

    expect($select.value).eql('1');

    Simulate.change($select, {
      target: { value: $select.options[0].value },
    });

    expect($select.value).eql('0');

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: {
        testProperty: { newKey: { prop1: undefined, prop2: undefined } },
      },
    });
  });

  describe('Arrays', () => {
    it('should correctly render form inputs for anyOf inside array items', () => {
      const schema = {
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

      expect(node.querySelector('.array-item-add button')).not.eql(null);

      Simulate.click(node.querySelector('.array-item-add button'));

      expect(node.querySelectorAll('select')).to.have.length.of(1);

      expect(node.querySelectorAll('input#root_items_0_foo')).to.have.length.of(1);
    });

    it('should not change the selected option when switching order of items for anyOf inside array items', () => {
      const schema = {
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
      expect(selects[0].value).eql('0');
      expect(selects[1].value).eql('1');

      const moveUpBtns = node.querySelectorAll('.array-item-move-up');
      Simulate.click(moveUpBtns[1]);

      selects = node.querySelectorAll('select');
      expect(selects[0].value).eql('1');
      expect(selects[1].value).eql('0');
    });

    it('should correctly update inputs for anyOf inside array items after being moved down', () => {
      const schema = {
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

      const moveDownBtns = node.querySelectorAll('.array-item-move-down');
      Simulate.click(moveDownBtns[0]);

      const strInputs = node.querySelectorAll('fieldset .field-string input[type=text]');

      Simulate.change(strInputs[1], { target: { value: 'bar' } });
      expect(strInputs[1].value).eql('bar');
    });

    it('should correctly set the label of the options', () => {
      const schema = {
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

      expect($select.options[0].text).eql('Foo');
      expect($select.options[1].text).eql('Option 2');
      expect($select.options[2].text).eql('Baz');
    });

    it('should correctly set the label of the options, with schema title prefix', () => {
      const schema = {
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

      expect($select.options[0].text).eql('Foo');
      expect($select.options[1].text).eql('Root Title option 2');
      expect($select.options[2].text).eql('Baz');
    });

    it('should correctly set the label of the options, with uiSchema title prefix', () => {
      const schema = {
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

      expect($select.options[0].text).eql('Foo');
      expect($select.options[1].text).eql('My Title option 2');
      expect($select.options[2].text).eql('Baz');
    });

    it('should correctly render mixed types for anyOf inside array items', () => {
      const schema = {
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

      expect(node.querySelector('.array-item-add button')).not.eql(null);

      Simulate.click(node.querySelector('.array-item-add button'));

      const $select = node.querySelector('select');
      expect($select).not.eql(null);
      Simulate.change($select, {
        target: { value: $select.options[1].value },
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

      const rootId = node.querySelector('select#root_id');
      expect(getSelectedOptionValue(rootId)).eql('chain');
      const componentId = node.querySelector('select#root_components_0_id');
      expect(getSelectedOptionValue(componentId)).eql('map');

      const fnId = node.querySelector('select#root_components_0_fn_id');
      expect(getSelectedOptionValue(fnId)).eql('transform');

      const transformerId = node.querySelector('select#root_components_0_fn_transformer_id');
      expect(getSelectedOptionValue(transformerId)).eql('to_absolute');
    });
  });
  describe('hideError works with anyOf', () => {
    const schema = {
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
    function customValidate(formData, errors) {
      errors.userId.addError('test');
      return errors;
    }

    it('should show error on options with different types', () => {
      const { node } = createFormComponent({
        schema,
        customValidate,
      });

      Simulate.change(node.querySelector('input#root_userId'), {
        target: { value: 12345 },
      });
      Simulate.submit(node);

      let inputs = node.querySelectorAll('.form-group.field-error input[type=number]');
      expect(inputs[0].id).eql('root_userId');

      const $select = node.querySelector('select');

      Simulate.change($select, {
        target: { value: $select.options[1].value },
      });

      Simulate.change(node.querySelector('input#root_userId'), {
        target: { value: 'Lorem ipsum dolor sit amet' },
      });
      Simulate.submit(node);

      inputs = node.querySelectorAll('.form-group.field-error input[type=text]');
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

      Simulate.change(node.querySelector('input#root_userId'), {
        target: { value: 12345 },
      });
      Simulate.submit(node);

      let inputs = node.querySelectorAll('.form-group.field-error input[type=number]');
      expect(inputs).to.have.length.of(0);

      const $select = node.querySelector('select');

      Simulate.change($select, {
        target: { value: $select.options[1].value },
      });

      Simulate.change(node.querySelector('input#root_userId'), {
        target: { value: 'Lorem ipsum dolor sit amet' },
      });
      Simulate.submit(node);

      inputs = node.querySelectorAll('.form-group.field-error input[type=text]');
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
      anyOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }, { $ref: '#/definitions/Baz' }],
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
      const select = node.querySelector('select#root__anyof_select');
      expect(select.value).eql('0');
    });
    it('Selects the 3rd node by default when there is formData that points to it', () => {
      const { node } = createFormComponent({
        schema,
        formData: { code: 'baz_coding' },
      });
      const select = node.querySelector('select#root__anyof_select');
      expect(select.value).eql('2');
    });
    it('warns when discriminator.propertyName is not a string', () => {
      const badSchema = { ...schema, discriminator: { propertyName: 5 } };
      const { node } = createFormComponent({
        schema: badSchema,
      });
      const select = node.querySelector('select#root__anyof_select');
      expect(select.value).eql('0');
      expect(console.warn.calledWithMatch(/Expecting discriminator to be a string, got "number" instead/)).to.be.true;
    });
  });

  describe('Custom Field without ui:fieldReplacesAnyOrOneOf', function () {
    const schema = {
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
