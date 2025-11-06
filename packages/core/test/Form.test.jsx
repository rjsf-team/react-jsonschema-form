import { Component, createRef, useEffect, useState } from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { fireEvent, act, render, waitFor } from '@testing-library/react';
import { Simulate } from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';
import { Portal } from 'react-portal';
import {
  getTemplate,
  getUiOptions,
  optionalControlsId,
  buttonId,
  bracketNameGenerator,
  dotNotationNameGenerator,
} from '@rjsf/utils';
import validator, { customizeValidator } from '@rjsf/validator-ajv8';

import Form from '../src';
import {
  createComponent,
  createFormComponent,
  createSandbox,
  setProps,
  describeRepeated,
  submitForm,
} from './test_utils';
import widgetsSchema from './widgets_schema.json';

describeRepeated('Form common', (createFormComponent) => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('Empty schema', () => {
    it('Should throw error when Form is missing validator', () => {
      expect(() => createFormComponent({ ref: createRef(), schema: {}, validator: undefined })).to.Throw(
        Error,
        'A validator is required for Form functionality to work',
      );
    });

    it('should render a form tag', () => {
      const { node } = createFormComponent({ ref: createRef(), schema: {} });

      expect(node.tagName).eql('FORM');
    });

    it('should render a submit button', () => {
      const { node } = createFormComponent({ ref: createRef(), schema: {} });

      expect(node.querySelectorAll('button[type=submit]')).to.have.length.of(1);
    });

    it('should render children buttons', () => {
      const props = { ref: createRef(), schema: {}, validator };
      const comp = (
        <Form {...props}>
          <button type='submit'>Submit</button>
          <button type='submit'>Another submit</button>
        </Form>
      );

      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;
      expect(node.querySelectorAll('button[type=submit]')).to.have.length.of(2);
    });

    it("should render errors if schema isn't object", () => {
      const props = {
        ref: createRef(),
        validator,
        schema: {
          type: 'object',
          title: 'object',
          properties: {
            firstName: 'some mame',
            address: {
              $ref: '#/definitions/address',
            },
          },
          definitions: {
            address: {
              street: 'some street',
            },
          },
        },
      };
      const comp = (
        <Form {...props}>
          <button type='submit'>Submit</button>
        </Form>
      );
      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;
      expect(node.querySelector('.unsupported-field').textContent).to.contain('Unknown field type undefined');
    });

    it('will render fallback ui when useFallbackUiForUnsupportedType is true', () => {
      const schema = {
        type: 'object',
        title: 'object',
        properties: {
          unknownProperty: {
            type: 'someUnsupportedType',
          },
        },
      };
      const props = {
        useFallbackUiForUnsupportedType: true,
        schema,
        formData: {
          unknownProperty: '123456',
        },
      };

      const { node, onChange } = createFormComponent({ ...props });

      expect(node.querySelectorAll('.unsupported-field')).to.have.length.of(0);
      expect(node.querySelector('select')).to.exist;
      let optionValue = node.querySelector('select').value;
      let optionText = node.querySelector(`select option[value="${optionValue}"]`).textContent;
      expect(optionText).to.equal('string');
      expect(node.querySelector('input[type=text]').value).to.equal('123456');

      // Change the fallback type to 'number'
      fireEvent.change(node.querySelector('select'), { target: { value: 1 } });
      optionValue = node.querySelector('select').value;
      optionText = node.querySelector(`select option[value="${optionValue}"]`).textContent;
      expect(optionText).to.equal('number');
      expect(node.querySelector('input[type=number]')).to.exist;
      expect(node.querySelector('input[type=number]').value).to.equal('123456');

      // Verify formData was casted to number
      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            unknownProperty: 123456,
          },
          schema,
        },
        'root_unknownProperty',
      );

      // Change the fallback type to 'boolean'
      fireEvent.change(node.querySelector('select'), { target: { value: 2 } });
      optionValue = node.querySelector('select').value;
      optionText = node.querySelector(`select option[value="${optionValue}"]`).textContent;
      expect(optionText).to.equal('boolean');
      expect(node.querySelector('input[type=checkbox]')).to.exist;
      expect(node.querySelector('input[type=checkbox]').checked).to.equal(true);
      // Verify formData was casted to number
      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            unknownProperty: true,
          },
          schema,
        },
        'root_unknownProperty',
      );

      // Change the fallback type to 'object'
      fireEvent.change(node.querySelector('select'), { target: { value: 3 } });
      optionValue = node.querySelector('select').value;
      optionText = node.querySelector(`select option[value="${optionValue}"]`).textContent;
      expect(optionText).to.equal('object');
      let addButton = node.querySelector('.rjsf-object-property-expand button');
      expect(addButton).to.exist;
      // click the add button
      act(() => addButton.click());

      // Verify formData was casted to number
      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            unknownProperty: { newKey: 'New Value' },
          },
          schema,
        },
        'root_unknownProperty',
      );

      // Change the fallback type to 'array'
      fireEvent.change(node.querySelector('select'), { target: { value: 4 } });
      optionValue = node.querySelector('select').value;
      optionText = node.querySelector(`select option[value="${optionValue}"]`).textContent;
      expect(optionText).to.equal('array');
      addButton = node.querySelector('.rjsf-array-item-add button');
      expect(addButton).to.exist;
      // click the add button
      act(() => addButton.click());

      // Verify formData was casted to number
      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            unknownProperty: [undefined],
          },
          schema,
        },
        'root_unknownProperty',
      );
    });
  });

  describe('on component creation', () => {
    let onChangeProp;
    let formData;
    let schema;

    function createComponent() {
      const comp = (
        <Form schema={schema} onChange={onChangeProp} formData={formData} validator={validator}>
          <button type='submit'>Submit</button>
          <button type='submit'>Another submit</button>
        </Form>
      );
      render(comp);
    }

    beforeEach(() => {
      onChangeProp = sinon.spy();
      schema = {
        type: 'object',
        title: 'root object',
        required: ['count'],
        properties: {
          count: {
            type: 'number',
            default: 789,
          },
        },
      };
    });

    describe('when props.formData does not equal the default values', () => {
      beforeEach(() => {
        formData = {
          foo: 123,
        };
        createComponent();
      });

      it('should call props.onChange with current state', () => {
        sinon.assert.calledOnce(onChangeProp);
        sinon.assert.calledWith(onChangeProp, {
          formData: { ...formData, count: 789 },
          schema,
          errorSchema: {},
          errors: [],
          edit: true,
          uiSchema: {},
          fieldPathId: { $id: 'root', path: [] },
          schemaUtils: sinon.match.object,
        });
      });
    });

    describe('when props.formData equals the default values', () => {
      beforeEach(() => {
        formData = {
          count: 789,
        };
        createComponent();
      });

      it('should not call props.onChange', () => {
        sinon.assert.notCalled(onChangeProp);
      });
    });
  });

  describe('Option idPrefix', function () {
    it('should change the rendered ids', function () {
      const schema = {
        type: 'object',
        title: 'root object',
        required: ['foo'],
        properties: {
          count: {
            type: 'number',
          },
        },
      };
      const comp = <Form schema={schema} idPrefix='rjsf' validator={validator} />;
      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;
      const inputs = node.querySelectorAll('input');
      const ids = [];
      for (var i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).to.eql(['rjsf_count']);
      expect(node.querySelector('fieldset').id).to.eql('rjsf');
    });
  });

  describe('Changing idPrefix', function () {
    it('should work with simple example', function () {
      const schema = {
        type: 'object',
        title: 'root object',
        required: ['foo'],
        properties: {
          count: {
            type: 'number',
          },
        },
      };
      const comp = <Form schema={schema} idPrefix='rjsf' validator={validator} />;
      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;
      const inputs = node.querySelectorAll('input');
      const ids = [];
      for (var i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).to.eql(['rjsf_count']);
      expect(node.querySelector('fieldset').id).to.eql('rjsf');
    });

    it('should work with oneOf', function () {
      const schema = {
        type: 'object',
        properties: {
          connector: {
            type: 'string',
            enum: ['aws', 'gcp'],
            title: 'Provider',
            default: 'aws',
          },
        },
        dependencies: {
          connector: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  connector: {
                    type: 'string',
                    enum: ['aws'],
                  },
                  key_aws: {
                    type: 'string',
                  },
                },
              },
              {
                type: 'object',
                properties: {
                  connector: {
                    type: 'string',
                    enum: ['gcp'],
                  },
                  key_gcp: {
                    type: 'string',
                  },
                },
              },
            ],
          },
        },
      };

      const comp = <Form schema={schema} idPrefix='rjsf' validator={validator} />;
      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;
      const inputs = node.querySelectorAll('input');
      const ids = [];
      for (var i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).to.eql(['rjsf_key_aws']);
    });
  });

  describe('Option idSeparator', function () {
    it('should change the rendered ids', function () {
      const schema = {
        type: 'object',
        title: 'root object',
        required: ['foo'],
        properties: {
          count: {
            type: 'number',
          },
        },
      };
      const comp = <Form schema={schema} idSeparator='.' validator={validator} />;
      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;
      const inputs = node.querySelectorAll('input');
      const ids = [];
      for (var i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute('id'));
      }
      expect(ids).to.eql(['root.count']);
    });
  });

  describe('Custom field template', () => {
    const schema = {
      type: 'object',
      title: 'root object',
      required: ['foo'],
      properties: {
        foo: {
          type: 'string',
          description: 'this is description',
          minLength: 32,
        },
      },
    };

    const uiSchema = {
      foo: {
        'ui:help': 'this is help',
      },
    };

    const formData = { foo: 'invalid' };

    function CustomFieldTemplate(props) {
      const {
        id,
        classNames,
        label,
        help,
        rawHelp,
        required,
        description,
        rawDescription,
        errors,
        rawErrors,
        children,
      } = props;
      return (
        <div className={'my-template ' + classNames}>
          <label htmlFor={id}>
            {label}
            {required ? '*' : null}
          </label>
          {description}
          {children}
          {errors}
          {help}
          <span className='raw-help'>{`${rawHelp} rendered from the raw format`}</span>
          <span className='raw-description'>{`${rawDescription} rendered from the raw format`}</span>
          {rawErrors ? (
            <ul>
              {rawErrors.map((error, i) => (
                <li key={i} className='raw-error'>
                  {error}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    let node;

    beforeEach(() => {
      node = createFormComponent({
        schema,
        uiSchema,
        formData,
        templates: {
          FieldTemplate: CustomFieldTemplate,
        },
        liveValidate: true,
      }).node;
    });

    it('should use the provided field template', () => {
      expect(node.querySelector('.my-template')).to.exist;
    });

    it('should use the provided template for labels', () => {
      expect(node.querySelector('.my-template > label').textContent).eql('root object');
      expect(node.querySelector('.my-template .rjsf-field-string > label').textContent).eql('foo*');
    });

    it('should pass description as the provided React element', () => {
      expect(node.querySelector('#root_foo__description').textContent).eql('this is description');
    });

    it('should pass rawDescription as a string', () => {
      expect(node.querySelector('.raw-description').textContent).eql(
        'this is description rendered from the raw format',
      );
    });

    it('should pass errors as the provided React component', () => {
      // live validate does not run on initial render anymore
      expect(node.querySelectorAll('.error-detail li')).to.have.length.of(0);
      act(() => {
        fireEvent.change(node.querySelector('input'), {
          target: { value: 'stillinvalid' },
        });
      });
      expect(node.querySelectorAll('.error-detail li')).to.have.length.of(1);
    });

    it('should pass rawErrors as an array of strings', () => {
      // live validate does not run on initial render anymore
      expect(node.querySelectorAll('.raw-error')).to.have.length.of(0);
      act(() => {
        fireEvent.change(node.querySelector('input'), {
          target: { value: 'stillinvalid' },
        });
      });
      expect(node.querySelectorAll('.raw-error')).to.have.length.of(1);
    });

    it('should pass help as a the provided React element', () => {
      expect(node.querySelector('.help-block').textContent).eql('this is help');
    });

    it('should pass rawHelp as a string', () => {
      expect(node.querySelector('.raw-help').textContent).eql('this is help rendered from the raw format');
    });
  });

  describe('ui options submitButtonOptions', () => {
    it('should not render a submit button', () => {
      const props = {
        validator,
        schema: {},
        uiSchema: { 'ui:submitButtonOptions': { norender: true } },
      };
      const comp = <Form {...props} />;
      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;

      expect(node.querySelectorAll('button[type=submit]')).to.have.length.of(0);
    });

    it('should render a submit button with text Confirm', () => {
      const props = {
        validator,
        schema: {},
        uiSchema: { 'ui:submitButtonOptions': { submitText: 'Confirm' } },
      };
      const comp = <Form {...props} />;
      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;

      expect(node.querySelector('button[type=submit]').textContent).eql('Confirm');
    });
  });

  describe('Custom submit buttons', () => {
    // Submit events on buttons are not fired on disconnected forms
    // So we need to add the DOM tree to the body in this case.
    // See: https://github.com/jsdom/jsdom/pull/1865
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected
    const domNode = document.createElement('div');
    beforeEach(() => {
      document.body.appendChild(domNode);
    });
    afterEach(() => {
      document.body.removeChild(domNode);
    });
    it('should submit the form when clicked', (done) => {
      let submitCount = 0;
      const onSubmit = () => {
        submitCount++;
        if (submitCount === 2) {
          done();
        }
      };

      const comp = (
        <Form onSubmit={onSubmit} schema={{}} validator={validator}>
          <button type='submit' value='Submit button' />
          <button type='submit' value='Another submit button' />
        </Form>
      );
      const { container } = render(comp);
      const node = findDOMNode(container).firstElementChild;
      const buttons = node.querySelectorAll('button[type=submit]');
      act(() => buttons[0].click());
      act(() => buttons[1].click());
    });
  });

  describe('Schema definitions', () => {
    it('should use a single schema definition reference', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string' },
        },
        $ref: '#/definitions/testdef',
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).to.have.length.of(1);
    });

    it('should handle multiple schema definition references', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' },
          bar: { $ref: '#/definitions/testdef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).to.have.length.of(2);
    });

    it('should handle deeply referenced schema definitions', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              bar: { $ref: '#/definitions/testdef' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).to.have.length.of(1);
    });

    it('should handle references to deep schema definitions', () => {
      const schema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef/properties/bar' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).to.have.length.of(1);
    });

    it('should handle referenced definitions for array items', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: { $ref: '#/definitions/testdef' },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          foo: ['blah'],
        },
      });

      expect(node.querySelectorAll('input[type=text]')).to.have.length.of(1);
    });

    it('should not crash with null values for property with additionalProperties', () => {
      const schema = {
        type: 'object',
        properties: {
          data: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          data: null,
        },
      });

      expect(node).to.not.be.null;
    });

    it('should not crash with non-object values for property with additionalProperties', () => {
      const schema = {
        type: 'object',
        properties: {
          data1: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
          data2: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          data1: 123,
          data2: ['one', 'two', 'three'],
        },
      });

      expect(node).to.not.be.null;
    });

    it('should raise for non-existent definitions referenced', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/nonexistent' },
        },
      };

      expect(() => createFormComponent({ schema })).to.Throw(Error, /#\/definitions\/nonexistent/);
    });

    it('should propagate referenced definition defaults', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        $ref: '#/definitions/testdef',
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input[type=text]').value).eql('hello');
    });

    it('should propagate nested referenced definition defaults', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input[type=text]').value).eql('hello');
    });

    it('should propagate referenced definition defaults for array items', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        type: 'array',
        items: {
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

      expect(node.querySelector('input[type=text]').value).eql('hello');
    });

    it('should propagate referenced definition defaults in objects with additionalProperties', () => {
      const schema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        additionalProperties: {
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.btn-add'));

      expect(node.querySelector('input[type=text]').value).eql('newKey');
    });

    it('should propagate referenced definition defaults in objects with additionalProperties that have a type present', () => {
      // Though `additionalProperties` has a `type` present here, it also has a `$ref` so that
      // referenced schema should override it.
      const schema = {
        definitions: {
          testdef: { type: 'number' },
        },
        type: 'object',
        additionalProperties: {
          type: 'string',
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.btn-add'));

      expect(node.querySelector('input[type=number]').value).eql('0');
    });

    it('should recursively handle referenced definitions', () => {
      const schema = {
        $ref: '#/definitions/node',
        definitions: {
          node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector('#root_children_0_name')).to.not.exist;

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

      expect(node.querySelector('#root_children_0_name')).to.exist;
    });

    it('should follow recursive references', () => {
      const schema = {
        definitions: {
          bar: { $ref: '#/definitions/qux' },
          qux: { type: 'string' },
        },
        type: 'object',
        required: ['foo'],
        properties: {
          foo: { $ref: '#/definitions/bar' },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).to.have.length.of(1);
    });

    it('should follow multiple recursive references', () => {
      const schema = {
        definitions: {
          bar: { $ref: '#/definitions/bar2' },
          bar2: { $ref: '#/definitions/qux' },
          qux: { type: 'string' },
        },
        type: 'object',
        required: ['foo'],
        properties: {
          foo: { $ref: '#/definitions/bar' },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).to.have.length.of(1);
    });

    it('should priorize definition over schema type property', () => {
      // Refs bug #140
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          childObj: {
            type: 'object',
            $ref: '#/definitions/childObj',
          },
        },
        definitions: {
          childObj: {
            type: 'object',
            properties: {
              otherName: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).to.have.length.of(2);
    });

    it('should priorize local properties over definition ones', () => {
      // Refs bug #140
      const schema = {
        type: 'object',
        properties: {
          foo: {
            title: 'custom title',
            $ref: '#/definitions/objectDef',
          },
        },
        definitions: {
          objectDef: {
            type: 'object',
            title: 'definition title',
            properties: {
              field: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector('legend').textContent).eql('custom title');
    });

    it('should propagate and handle a resolved schema definition', () => {
      const schema = {
        definitions: {
          enumDef: { type: 'string', enum: ['a', 'b'] },
        },
        type: 'object',
        properties: {
          name: { $ref: '#/definitions/enumDef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('option')).to.have.length.of(3);
    });
  });

  describe('Default value handling on clear', () => {
    const schema = {
      type: 'string',
      default: 'foo',
    };

    it('should not set default when a text field is cleared', () => {
      const { node } = createFormComponent({ schema, formData: 'bar' });

      fireEvent.change(node.querySelector('input'), {
        target: { value: '' },
      });

      expect(node.querySelector('input').value).eql('');
    });
  });

  describe('Defaults array items default propagation', () => {
    const schema = {
      type: 'object',
      title: 'lvl 1 obj',
      properties: {
        object: {
          type: 'object',
          title: 'lvl 2 obj',
          properties: {
            array: {
              type: 'array',
              items: {
                type: 'object',
                title: 'lvl 3 obj',
                properties: {
                  bool: {
                    type: 'boolean',
                    default: true,
                  },
                },
              },
            },
          },
        },
      },
    };

    it('should propagate deeply nested defaults to submit handler', () => {
      const { node, onSubmit } = createFormComponent({ schema });

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));
      fireEvent.submit(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          object: {
            array: [
              {
                bool: true,
              },
            ],
          },
        },
      });
    });
  });

  describe('Defaults additionalProperties propagation', () => {
    it('should submit string string map defaults', () => {
      const schema = {
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
        default: {
          foo: 'bar',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          foo: 'bar',
        },
      });
    });

    it('should submit a combination of properties and additional properties defaults', () => {
      const schema = {
        type: 'object',
        properties: {
          x: {
            type: 'string',
          },
        },
        additionalProperties: {
          type: 'string',
        },
        default: {
          x: 'x default value',
          y: 'y default value',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          x: 'x default value',
          y: 'y default value',
        },
      });
    });

    it('should submit a properties and additional properties defaults when properties default is nested', () => {
      const schema = {
        type: 'object',
        properties: {
          x: {
            type: 'string',
            default: 'x default value',
          },
        },
        additionalProperties: {
          type: 'string',
        },
        default: {
          y: 'y default value',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          x: 'x default value',
          y: 'y default value',
        },
      });
    });

    it('should submit defaults when nested map has map values', async () => {
      const schema = {
        type: 'object',
        properties: {
          x: {
            additionalProperties: {
              $ref: '#/definitions/objectDef',
            },
          },
        },
        definitions: {
          objectDef: {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          },
        },
        default: {
          x: {
            y: {
              z: 'x.y.z default value',
            },
          },
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await act(() => {
        fireEvent.submit(node);
      });

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          x: {
            y: {
              z: 'x.y.z default value',
            },
          },
        },
      });
    });

    it('should submit defaults when they are defined in a nested additionalProperties', async () => {
      const schema = {
        type: 'object',
        properties: {
          x: {
            additionalProperties: {
              type: 'string',
              default: 'x.y default value',
            },
          },
        },
        default: {
          x: {
            y: {},
          },
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await act(() => {
        fireEvent.submit(node);
      });

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          x: {
            y: 'x.y default value',
          },
        },
      });
    });

    it('should submit defaults when additionalProperties is a boolean value', () => {
      const schema = {
        type: 'object',
        additionalProperties: true,
        default: {
          foo: 'bar',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          foo: 'bar',
        },
      });
    });

    it('should NOT submit default values when additionalProperties is false', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
        additionalProperties: false,
        default: {
          foo: "I'm the only one",
          bar: "I don't belong here",
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      fireEvent.submit(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          foo: "I'm the only one",
        },
      });
    });
  });

  describe('Submit handler', () => {
    it('should call provided submit handler with form state', async () => {
      const schema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      };
      const formData = {
        foo: 'bar',
      };
      const onSubmit = sandbox.spy();
      const event = { type: 'submit' };
      const { node } = createFormComponent({
        ref: createRef(),
        schema,
        formData,
        onSubmit,
      });

      await act(() => {
        fireEvent.submit(node, event);
      });
      sinon.assert.calledWithMatch(onSubmit, { formData, schema }, event);
    });

    it('should not call provided submit handler on validation errors', async () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            minLength: 1,
          },
        },
      };
      const formData = {
        foo: '',
      };
      const onSubmit = sandbox.spy();
      const onError = sandbox.spy();
      const { node } = createFormComponent({
        ref: createRef(),
        schema,
        formData,
        onSubmit,
        onError,
      });

      await act(() => {
        fireEvent.submit(node);
      });

      sinon.assert.notCalled(onSubmit);
    });
  });

  describe('Change handler', () => {
    it('should call provided change handler on form state change with schema and uiSchema', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      };
      const uiSchema = {
        foo: { 'ui:field': 'textarea' },
      };

      const formData = {
        foo: '',
      };
      const onChange = sandbox.spy();
      const { node } = createFormComponent({
        ref: createRef(),
        schema,
        uiSchema,
        formData,
        onChange,
      });

      fireEvent.change(node.querySelector('[type=text]'), {
        target: { value: 'new' },
      });

      sinon.assert.calledWithMatch(
        onChange,
        {
          formData: {
            foo: 'new',
          },
          schema,
          uiSchema,
        },
        'root_foo',
      );
    });
    it('should call last provided change handler', async () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            default: 'bar',
          },
        },
      };

      const secondOnChange = sandbox.spy();

      const { comp, onChange } = createFormComponent({
        ref: createRef(),
        schema,
        formData: { foo: 'bar1' },
      });

      act(() => {
        setProps(comp, {
          ref: comp.ref,
          schema,
          formData: {},
          onChange,
        });
      });

      sinon.assert.callCount(onChange, 1);

      act(() => {
        setProps(comp, {
          ref: comp.ref,
          schema,
          formData: { foo: 'bar2' },
        });
      });

      await act(() => {
        setProps(comp, {
          ref: comp.ref,
          schema,
          formData: {},
          onChange: secondOnChange,
        });
      });

      sinon.assert.callCount(onChange, 1);
      sinon.assert.callCount(secondOnChange, 1);
    });
    it('should call change handler with proper data after two near simultaneous changes', async () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            default: 'bar',
          },
          baz: {
            type: 'string',
            default: 'blah',
          },
        },
      };
      function FooWidget(props) {
        const { value, id, onChange, uiSchema, registry } = props;
        const uiOptions = getUiOptions(uiSchema);
        const BaseInputTemplate = getTemplate('BaseInputTemplate', registry, uiOptions);
        useEffect(() => {
          if (value === 'bar') {
            onChange('bar2', undefined, id);
          }
        }, [value, onChange, id]);
        return <BaseInputTemplate {...props} />;
      }
      function BazWidget(props) {
        const { value, id, onChange, uiSchema, registry } = props;
        const uiOptions = getUiOptions(uiSchema);
        const BaseInputTemplate = getTemplate('BaseInputTemplate', registry, uiOptions);
        useEffect(() => {
          if (value === 'blah') {
            onChange('blah2', undefined, id);
          }
        }, [value, onChange, id]);
        return <BaseInputTemplate {...props} />;
      }
      const uiSchema = {
        foo: {
          'ui:widget': FooWidget,
        },
        baz: {
          'ui:widget': BazWidget,
        },
      };

      let formData = {};
      const ids = [];
      const onChange = (data, id) => {
        const { formData: fd } = data;
        formData = { ...formData, ...fd };
        ids.push(id);
      };
      createFormComponent({
        schema,
        formData,
        onChange,
        uiSchema,
      });

      await waitFor(() => {
        expect(ids).to.have.length(3);
      });

      expect(formData).to.eql({ foo: 'bar2', baz: 'blah2' });
      // There will be 3 ids, undefined for the setting of the defaults and then the two updated components
      expect(ids).to.eql([undefined, 'root_foo', 'root_baz']);
    });
    it('should modify an allOf field when the defaults are set', () => {
      const schema = {
        properties: {
          all_of_field: {
            allOf: [
              {
                properties: {
                  first: {
                    type: 'string',
                  },
                },
              },
              {
                properties: {
                  second: {
                    type: 'string',
                  },
                },
              },
            ],
            default: {
              second: 'second!',
            },
          },
        },
        type: 'object',
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const secondInputID = '#root_all_of_field_second';
      expect(node.querySelector(secondInputID).value).to.equal('second!');

      act(() => {
        fireEvent.change(node.querySelector(secondInputID), {
          target: { value: 'changed!' },
        });
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            all_of_field: {
              second: 'changed!',
            },
          },
          schema,
        },
        'root_all_of_field_second',
      );

      expect(node.querySelector(secondInputID).value).to.equal('changed!');
    });
    it('should modify an oneOf field when the defaults are set', () => {
      const schema = {
        properties: {
          one_of_field: {
            oneOf: [
              {
                properties: {
                  first: {
                    type: 'string',
                  },
                },
              },
              {
                properties: {
                  second: {
                    type: 'string',
                  },
                },
              },
            ],
            default: {
              second: 'second!',
            },
          },
        },
        type: 'object',
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const secondInputID = '#root_one_of_field_second';
      expect(node.querySelector(secondInputID).value).to.equal('second!');

      act(() => {
        fireEvent.change(node.querySelector(secondInputID), {
          target: { value: 'changed!' },
        });
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            one_of_field: {
              second: 'changed!',
            },
          },
          schema,
        },
        'root_one_of_field_second',
      );

      expect(node.querySelector(secondInputID).value).to.equal('changed!');
    });
    it('should modify an anyOf field when the defaults are set', () => {
      const schema = {
        properties: {
          any_of_field: {
            anyOf: [
              {
                properties: {
                  first: {
                    type: 'string',
                  },
                },
              },
              {
                properties: {
                  second: {
                    type: 'string',
                  },
                },
              },
            ],
            default: {
              second: 'second!',
            },
          },
        },
        type: 'object',
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const secondInputID = '#root_any_of_field_second';
      expect(node.querySelector(secondInputID).value).to.equal('second!');

      act(() => {
        fireEvent.change(node.querySelector(secondInputID), {
          target: { value: 'changed!' },
        });
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            any_of_field: {
              second: 'changed!',
            },
          },
          schema,
        },
        'root_any_of_field_second',
      );

      expect(node.querySelector(secondInputID).value).to.equal('changed!');
    });
    it('Should modify anyOf definition references when the defaults are set.', () => {
      const schema = {
        definitions: {
          option1: {
            properties: {
              first: {
                type: 'string',
              },
            },
          },
          option2: {
            properties: {
              second: {
                type: 'string',
              },
            },
          },
        },
        properties: {
          any_of_field: {
            anyOf: [
              {
                $ref: '#/definitions/option1',
              },
              {
                $ref: '#/definitions/option2',
              },
            ],
            default: {
              second: 'second!',
            },
          },
        },
        type: 'object',
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const secondInputID = '#root_any_of_field_second';
      expect(node.querySelector(secondInputID).value).to.equal('second!');

      act(() => {
        fireEvent.change(node.querySelector(secondInputID), {
          target: { value: 'changed!' },
        });
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            any_of_field: {
              second: 'changed!',
            },
          },
          schema,
        },
        'root_any_of_field_second',
      );

      expect(node.querySelector(secondInputID).value).to.equal('changed!');
    });
    it('Should modify oneOf object with references when the defaults are set.', () => {
      const schema = {
        type: 'object',
        $defs: {
          protocol: {
            type: 'string',
            enum: ['fast', 'balanced', 'stringent'],
            default: 'fast',
          },
        },
        oneOf: [
          {
            properties: {
              protocol: {
                $ref: '#/$defs/protocol',
              },
            },
          },
          {
            properties: {
              something: {
                type: 'number',
              },
            },
          },
        ],
      };

      const { node, onChange } = createFormComponent({
        schema,
      });

      const protocolInputID = '#root_protocol';
      expect(node.querySelector(protocolInputID).value).to.equal('0');

      act(() => {
        fireEvent.change(node.querySelector(protocolInputID), {
          target: { value: '1' },
        });
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            protocol: 'balanced',
          },
          schema,
        },
        'root_protocol',
      );

      expect(node.querySelector(protocolInputID).value).to.equal('1');
    });
    describe('Should modify oneOf radio button when the defaults are set.', () => {
      const schema = {
        type: 'object',
        properties: {
          a: {
            type: ['boolean', 'null'],
            default: null,
            oneOf: [
              {
                const: false,
                title: 'No',
              },
              {
                const: null,
                title: 'N/A',
              },
            ],
          },
        },
        allOf: [
          {
            if: {
              required: ['a'],
              properties: {
                a: {
                  const: false,
                },
              },
            },
            then: {
              required: ['b'],
              properties: {
                b: {
                  type: 'string',
                },
              },
            },
          },
        ],
      };

      const uiSchema = {
        a: {
          'ui:widget': 'radio',
          'ui:label': false,
        },
      };
      const notApplicableInputID = '#root_a-1';
      const NoInputID = '#root_a-0';

      it('Test with default constAsDefaults', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
        });

        expect(node.querySelector(notApplicableInputID).checked).to.equal(true);

        act(() => {
          fireEvent.click(node.querySelector(NoInputID));
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            formData: {
              a: false,
            },
            schema,
            uiSchema,
          },
          'root_a',
        );

        expect(node.querySelector(NoInputID).checked).to.equal(true);
        expect(node.querySelector(notApplicableInputID).checked).to.equal(false);
        expect(node.querySelector('#root_b')).to.exist;
      });
      it('Test with constAsDefaults set to "never"', () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
          experimental_defaultFormStateBehavior: {
            constAsDefaults: 'never',
          },
        });

        expect(node.querySelector(notApplicableInputID).checked).to.equal(true);

        act(() => {
          fireEvent.click(node.querySelector(NoInputID));
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            formData: {
              a: false,
            },
            schema,
            uiSchema,
          },
          'root_a',
        );

        expect(node.querySelector(NoInputID).checked).to.equal(true);
        expect(node.querySelector(notApplicableInputID).checked).to.equal(false);
        expect(node.querySelector('#root_b')).to.exist;
      });
    });
  });

  describe('Blur handler', () => {
    it('should call provided blur handler on form input blur event', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      };
      const formData = {
        foo: '',
      };
      const onBlur = sandbox.spy();
      const { node } = createFormComponent({ schema, formData, onBlur });

      const input = node.querySelector('[type=text]');
      fireEvent.blur(input, {
        target: { value: 'new' },
      });

      sinon.assert.calledWithMatch(onBlur, input.id, 'new');
    });
  });

  describe('Focus handler', () => {
    it('should call provided focus handler on form input focus event', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
      };
      const formData = {
        foo: '',
      };
      const onFocus = sandbox.spy();
      const { node } = createFormComponent({ schema, formData, onFocus });

      const input = node.querySelector('[type=text]');
      fireEvent.focus(input, {
        target: { value: 'new' },
      });

      sinon.assert.calledWithMatch(onFocus, input.id, 'new');
    });
  });

  describe('Error handler', () => {
    it('should call provided error handler on validation errors', () => {
      const schema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            minLength: 1,
          },
        },
      };
      const formData = {
        foo: '',
      };
      const onError = sandbox.spy();
      const { node } = createFormComponent({ schema, formData, onError });

      fireEvent.submit(node);

      sinon.assert.calledOnce(onError);
    });
  });

  describe('Required and optional fields', () => {
    const schema = {
      definitions: {
        address: {
          type: 'object',
          properties: {
            street_address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            state: {
              type: 'string',
            },
          },
          required: ['street_address', 'city', 'state'],
        },
      },
      type: 'object',
      properties: {
        billing_address: {
          title: 'Billing address',
          $ref: '#/definitions/address',
        },
        shipping_address: {
          title: 'Shipping address',
          $ref: '#/definitions/address',
        },
      },
      required: ['shipping_address'],
    };
    it('Errors when shipping address is not filled out, billing address is not needed', () => {
      const { node, onChange, onError } = createFormComponent({ schema });
      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: {
          shipping_address: {},
        },
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          message: "must have required property 'street_address'",
          name: 'required',
          params: { missingProperty: 'street_address' },
          property: '.shipping_address.street_address',
          schemaPath: '#/properties/shipping_address/required',
          stack: "must have required property 'street_address'",
          title: '',
        },
        {
          message: "must have required property 'city'",
          name: 'required',
          params: { missingProperty: 'city' },
          property: '.shipping_address.city',
          schemaPath: '#/properties/shipping_address/required',
          stack: "must have required property 'city'",
          title: '',
        },
        {
          message: "must have required property 'state'",
          name: 'required',
          params: { missingProperty: 'state' },
          property: '.shipping_address.state',
          schemaPath: '#/properties/shipping_address/required',
          stack: "must have required property 'state'",
          title: '',
        },
      ]);
    });
    it('Submits when shipping address is filled out, billing address is not needed', () => {
      const { node, onSubmit } = createFormComponent({
        schema,
        formData: {
          shipping_address: {
            street_address: '21, Jump Street',
            city: 'Babel',
            state: 'Neverland',
          },
        },
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          shipping_address: {
            street_address: '21, Jump Street',
            city: 'Babel',
            state: 'Neverland',
          },
        },
      });
    });
  });

  describe('Default form state behavior flag', () => {
    const schema = {
      type: 'object',
      properties: {
        albums: {
          type: 'array',
          items: { type: 'string' },
          title: 'Album Titles',
          minItems: 3,
        },
      },
    };
    it('Errors when minItems is set, field is required, and minimum number of items are not present with IgnoreMinItemsUnlessRequired flag set', () => {
      const { node, onError } = createFormComponent({
        schema: { ...schema, required: ['albums'] },
        formData: {
          albums: ['Until We Have Faces'],
        },
        experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          message: 'must NOT have fewer than 3 items',
          name: 'minItems',
          params: { limit: 3 },
          property: '.albums',
          schemaPath: '#/properties/albums/minItems',
          stack: "'Album Titles' must NOT have fewer than 3 items",
          title: 'Album Titles',
        },
      ]);
    });
    it('Submits when minItems is set, field is not required, and no items are present with IgnoreMinItemsUnlessRequired flag set', () => {
      const { node, onSubmit } = createFormComponent({
        schema,
        formData: {},
        experimental_defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } },
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, { formData: {} });
    });
  });

  describe('Schema and external formData updates', () => {
    let comp;
    let onChangeProp;
    let formProps;

    beforeEach(() => {
      onChangeProp = sinon.spy();
      formProps = {
        ref: createRef(),
        schema: {
          type: 'string',
          default: 'foobar',
        },
        formData: 'some value',
        onChange: onChangeProp,
      };
      comp = createFormComponent(formProps).comp;
    });

    describe('when the form data is set to null', () => {
      beforeEach(() =>
        setProps(comp, {
          ref: comp.ref,
          ...formProps,
          formData: null,
        }),
      );

      it('should call onChange', () => {
        sinon.assert.calledOnce(onChangeProp);
        sinon.assert.calledWith(onChangeProp, {
          edit: true,
          errorSchema: {},
          errors: [],
          formData: 'foobar',
          fieldPathId: { $id: 'root', path: [] },
          schema: formProps.schema,
          uiSchema: {},
          schemaUtils: sinon.match.object,
        });
      });
    });

    describe('when the schema default is changed but formData is not changed', () => {
      const newSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        setProps(comp, {
          ...formProps,
          ref: comp.ref,
          schema: newSchema,
          formData: 'some value',
        }),
      );

      it('should not call onChange', () => {
        sinon.assert.notCalled(onChangeProp);
      });
    });

    describe('when the schema default is changed and formData is changed', () => {
      const newSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        setProps(comp, {
          ...formProps,
          ref: comp.ref,
          schema: newSchema,
          formData: 'something else',
        }),
      );

      it('should not call onChange', () => {
        sinon.assert.notCalled(onChangeProp);
      });
    });

    describe('when the schema default is changed and formData is nulled', () => {
      const newSchema = {
        type: 'string',
        default: 'the new default',
      };

      beforeEach(() =>
        setProps(comp, {
          ...formProps,
          ref: comp.ref,
          schema: newSchema,
          formData: null,
        }),
      );

      it('should call onChange', () => {
        sinon.assert.calledOnce(onChangeProp);
        sinon.assert.calledWithMatch(onChangeProp, {
          schema: newSchema,
          formData: 'the new default',
        });
      });
    });

    describe('when the onChange prop sets formData to a falsey value', () => {
      class TestForm extends Component {
        constructor() {
          super();

          this.state = {
            formData: {},
          };
        }

        onChange = () => {
          this.setState({ formData: this.props.falseyValue });
        };

        render() {
          const schema = {
            type: 'object',
            properties: {
              value: {
                type: 'string',
              },
            },
          };
          return <Form onChange={this.onChange} schema={schema} formData={this.state.formData} validator={validator} />;
        }
      }

      const falseyValues = [0, false, null, undefined, NaN];

      falseyValues.forEach((falseyValue) => {
        it("Should not crash due to 'Maximum call stack size exceeded...'", () => {
          // It is expected that this will throw an error due to non-matching propTypes,
          // so the error message needs to be inspected
          try {
            createComponent(TestForm, { falseyValue });
          } catch (e) {
            expect(e.message).to.not.equal('Maximum call stack size exceeded');
          }
        });
      });
    });
  });

  describe('External formData updates', () => {
    describe('root level', () => {
      const formProps = {
        ref: createRef(),
        schema: { type: 'string' },
      };

      it('should call submit handler with new formData prop value', async () => {
        const { comp, node, onSubmit } = createFormComponent(formProps);

        setProps(comp, {
          ref: comp.ref,
          ...formProps,
          onSubmit,
          formData: 'yo',
        });
        await act(() => submitForm(node));
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          formData: 'yo',
        });
      });

      it('should validate formData when the schema is updated', async () => {
        const { comp, node, onError } = createFormComponent(formProps);

        setProps(comp, {
          ...formProps,
          onError,
          ref: comp.ref,
          formData: 'yo',
          schema: { type: 'number' },
        });
        await act(() => submitForm(node));
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must be number',
            name: 'type',
            params: { type: 'number' },
            property: '',
            schemaPath: '#/type',
            stack: 'must be number',
            title: '',
          },
        ]);
      });
    });

    describe('object level', () => {
      it('should call submit handler with new formData prop value', async () => {
        const formProps = {
          ref: createRef(),
          schema: { type: 'object', properties: { foo: { type: 'string' } } },
        };
        const { comp, onSubmit, node } = createFormComponent(formProps);

        setProps(comp, {
          ...formProps,
          ref: comp.ref,
          onSubmit,
          formData: { foo: 'yo' },
        });

        await act(() => submitForm(node));
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          formData: { foo: 'yo' },
        });
      });
    });

    describe('array level', () => {
      it('should call submit handler with new formData prop value', async () => {
        const schema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };
        const { comp, node, onSubmit } = createFormComponent({ ref: createRef(), schema });

        setProps(comp, {
          ref: comp.ref,
          schema,
          onSubmit,
          formData: ['yo'],
        });

        await act(() => submitForm(node));
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          formData: ['yo'],
        });
      });
    });
  });

  describe('Internal formData updates', () => {
    it('root', () => {
      const formProps = {
        ref: createRef(),
        schema: { type: 'string' },
      };
      const { node, onChange } = createFormComponent(formProps);

      fireEvent.change(node.querySelector('input[type=text]'), {
        target: { value: 'yo' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: 'yo',
        },
        'root',
      );
    });
    it('object', () => {
      const { node, onChange } = createFormComponent({
        ref: createRef(),
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
          },
        },
      });

      fireEvent.change(node.querySelector('input[type=text]'), {
        target: { value: 'yo' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { foo: 'yo' },
        },
        'root_foo',
      );
    });
    it('array of strings', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

      fireEvent.change(node.querySelector('input[type=text]'), {
        target: { value: 'yo' },
      });
      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: ['yo'],
        },
        'root_0',
      );
    });
    it('array of objects', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

      fireEvent.change(node.querySelector('input[type=text]'), {
        target: { value: 'yo' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: [{ name: 'yo' }],
        },
        'root_0',
      );
    });
    it('dependency with array of objects', () => {
      const schema = {
        definitions: {},
        type: 'object',
        properties: {
          show: {
            type: 'boolean',
          },
        },
        dependencies: {
          show: {
            oneOf: [
              {
                properties: {
                  show: {
                    const: true,
                  },
                  participants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      };
      const { node, onChange } = createFormComponent({ ref: createRef(), schema });

      const checkbox = node.querySelector('[type=checkbox]');
      fireEvent.click(checkbox);

      fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

      fireEvent.change(node.querySelector('input[type=text]'), {
        target: { value: 'yo' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: {
            show: true,
            participants: [{ name: 'yo' }],
          },
        },
        'root_participants_0_name',
      );
    });
  });

  describe('Error contextualization', () => {
    describe('on form state updated', () => {
      const schema = {
        type: 'string',
        minLength: 8,
      };

      describe('Lazy validation', () => {
        it('should not update the errorSchema when the formData changes', () => {
          const { node, onChange } = createFormComponent({ schema });

          fireEvent.change(node.querySelector('input[type=text]'), {
            target: { value: 'short' },
          });
          sinon.assert.calledWithMatch(
            onChange.lastCall,
            {
              errorSchema: {},
            },
            'root',
          );
        });

        it('should not denote an error in the field', () => {
          const { node } = createFormComponent({ schema });

          fireEvent.change(node.querySelector('input[type=text]'), {
            target: { value: 'short' },
          });

          expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(0);
        });

        it("should clean contextualized errors up when they're fixed", () => {
          const altSchema = {
            type: 'object',
            properties: {
              field1: { type: 'string', minLength: 8 },
              field2: { type: 'string', minLength: 8 },
            },
          };
          const { node } = createFormComponent({
            schema: altSchema,
            formData: {
              field1: 'short',
              field2: 'short',
            },
          });

          fireEvent.submit(node);

          // Fix the first field
          fireEvent.change(node.querySelectorAll('input[type=text]')[0], {
            target: { value: 'fixed error' },
          });
          fireEvent.submit(node);

          expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(1);

          // Fix the second field
          fireEvent.change(node.querySelectorAll('input[type=text]')[1], {
            target: { value: 'fixed error too' },
          });
          fireEvent.submit(node);

          // No error remaining, shouldn't throw.
          fireEvent.submit(node);

          expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(0);
        });
      });

      describe('Live validation', () => {
        it('should update the errorSchema when the formData changes', () => {
          const { node, onChange } = createFormComponent({
            schema,
            liveValidate: true,
          });

          fireEvent.change(node.querySelector('input[type=text]'), {
            target: { value: 'short' },
          });

          sinon.assert.calledWithMatch(
            onChange.lastCall,
            {
              errorSchema: {
                __errors: ['must NOT have fewer than 8 characters'],
              },
            },
            'root',
          );
        });

        it('should denote the new error in the field', () => {
          const { node } = createFormComponent({
            schema,
            liveValidate: true,
          });

          fireEvent.change(node.querySelector('input[type=text]'), {
            target: { value: 'short' },
          });

          expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(1);
          expect(node.querySelector('.rjsf-field-string .error-detail').textContent).eql(
            'must NOT have fewer than 8 characters',
          );
        });
      });

      describe('Disable validation onChange event', () => {
        it('should not update errorSchema when the formData changes', () => {
          const { node, onChange } = createFormComponent({
            schema,
            noValidate: true,
            liveValidate: true,
          });

          fireEvent.change(node.querySelector('input[type=text]'), {
            target: { value: 'short' },
          });

          sinon.assert.calledWithMatch(
            onChange.lastCall,
            {
              errorSchema: {},
            },
            'root',
          );
        });
      });

      describe('Disable validation onSubmit event', () => {
        it('should not update errorSchema when the formData changes', () => {
          const { node, onSubmit } = createFormComponent({
            schema,
            noValidate: true,
          });

          fireEvent.change(node.querySelector('input[type=text]'), {
            target: { value: 'short' },
          });
          fireEvent.submit(node);

          sinon.assert.calledWithMatch(onSubmit.lastCall, {
            errorSchema: {},
          });
        });
      });
    });

    describe('on form submitted', () => {
      const schema = {
        type: 'string',
        minLength: 8,
      };

      it('should call the onError handler and focus on the error', () => {
        const onError = sandbox.spy();
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError: true,
        });

        const input = node.querySelector('input[type=text]');
        const focusSpy = sinon.spy();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        input.focus = focusSpy;
        fireEvent.change(input, {
          target: { value: 'short' },
        });
        fireEvent.submit(node);

        sinon.assert.calledWithMatch(
          onError,
          sinon.match((value) => {
            return value.length === 1 && value[0].message === 'must NOT have fewer than 8 characters';
          }),
        );
        sinon.assert.calledOnce(focusSpy);
      });

      it('should call the onError handler and call the provided focusOnFirstError callback function', () => {
        const onError = sandbox.spy();

        const focusCallback = () => {
          console.log('focusCallback called');
        };

        const focusOnFirstError = sandbox.spy(focusCallback);
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError,
          uiSchema: {
            'ui:disabled': true,
          },
        });

        const input = node.querySelector('input[type=text]');
        const focusSpy = sinon.spy();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        input.focus = focusSpy;

        fireEvent.change(input, {
          target: { value: 'short' },
        });
        fireEvent.submit(node);

        sinon.assert.calledWithMatch(
          onError,
          sinon.match((value) => {
            return value.length === 1 && value[0].message === 'must NOT have fewer than 8 characters';
          }),
        );
        sinon.assert.notCalled(focusSpy);
        sinon.assert.calledOnce(focusOnFirstError);
      });

      it('should call the onError handler and call the provided focusOnFirstError callback function', () => {
        const onError = sandbox.spy();

        const focusCallback = () => {
          console.log('focusCallback called');
        };
        const extraErrors = {
          __errors: ['foo'],
        };

        const focusOnFirstError = sandbox.spy(focusCallback);
        const { node } = createFormComponent({
          schema,
          onError,
          focusOnFirstError,
          extraErrors,
          extraErrorsBlockSubmit: true,
        });

        const input = node.querySelector('input[type=text]');
        const focusSpy = sinon.spy();
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        input.focus = focusSpy;

        fireEvent.change(input, {
          target: { value: 'valid string' },
        });
        fireEvent.submit(node);

        sinon.assert.calledWithMatch(
          onError,
          sinon.match((value) => {
            return value.length === 1 && value[0].message === 'foo';
          }),
        );
        sinon.assert.notCalled(focusSpy);
        sinon.assert.calledOnce(focusOnFirstError);
      });

      it('should reset errors and errorSchema state to initial state after correction and resubmission', () => {
        const { node, onError, onSubmit } = createFormComponent({
          schema,
        });

        fireEvent.change(node.querySelector('input[type=text]'), {
          target: { value: 'short' },
        });
        fireEvent.submit(node);

        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 8 characters',
            name: 'minLength',
            params: { limit: 8 },
            property: '',
            schemaPath: '#/minLength',
            stack: 'must NOT have fewer than 8 characters',
            title: '',
          },
        ]);
        sinon.assert.calledOnce(onError);
        sinon.resetHistory(onError);

        fireEvent.change(node.querySelector('input[type=text]'), {
          target: { value: 'long enough' },
        });
        fireEvent.submit(node);
        sinon.assert.notCalled(onError);
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          errors: [],
          errorSchema: {},
        });
      });

      it('should reset errors from UI after correction and resubmission', () => {
        const { node } = createFormComponent({
          schema,
        });

        fireEvent.change(node.querySelector('input[type=text]'), {
          target: { value: 'short' },
        });
        fireEvent.submit(node);

        const errorListHTML = '<li class="text-danger">must NOT have fewer than 8 characters</li>';
        const errors = node.querySelectorAll('.error-detail');
        // Check for errors attached to the field
        expect(errors).to.have.lengthOf(1);
        expect(errors[0]).to.have.property('innerHTML');
        expect(errors[0].innerHTML).to.be.eql(errorListHTML);

        fireEvent.change(node.querySelector('input[type=text]'), {
          target: { value: 'long enough' },
        });
        fireEvent.submit(node);
        expect(node.querySelectorAll('.error-detail')).to.have.lengthOf(0);
      });
    });

    describe('root level, live validation', () => {
      const formProps = {
        liveValidate: true,
        schema: {
          type: 'string',
          minLength: 8,
        },
        formData: 'short',
      };

      it('should reflect the contextualized error in state', () => {
        const { node, onError } = createFormComponent(formProps);
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 8 characters',
            name: 'minLength',
            params: { limit: 8 },
            property: '',
            schemaPath: '#/minLength',
            stack: 'must NOT have fewer than 8 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);

        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(0);

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: 'shorts' },
          });
        });

        expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(1);
        expect(node.querySelector('.rjsf-field-string .error-detail').textContent).eql(
          'must NOT have fewer than 8 characters',
        );
      });
    });

    describe('root level with multiple errors, live validation', () => {
      const formProps = {
        liveValidate: true,
        schema: {
          type: 'string',
          minLength: 8,
          pattern: 'd+',
        },
        formData: 'short',
      };

      it('should reflect the contextualized error in state', () => {
        const { node, onError } = createFormComponent(formProps);
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 8 characters',
            name: 'minLength',
            params: { limit: 8 },
            property: '',
            schemaPath: '#/minLength',
            stack: 'must NOT have fewer than 8 characters',
            title: '',
          },
          {
            message: 'must match pattern "d+"',
            name: 'pattern',
            params: { pattern: 'd+' },
            property: '',
            schemaPath: '#/pattern',
            stack: 'must match pattern "d+"',
            title: '',
          },
        ]);
      });

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);

        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(0);

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: 'shorts' },
          });
        });
        const liNodes = node.querySelectorAll('.rjsf-field-string .error-detail li');
        const errors = [].map.call(liNodes, (li) => li.textContent);

        expect(errors).eql(['must NOT have fewer than 8 characters', 'must match pattern "d+"']);
      });
    });

    describe('nested field level, live validation', () => {
      const schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'string',
                minLength: 8,
              },
            },
          },
        },
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: {
          level1: {
            level2: 'short',
          },
        },
      };

      it('should reflect the contextualized error in state', () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 8 characters',
            name: 'minLength',
            params: { limit: 8 },
            property: '.level1.level2',
            schemaPath: '#/properties/level1/properties/level2/minLength',
            stack: '.level1.level2 must NOT have fewer than 8 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the field', () => {
        const { node } = createFormComponent(formProps);
        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(0);

        act(() => {
          fireEvent.change(node.querySelector('input'), {
            target: { value: 'shorts' },
          });
        });
        const errorDetail = node.querySelector('.rjsf-field-object .rjsf-field-string .error-detail');

        expect(node.querySelectorAll('.rjsf-field-error')).to.have.length.of(1);
        expect(errorDetail.textContent).eql('must NOT have fewer than 8 characters');
      });
    });

    describe('array indices, live validation', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
          minLength: 4,
        },
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: ['good', 'ba', 'good'],
      };

      it('should contextualize the error for array indices', () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.1',
            schemaPath: '#/items/minLength',
            stack: '.1 must NOT have fewer than 4 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the item field in error', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.rjsf-field-string');

        // live validate does not run on initial render anymore
        expect(fieldNodes[1].classList.contains('rjsf-field-error')).eql(false);

        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        act(() => {
          fireEvent.change(fieldNodes[1].querySelector('input'), {
            target: { value: 'bad' },
          });
        });

        const liNodes = fieldNodes[1].querySelectorAll('.rjsf-field-string .error-detail li');
        const errors = [].map.call(liNodes, (li) => li.textContent);

        expect(errors).eql(['must NOT have fewer than 4 characters']);
      });

      it('should not denote errors on non impacted fields', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.rjsf-field-string');

        expect(fieldNodes[0].classList.contains('rjsf-field-error')).eql(false);
        expect(fieldNodes[2].classList.contains('rjsf-field-error')).eql(false);
      });
    });

    describe('nested array indices, live validation', () => {
      const schema = {
        type: 'object',
        properties: {
          level1: {
            type: 'array',
            items: {
              type: 'string',
              minLength: 4,
            },
          },
        },
      };

      const formProps = { schema, liveValidate: true };

      it('should contextualize the error for nested array indices', () => {
        const { node, onError } = createFormComponent({
          ...formProps,
          formData: {
            level1: ['good', 'bad', 'good', 'bad'],
          },
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.level1.1',
            schemaPath: '#/properties/level1/items/minLength',
            stack: '.level1.1 must NOT have fewer than 4 characters',
            title: '',
          },
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.level1.3',
            schemaPath: '#/properties/level1/items/minLength',
            stack: '.level1.3 must NOT have fewer than 4 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the nested item field in error', () => {
        const { node } = createFormComponent({
          ...formProps,
          formData: {
            level1: ['good', 'ba', 'good'],
          },
        });

        const fields = node.querySelectorAll('.rjsf-field-string');
        let liNodes = node.querySelectorAll('.rjsf-field-string .error-detail li');
        let errors = [].map.call(liNodes, (li) => li.textContent);

        // live validate does not run on initial render anymore
        expect(errors).eql([]);

        act(() => {
          fireEvent.change(fields[1].querySelector('input'), {
            target: { value: 'bad' },
          });
        });

        liNodes = node.querySelectorAll('.rjsf-field-string .error-detail li');
        errors = [].map.call(liNodes, (li) => li.textContent);
        expect(errors).eql(['must NOT have fewer than 4 characters']);
      });
    });

    describe('nested arrays, live validation', () => {
      const schema = {
        type: 'object',
        properties: {
          outer: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'string',
                minLength: 4,
              },
            },
          },
        },
      };

      const formData = {
        outer: [
          ['good', 'bad'],
          ['bad', 'good'],
        ],
      };

      const formProps = { schema, formData, liveValidate: true };

      it('should contextualize the error for nested array indices, focusing on first error', () => {
        const { node, onError } = createFormComponent({
          ...formProps,
          focusOnFirstError: true,
        });

        const focusSpy = sinon.spy();
        const input = node.querySelector('input[id=root_outer_0_1]');
        // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
        input.focus = focusSpy;

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.outer.0.1',
            schemaPath: '#/properties/outer/items/items/minLength',
            stack: '.outer.0.1 must NOT have fewer than 4 characters',
            title: '',
          },
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.outer.1.0',
            schemaPath: '#/properties/outer/items/items/minLength',
            stack: '.outer.1.0 must NOT have fewer than 4 characters',
            title: '',
          },
        ]);
        sinon.assert.calledOnce(focusSpy);
      });

      it('should denote the error in the nested item field in error', () => {
        const { node } = createFormComponent(formProps);

        const fields = node.querySelectorAll('.rjsf-field-string');
        let errors = [].map.call(fields, (field) => {
          const li = field.querySelector('.error-detail li');
          return li && li.textContent;
        });

        // live validate does not run on initial render anymore
        expect(errors).eql([null, null, null, null]);

        act(() => {
          fireEvent.change(fields[0].querySelector('input'), {
            target: { value: 'bad' },
          });
        });
        errors = [].map.call(fields, (field) => {
          const li = field.querySelector('.error-detail li');
          return li && li.textContent;
        });

        expect(errors).eql([
          'must NOT have fewer than 4 characters',
          'must NOT have fewer than 4 characters',
          'must NOT have fewer than 4 characters',
          null,
        ]);
      });
    });

    describe('array nested items, live validation', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              minLength: 4,
            },
          },
        },
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: [{ foo: 'good' }, { foo: 'ba' }, { foo: 'good' }],
      };

      it('should contextualize the error for array nested items', () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'must NOT have fewer than 4 characters',
            name: 'minLength',
            params: { limit: 4 },
            property: '.1.foo',
            schemaPath: '#/items/properties/foo/minLength',
            stack: '.1.foo must NOT have fewer than 4 characters',
            title: '',
          },
        ]);
      });

      it('should denote the error in the array nested item', () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll('.rjsf-field-string');

        // Initial render no longer does live validation
        expect(fieldNodes[1].classList.contains('rjsf-field-error')).eql(false);
        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        act(() => {
          fireEvent.change(fieldNodes[1].querySelector('input'), {
            target: { value: 'bad' },
          });
        });

        const liNodes = fieldNodes[1].querySelectorAll('.error-detail li');
        const errors = [].map.call(liNodes, (li) => li.textContent);
        expect(fieldNodes[1].classList.contains('rjsf-field-error')).eql(true);
        expect(errors).eql(['must NOT have fewer than 4 characters']);
      });
    });

    describe('schema dependencies, live validation', () => {
      const schema = {
        type: 'object',
        properties: {
          branch: {
            type: 'number',
            enum: [1, 2, 3],
            default: 1,
          },
        },
        required: ['branch'],
        dependencies: {
          branch: {
            oneOf: [
              {
                properties: {
                  branch: {
                    enum: [1],
                  },
                  field1: {
                    type: 'number',
                  },
                },
                required: ['field1'],
              },
              {
                properties: {
                  branch: {
                    enum: [2],
                  },
                  field1: {
                    type: 'number',
                  },
                  field2: {
                    type: 'number',
                  },
                },
                required: ['field1', 'field2'],
              },
            ],
          },
        },
      };

      it('should only show error for property in selected branch', () => {
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
        });

        act(() => {
          Simulate.change(node.querySelector('input[type=number]'), {
            target: { value: 'not a number' },
          });
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            errorSchema: { field1: { __errors: ['must be number'] } },
          },
          'root',
        );
      });

      it('should only show errors for properties in selected branch', () => {
        const { node, onChange } = createFormComponent({
          ref: createRef(),
          schema,
          liveValidate: true,
          formData: { branch: 2 },
        });

        act(() => {
          Simulate.change(node.querySelector('input[type=number]'), {
            target: { value: 'not a number' },
          });
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            errorSchema: {
              field1: {
                __errors: ['must be number'],
              },
              field2: {
                __errors: ["must have required property 'field2'"],
              },
            },
          },
          'root_field1',
        );
      });

      it('should not show any errors when branch is empty', () => {
        const { node, onChange } = createFormComponent({
          ref: createRef(),
          schema,
          liveValidate: true,
          formData: { branch: 3 },
        });

        act(() => {
          fireEvent.change(node.querySelector('select'), {
            target: { value: 3 },
          });
        });

        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            errorSchema: {},
          },
          'root_branch',
        );
      });
    });

    describe('customValidate errors, live validation', () => {
      it('customValidate should raise an error when End is larger than Start field.', () => {
        let schema = {
          required: ['Start', 'End'],
          properties: {
            Start: {
              type: 'number',
            },
            End: {
              type: 'number',
            },
          },
          type: 'object',
        };

        // customValidate method to raise an error when Start is larger than End field.
        const customValidate = (formData, errors) => {
          if (formData['Start'] > formData['End']) {
            errors['Start']?.addError('Validate error: Test should be LE than End');
          }
          return errors;
        };

        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
          formData: { Start: 2, End: 0 },
          customValidate,
        });

        // live validate does not run on initial render anymore
        expect(node.querySelectorAll('#root_Start__error')).to.have.length(0);

        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        let endInput = node.querySelector('#root_End');
        act(() => {
          fireEvent.change(endInput, {
            target: { value: 1 },
          });
        });
        expect(node.querySelectorAll('#root_Start__error')).to.have.length(1);
        let errorMessageContent = node.querySelector('#root_Start__error .text-danger').textContent;
        expect(errorMessageContent).to.contain('Validate error: Test should be LE than End');

        // Change the End field to a larger value than Start field to remove customValidate raised errors.
        act(() => {
          fireEvent.change(endInput, {
            target: { value: 3 },
          });
        });

        expect(node.querySelectorAll('#root_Start__error')).to.have.length(0);
        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            errorSchema: {},
            errors: [],
          },
          'root',
        );

        // Change the End field to a lesser value than Start field to raise customValidate errors.
        act(() => {
          fireEvent.change(endInput, {
            target: { value: 0 },
          });
        });

        expect(node.querySelectorAll('#root_Start__error')).to.have.length(1);
        errorMessageContent = node.querySelector('#root_Start__error .text-danger').textContent;
        expect(errorMessageContent).to.contain('Validate error: Test should be LE than End');
        sinon.assert.calledWithMatch(
          onChange.lastCall,
          {
            errorSchema: {
              Start: {
                __errors: ['Validate error: Test should be LE than End'],
              },
            },
          },
          'root',
        );
      });
    });
  });

  describe('Schema and formData updates', () => {
    // https://github.com/rjsf-team/react-jsonschema-form/issues/231
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };

    it('should replace state when props remove formData keys', () => {
      const formData = { foo: 'foo', bar: 'bar' };
      const { comp, node, onChange } = createFormComponent({
        ref: createRef(),
        schema,
        formData,
      });

      setProps(comp, {
        onChange,
        schema: {
          type: 'object',
          properties: {
            bar: { type: 'string' },
          },
        },
        formData: { bar: 'bar' },
      });

      fireEvent.change(node.querySelector('#root_bar'), {
        target: { value: 'baz' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { bar: 'baz' },
        },
        'root_bar',
      );
    });

    it('should replace state when props change formData keys', () => {
      const formData = { foo: 'foo', bar: 'bar' };
      const { comp, node, onChange } = createFormComponent({
        ref: createRef(),
        schema,
        formData,
      });

      setProps(comp, {
        onChange,
        schema: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            baz: { type: 'string' },
          },
        },
        formData: { foo: 'foo', baz: 'bar' },
      });

      fireEvent.change(node.querySelector('#root_baz'), {
        target: { value: 'baz' },
      });

      sinon.assert.calledWithMatch(
        onChange.lastCall,
        {
          formData: { foo: 'foo', baz: 'baz' },
        },
        'root_baz',
      );
    });
  });
  describe('Form disable prop', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', bar: 'bar' };

    it('should enable all items', () => {
      const { node } = createFormComponent({ schema, formData });

      expect(node.querySelectorAll('input:disabled')).to.have.length.of(0);
    });

    it('should disable all items', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        disabled: true,
      });

      expect(node.querySelectorAll('input:disabled')).to.have.length.of(2);
    });

    it('should disable the submit button', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        disabled: true,
      });

      expect(node.querySelector("button[type='submit']")).to.exist;
      expect(node.querySelector("button[type='submit']:disabled")).to.exist;
    });

    it('disabling the submit button via ui:schema - ui:submitButtonOptions props is still possible', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        uiSchema: { 'ui:submitButtonOptions': { props: { disabled: true } } },
      });

      expect(node.querySelector("button[type='submit']")).to.exist;
      expect(node.querySelector("button[type='submit']:disabled")).to.exist;
    });

    it('disabling the submit button via ui:schema - ui:options, submitButtonOptions props is still possible', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        uiSchema: { 'ui:options': { submitButtonOptions: { submitText: 'hello', props: { disabled: true } } } },
      });

      expect(node.querySelector("button[type='submit']")).to.exist;
      expect(node.querySelector("button[type='submit']").textContent).to.eql('hello');
      expect(node.querySelector("button[type='submit']:disabled")).to.exist;
    });

    it('if both ui:submitButtonProps and the main form disabled props are provided, and either of them are true, the button will be disabled', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        uiSchema: { 'ui:submitButtonOptions': { props: { disabled: false } } },
        disabled: true,
      });

      expect(node.querySelector("button[type='submit']")).to.exist;
      expect(node.querySelector("button[type='submit']:disabled")).to.exist;
    });

    it('if both ui:submitButtonProps and the main form disabled props are provided, but false, then submit button will not be disabled', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        uiSchema: { 'ui:submitButtonOptions': { props: { disabled: false } } },
        disabled: false,
      });

      expect(node.querySelector("button[type='submit']")).to.exist;
      expect(node.querySelector("button[type='submit']:disabled")).not.to.exist;
    });
  });

  describe('Form readonly prop', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'object', properties: { baz: { type: 'string' } } },
      },
    };
    const formData = { foo: 'foo', bar: { baz: 'baz' } };

    it('should not have any readonly items', () => {
      const { node } = createFormComponent({ schema, formData });

      expect(node.querySelectorAll('input:read-only')).to.have.length.of(0);
    });

    it('should readonly all items', () => {
      const { node } = createFormComponent({
        schema,
        formData,
        readonly: true,
      });

      expect(node.querySelectorAll('input:read-only')).to.have.length.of(2);
    });
  });

  describe('Attributes', () => {
    const formProps = {
      schema: {},
      id: 'test-form',
      className: 'test-class other-class',
      name: 'testName',
      method: 'post',
      target: '_blank',
      action: '/users/list',
      autoComplete: 'off',
      enctype: 'multipart/form-data',
      acceptCharset: 'ISO-8859-1',
      noHtml5Validate: true,
    };

    let node;

    beforeEach(() => {
      node = createFormComponent(formProps).node;
    });

    it('should set attr id of form', () => {
      expect(node.getAttribute('id')).eql(formProps.id);
    });

    it('should set attr class of form', () => {
      expect(node.getAttribute('class')).eql(formProps.className);
    });

    it('should set attr name of form', () => {
      expect(node.getAttribute('name')).eql(formProps.name);
    });

    it('should set attr method of form', () => {
      expect(node.getAttribute('method')).eql(formProps.method);
    });

    it('should set attr target of form', () => {
      expect(node.getAttribute('target')).eql(formProps.target);
    });

    it('should set attr action of form', () => {
      expect(node.getAttribute('action')).eql(formProps.action);
    });

    it('should set attr enctype of form', () => {
      expect(node.getAttribute('enctype')).eql(formProps.enctype);
    });

    it('should set attr acceptCharset of form', () => {
      expect(node.getAttribute('accept-charset')).eql(formProps.acceptCharset);
    });

    it('should set attr novalidate of form', () => {
      expect(node.getAttribute('novalidate')).not.to.be.null;
    });
  });

  describe('Custom format updates, live validation', () => {
    it('Should update custom formats when customFormats is changed', () => {
      const formProps = {
        ref: createRef(),
        liveValidate: true,
        formData: {
          areaCode: '123455',
        },
        schema: {
          type: 'object',
          properties: {
            areaCode: {
              type: 'string',
              format: 'area-code',
            },
          },
        },
        uiSchema: {
          areaCode: {
            'ui:widget': 'area-code',
          },
        },
        widgets: {
          'area-code': () => <div id='custom' />,
        },
      };

      const customValidator = customizeValidator({
        customFormats: {
          'area-code': /^\d{3}$/,
        },
      });

      const { comp, node, onError } = createFormComponent(formProps);

      submitForm(node);
      sinon.assert.notCalled(onError);

      setProps(comp, {
        ...formProps,
        onError,
        validator: customValidator,
      });

      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          message: 'must match format "area-code"',
          name: 'format',
          params: { format: 'area-code' },
          property: '.areaCode',
          schemaPath: '#/properties/areaCode/format',
          stack: '.areaCode must match format "area-code"',
          title: '',
        },
      ]);
      // We use setTimeout with a delay of 0ms to allow all asynchronous operations to complete in the React component.
      // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
    });
  });

  describe('Meta schema updates', () => {
    it('Should update allowed meta schemas when additionalMetaSchemas is changed', () => {
      const formProps = {
        ref: createRef(),
        schema: {
          $schema: 'http://json-schema.org/draft-06/schema#',
          type: 'string',
          minLength: 8,
          pattern: 'd+',
        },
        formData: 'short',
      };

      const { comp, node, onError } = createFormComponent(formProps);

      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          stack: 'no schema with key or ref "http://json-schema.org/draft-06/schema#"',
        },
      ]);

      const customValidator = customizeValidator({
        additionalMetaSchemas: [require('ajv/lib/refs/json-schema-draft-06.json')],
      });

      setProps(comp, {
        ...formProps,
        onError,
        validator: customValidator,
      });

      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          message: 'must NOT have fewer than 8 characters',
          name: 'minLength',
          params: { limit: 8 },
          property: '',
          schemaPath: '#/minLength',
          stack: 'must NOT have fewer than 8 characters',
          title: '',
        },
        {
          message: 'must match pattern "d+"',
          name: 'pattern',
          params: { pattern: 'd+' },
          property: '',
          schemaPath: '#/pattern',
          stack: 'must match pattern "d+"',
          title: '',
        },
      ]);
    });
  });

  describe('Changing the tagName', () => {
    it('should render the component using the custom tag name', () => {
      const tagName = 'span';
      const { node } = createFormComponent({ schema: {}, tagName });
      expect(node.tagName).eql(tagName.toUpperCase());
    });

    it('should render the component using a ComponentType', () => {
      const Component = (props) => <div {...props} id='test' />;
      const { node } = createFormComponent({ schema: {}, tagName: Component });
      expect(node.id).eql('test');
    });
  });

  describe('Nested forms', () => {
    it('should call provided submit handler with form state', () => {
      const innerOnSubmit = sandbox.spy();
      const outerOnSubmit = sandbox.spy();
      let innerRef;

      class ArrayTemplateWithForm extends Component {
        constructor(props) {
          super(props);
          innerRef = createRef();
        }

        render() {
          const innerFormProps = {
            validator,
            schema: {},
            onSubmit: innerOnSubmit,
          };

          return (
            <Portal>
              <div className='array' ref={innerRef}>
                <Form {...innerFormProps}>
                  <button className='array-form-submit' type='submit'>
                    Submit
                  </button>
                </Form>
              </div>
            </Portal>
          );
        }
      }

      const outerFormProps = {
        schema: {
          type: 'array',
          title: 'my list',
          description: 'my description',
          items: { type: 'string' },
        },
        formData: ['foo', 'bar'],
        templates: { ArrayFieldTemplate: ArrayTemplateWithForm },
        onSubmit: outerOnSubmit,
      };
      createFormComponent(outerFormProps);
      const arrayForm = innerRef.current.querySelector('form');
      const arraySubmit = arrayForm.querySelector('.array-form-submit');

      act(() => {
        arraySubmit.click();
      });

      sinon.assert.calledOnce(innerOnSubmit);
      sinon.assert.notCalled(outerOnSubmit);
    });
  });

  describe('Dependencies', () => {
    it('should not give a validation error by duplicating enum values in dependencies', () => {
      const schema = {
        title: 'A registration form',
        description: 'A simple form example.',
        type: 'object',
        properties: {
          type1: {
            type: 'string',
            title: 'Type 1',
            enum: ['FOO', 'BAR', 'BAZ'],
          },
          type2: {
            type: 'string',
            title: 'Type 2',
            enum: ['GREEN', 'BLUE', 'RED'],
          },
        },
        dependencies: {
          type1: {
            properties: {
              type1: {
                enum: ['FOO'],
              },
              type2: {
                enum: ['GREEN'],
              },
            },
          },
        },
      };
      const formData = {
        type1: 'FOO',
      };
      const { node, onError } = createFormComponent({ schema, formData });
      fireEvent.submit(node);
      sinon.assert.notCalled(onError);
    });
    it('should show dependency defaults for uncontrolled components', () => {
      const schema = {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
        },
        dependencies: {
          firstName: {
            properties: {
              lastName: { type: 'string', default: 'Norris' },
            },
          },
        },
      };
      const { node } = createFormComponent({ schema });

      fireEvent.change(node.querySelector('#root_firstName'), {
        target: { value: 'Chuck' },
      });
      expect(node.querySelector('#root_lastName').value).eql('Norris');
    });
  });
});

describe('Live validation onBlur', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  const schema = {
    type: 'string',
    minLength: 8,
  };

  it('does not occur during onChange, no errors produced', () => {
    const onBlur = sinon.spy();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    fireEvent.change(node.querySelector('input[type=text]'), {
      target: { value: 'short' },
    });
    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: 'short',
        errorSchema: {},
      },
      'root',
    );

    sinon.assert.notCalled(onBlur);
  });

  it('occurs during onBlur, onChange not called during blur due to no state update', () => {
    const onBlur = sinon.spy();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    const element = node.querySelector('input[type=text]');
    fireEvent.change(element, {
      target: { value: 'longenough' },
    });
    sinon.assert.calledOnce(onChange);
    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: 'longenough',
        errorSchema: {},
      },
      'root',
    );

    fireEvent.blur(element);

    sinon.assert.calledWithMatch(onBlur.lastCall, 'root', 'longenough');
    sinon.assert.calledOnce(onChange);
  });

  it('occurs during onBlur, onChange called during blur with errors due to a state update', () => {
    const onBlur = sinon.spy();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    const element = node.querySelector('input[type=text]');
    fireEvent.change(element, {
      target: { value: 'short' },
    });
    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: 'short',
        errorSchema: {},
      },
      'root',
    );
    sinon.assert.calledOnce(onChange);

    fireEvent.blur(element);

    sinon.assert.calledWithMatch(onBlur.lastCall, 'root', 'short');
    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: 'short',
        errorSchema: {
          __errors: ['must NOT have fewer than 8 characters'],
        },
      },
      'root',
    );
    sinon.assert.calledTwice(onChange);
  });
});

describe('omitExtraData and live omit onBlur', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  const schema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      bar: { type: 'string' },
    },
  };
  const formData = { foo: 'foo', bar: 'bar' };
  const formData1 = { foo: 'foo', bar: 'bar', baz: 'baz' };

  it('does not occur during onChange, no extra data removed', () => {
    const onBlur = sinon.spy();
    const { node, onChange } = createFormComponent({
      schema,
      formData: formData1,
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });

    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: '' },
    });
    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { ...formData1, foo: undefined },
      },
      'root_foo',
    );

    sinon.assert.notCalled(onBlur);
  });

  it('occurs during onBlur, onChange not called during blur due to no state update', () => {
    const onBlur = sinon.spy();
    const { node, onChange } = createFormComponent({
      schema,
      formData, // Use form data with nothing to omit to test case
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });
    const element = node.querySelector('input[type=text]');
    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: '' },
    });
    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: 'foo' },
    });
    sinon.assert.calledTwice(onChange);

    fireEvent.blur(element);

    sinon.assert.calledWithMatch(onBlur.lastCall, 'root', 'foo');
    sinon.assert.calledTwice(onChange);
  });

  it('occurs during onBlur, onChange called during blur due to extra data removal in state', () => {
    const onBlur = sinon.spy();
    const { node, onChange } = createFormComponent({
      schema,
      formData: formData1,
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });
    const element = node.querySelector('input[type=text]');
    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: '' },
    });
    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { ...formData1, foo: undefined },
      },
      'root',
    );
    sinon.assert.calledOnce(onChange);

    fireEvent.blur(element);

    sinon.assert.calledWithMatch(onBlur.lastCall, 'root', '');
    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { bar: 'bar', foo: undefined },
      },
      'root',
    );
    sinon.assert.calledTwice(onChange);
  });
});

describe('Form omitExtraData and liveOmit', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  it('should call omitExtraData when the omitExtraData prop is true and liveOmit is true', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };
    const formData = {
      foo: 'bar',
    };
    const onChange = sandbox.spy();
    const omitExtraData = true;
    const liveOmit = true;

    const { node, comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onChange,
      omitExtraData,
      liveOmit,
    });

    sandbox.stub(comp.ref.current, 'omitExtraData').returns({
      foo: '',
    });

    fireEvent.change(node.querySelector('[type=text]'), {
      target: { value: 'new' },
    });

    sinon.assert.calledOnce(comp.ref.current.omitExtraData);
  });

  it('should not call omitExtraData when the omitExtraData prop is true and liveOmit is unspecified', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };
    const formData = {
      foo: 'bar',
    };
    const onChange = sandbox.spy();
    const omitExtraData = true;
    const { node, comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onChange,
      omitExtraData,
    });

    sandbox.stub(comp.ref.current, 'omitExtraData').returns({
      foo: '',
    });

    fireEvent.change(node.querySelector('[type=text]'), {
      target: { value: 'new' },
    });

    sinon.assert.notCalled(comp.ref.current.omitExtraData);
  });

  it('should not omit data on change with omitExtraData=false and liveOmit=false', () => {
    const omitExtraData = false;
    const liveOmit = false;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: 'foobar' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'foobar', baz: 'baz' },
      },
      'root_foo',
    );
  });

  it('should not omit data on change with omitExtraData=true and liveOmit=false', () => {
    const omitExtraData = true;
    const liveOmit = false;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: 'foobar' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'foobar', baz: 'baz' },
      },
      'root_foo',
    );
  });

  it('should not omit data on change with omitExtraData=false and liveOmit=true', () => {
    const omitExtraData = false;
    const liveOmit = true;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: 'foobar' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'foobar', baz: 'baz' },
      },
      'root_foo',
    );
  });

  it('should omit data on change with omitExtraData=true and liveOmit=true', () => {
    const omitExtraData = true;
    const liveOmit = true;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: 'foobar' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'foobar' },
      },
      'root_foo',
    );
  });

  it('should not omit additionalProperties on change with omitExtraData=true and liveOmit=true', () => {
    const omitExtraData = true;
    const liveOmit = true;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
        add: {
          type: 'object',
          additionalProperties: {},
        },
      },
    };
    const formData = { foo: 'foo', baz: 'baz', add: { prop: 123 } };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    fireEvent.change(node.querySelector('#root_foo'), {
      target: { value: 'foobar' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { foo: 'foobar', add: { prop: 123 } },
      },
      'root_foo',
    );
  });

  it('should rename formData key if key input is renamed in a nested object with omitExtraData=true and liveOmit=true', () => {
    const { node, onChange } = createFormComponent(
      {
        schema: {
          type: 'object',
          properties: {
            nested: {
              additionalProperties: { type: 'string' },
            },
          },
        },
        formData: { nested: { key1: 'value' } },
      },
      { omitExtraData: true, liveOmit: true },
    );

    const textNode = node.querySelector('#root_nested_key1-key');
    fireEvent.blur(textNode, {
      target: { value: 'key1new' },
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: { nested: { key1new: 'value' } },
      },
      'root_nested',
    );
  });

  it('should allow oneOf data entry with omitExtraData=true and liveOmit=true', () => {
    const { node, onChange } = createFormComponent(
      {
        schema: {
          type: 'object',
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
                  type: 'string',
                },
              },
              required: ['ipsum'],
            },
          ],
        },
        formData: { lorum: '' },
      },
      { omitExtraData: true, liveOmit: true },
    );

    const textNode = node.querySelector('#root_lorem');
    fireEvent.change(textNode, {
      target: { value: '12' },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { lorem: '12' },
    });
  });

  it('should allow anyOf data entry with omitExtraData=true and liveOmit=true', () => {
    const { node, onChange } = createFormComponent(
      {
        schema: {
          type: 'object',
          anyOf: [
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
                  type: 'string',
                },
              },
              required: ['ipsum'],
            },
          ],
        },
        formData: { ipsum: '' },
      },
      { omitExtraData: true, liveOmit: true },
    );

    const textNode = node.querySelector('#root_ipsum');
    fireEvent.change(textNode, {
      target: { value: '12' },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { ipsum: '12' },
    });
  });

  it('should keep schema errors when extraErrors set after submit and liveValidate is false', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      required: ['foo'],
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    };

    const onSubmit = sinon.spy();

    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
      onSubmit,
      liveValidate: false,
    };
    const event = { type: 'submit' };
    const { comp, node } = createFormComponent(props);
    act(() => {
      fireEvent.submit(node, event);
    });
    expect(node.querySelectorAll('.error-detail li')).to.have.length.of(1);

    setProps(comp, {
      ...props,
      extraErrors,
    });

    setTimeout(() => {
      expect(node.querySelectorAll('.error-detail li')).to.have.length.of(2);
    }, 0);
    // We use setTimeout with a delay of 0ms to allow all asynchronous operations to complete in the React component.
    // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
  });
});

describe('omitExtraData on submit', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('should call omitExtraData when the omitExtraData prop is true', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };
    const formData = {
      foo: '',
    };
    const onSubmit = sandbox.spy();
    const onError = sandbox.spy();
    const omitExtraData = true;
    const { comp, node } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onSubmit,
      onError,
      omitExtraData,
    });

    sandbox.stub(comp.ref.current, 'omitExtraData').returns({
      foo: '',
    });

    fireEvent.submit(node);

    sinon.assert.calledOnce(comp.ref.current.omitExtraData);
  });

  it('Should call validateFormWithFormData with the current formData if omitExtraData is false', () => {
    const omitExtraData = false;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
      formData,
      omitExtraData: omitExtraData,
    };
    const { comp, node } = createFormComponent(props);
    sandbox.stub(comp.ref.current, 'validateFormWithFormData').returns({
      foo: '',
    });
    fireEvent.submit(node);
    sinon.assert.calledWithMatch(comp.ref.current.validateFormWithFormData, formData);
  });

  it('Should call validateFormWithFormData with a new formData with only used fields if omitExtraData is true', () => {
    const omitExtraData = true;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
      formData,
      omitExtraData: omitExtraData,
    };
    const { comp, node } = createFormComponent(props);
    sandbox.stub(comp.ref.current, 'validateFormWithFormData').returns({
      foo: '',
    });
    fireEvent.submit(node);
    sinon.assert.calledWithMatch(comp.ref.current.validateFormWithFormData, { foo: 'bar' });
  });
});

describe('getUsedFormData', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('should just return the single input form value', () => {
    const schema = {
      title: 'A single-field form',
      type: 'string',
    };
    const formData = 'foo';
    const onSubmit = sandbox.spy();
    const { comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onSubmit,
    });

    const result = comp.ref.current.getUsedFormData(formData, []);
    expect(result).eql('foo');
  });

  it('should return the root level array', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'string',
      },
    };
    const formData = [];
    const onSubmit = sandbox.spy();
    const { comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onSubmit,
    });

    const result = comp.ref.current.getUsedFormData(formData, []);
    expect(result).eql([]);
  });

  it('should call getUsedFormData with data from fields in event', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = {
      foo: 'bar',
    };
    const onSubmit = sandbox.spy();
    const formRef = createRef();
    const { comp } = createFormComponent({
      ref: formRef,
      schema,
      formData,
      onSubmit,
    });

    const result = comp.ref.current.getUsedFormData(formData, ['foo']);
    expect(result).eql({ foo: 'bar' });
  });

  it('unused form values should be omitted', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'string' },
        list: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
    };

    const formData = {
      foo: 'bar',
      baz: 'buzz',
      list: [
        { title: 'title0', details: 'details0' },
        { title: 'title1', details: 'details1' },
      ],
    };
    const onSubmit = sandbox.spy();
    const { comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onSubmit,
    });

    const result = comp.ref.current.getUsedFormData(formData, ['foo', 'list.0.title', 'list.1.details']);
    expect(result).eql({
      foo: 'bar',
      list: [{ title: 'title0' }, { details: 'details1' }],
    });
  });
});

describe('getFieldNames()', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('should return an empty array for a single input form', () => {
    const schema = {
      type: 'string',
    };

    const formData = 'foo';

    const onSubmit = sandbox.spy();
    const { comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onSubmit,
    });

    const pathSchema = {
      $name: '',
    };

    const fieldNames = comp.ref.current.getFieldNames(pathSchema, formData);
    expect(fieldNames).eql([]);
  });

  it('should get field names from pathSchema', () => {
    const schema = {};

    const formData = {
      extra: {
        foo: 'bar',
      },
      level1: {
        level2: 'test',
        anotherThing: {
          anotherThingNested: 'abc',
          extra: 'asdf',
          anotherThingNested2: 0,
        },
        stringArray: ['scobochka'],
      },
      level1a: 1.23,
    };

    const onSubmit = sandbox.spy();
    const { comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onSubmit,
    });

    const pathSchema = {
      $name: '',
      level1: {
        $name: 'level1',
        level2: { $name: 'level1.level2' },
        anotherThing: {
          $name: 'level1.anotherThing',
          anotherThingNested: {
            $name: 'level1.anotherThing.anotherThingNested',
          },
          anotherThingNested2: {
            $name: 'level1.anotherThing.anotherThingNested2',
          },
        },
        stringArray: {
          $name: 'level1.stringArray',
        },
      },
      level1a: {
        $name: 'level1a',
      },
    };

    const fieldNames = comp.ref.current.getFieldNames(pathSchema, formData);
    expect(fieldNames.sort()).eql(
      [
        ['level1', 'anotherThing', 'anotherThingNested'],
        ['level1', 'anotherThing', 'anotherThingNested2'],
        ['level1', 'level2'],
        ['level1', 'stringArray'],
        ['level1a'],
      ].sort(),
    );
  });

  it('should get field marked as additionalProperties', () => {
    const schema = {};

    const formData = {
      extra: {
        foo: 'bar',
      },
      level1: {
        level2: 'test',
        extra: 'foo',
        mixedMap: {
          namedField: 'foo',
          key1: 'val1',
        },
      },
      level1a: 1.23,
    };

    const onSubmit = sandbox.spy();
    const { comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onSubmit,
    });

    const pathSchema = {
      $name: '',
      level1: {
        $name: 'level1',
        level2: { $name: 'level1.level2' },
        mixedMap: {
          $name: 'level1.mixedMap',
          __rjsf_additionalProperties: true,
          namedField: { $name: 'level1.mixedMap.namedField' }, // this name should not be returned, as the root object paths should be returned for objects marked with additionalProperties
        },
      },
      level1a: {
        $name: 'level1a',
      },
    };

    const fieldNames = comp.ref.current.getFieldNames(pathSchema, formData);
    expect(fieldNames.sort()).eql([['level1', 'level2'], 'level1.mixedMap', ['level1a']].sort());
  });

  it('should get field names from pathSchema with array', () => {
    const schema = {};

    const formData = {
      address_list: [
        {
          street_address: '21, Jump Street',
          city: 'Babel',
          state: 'Neverland',
        },
        {
          street_address: '1234 Schema Rd.',
          city: 'New York',
          state: 'Arizona',
        },
      ],
    };

    const onSubmit = sandbox.spy();
    const { comp } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      onSubmit,
    });

    const pathSchema = {
      $name: '',
      address_list: {
        0: {
          $name: 'address_list.0',
          city: {
            $name: 'address_list.0.city',
          },
          state: {
            $name: 'address_list.0.state',
          },
          street_address: {
            $name: 'address_list.0.street_address',
          },
        },
        1: {
          $name: 'address_list.1',
          city: {
            $name: 'address_list.1.city',
          },
          state: {
            $name: 'address_list.1.state',
          },
          street_address: {
            $name: 'address_list.1.street_address',
          },
        },
      },
    };

    const fieldNames = comp.ref.current.getFieldNames(pathSchema, formData);
    expect(fieldNames.sort()).eql(
      [
        ['address_list', '0', 'city'],
        ['address_list', '0', 'state'],
        ['address_list', '0', 'street_address'],
        ['address_list', '1', 'city'],
        ['address_list', '1', 'state'],
        ['address_list', '1', 'street_address'],
      ].sort(),
    );
  });
});

describe('Async errors', () => {
  it('should render the async errors', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        candy: {
          type: 'object',
          properties: {
            bar: { type: 'string' },
          },
        },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['some error that got added as a prop'],
      },
      candy: {
        bar: {
          __errors: ['some other error that got added as a prop'],
        },
      },
    };

    const { node } = createFormComponent({ schema, extraErrors });

    expect(node.querySelectorAll('.error-detail li')).to.have.length.of(2);
  });

  it('should not block form submission', () => {
    const onSubmit = sinon.spy();
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['some error that got added as a prop'],
      },
    };

    const { node } = createFormComponent({ schema, extraErrors, onSubmit });
    fireEvent.submit(node);
    sinon.assert.calledOnce(onSubmit);
  });

  it('should reset when props extraErrors changes and noValidate is true', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    };

    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
      noValidate: true,
    };

    const { comp } = createFormComponent({
      ...props,
      extraErrors,
    });

    setProps(comp, {
      ...props,
      extraErrors: {},
    });

    setTimeout(() => {
      expect(comp.ref.current.state.errorSchema).eql({});
      expect(comp.ref.current.state.errors).eql([]);
    }, 0);
    // We use setTimeout with a delay of 0ms to allow all asynchronous operations to complete in the React component.
    // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
  });

  it('should reset when props extraErrors changes and liveValidate is false', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    };

    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
      liveValidate: false,
    };
    const { comp } = createFormComponent({
      ...props,
      extraErrors,
    });

    setProps(comp, {
      ...props,
      ref: comp.ref,
      extraErrors: {},
    });

    setTimeout(() => {
      expect(comp.ref.current.state.errorSchema).eql({});
      expect(comp.ref.current.state.errors).eql([]);
    }, 0);
    // We use setTimeout with a delay of 0ms to allow all asynchronous operations to complete in the React component.
    // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
  });

  it('should reset when schema changes', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      required: ['foo'],
    };

    const { comp, node } = createFormComponent({
      ref: createRef(),
      schema,
    });

    act(() => {
      fireEvent.submit(node);
    });

    expect(comp.ref.current.state.errorSchema).eql({ foo: { __errors: ["must have required property 'foo'"] } });
    expect(comp.ref.current.state.errors).eql([
      {
        message: "must have required property 'foo'",
        property: 'foo',
        name: 'required',
        params: {
          missingProperty: 'foo',
        },
        schemaPath: '#/required',
        stack: "must have required property 'foo'",
        title: '',
      },
    ]);

    // Changing schema to reset errors state.
    setProps(comp, {
      ref: comp.ref,
      schema: {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      },
    });
    expect(comp.ref.current.state.errorSchema).eql({});
    expect(comp.ref.current.state.errors).eql([]);
  });
});

describe('Calling onChange right after updating a Form with props formData', () => {
  const schema = {
    type: 'array',
    items: {
      type: 'string',
    },
  };

  let changed = false;
  class ArrayThatTriggersOnChangeRightAfterUpdated extends Component {
    componentDidUpdate = () => {
      if (changed) {
        return;
      }
      changed = true;
      this.props.onChange('test', [this.props.formData.length]);
    };
    render() {
      const { ArrayField } = this.props.registry.fields;
      return <ArrayField {...this.props} />;
    }
  }

  const uiSchema = {
    'ui:field': ArrayThatTriggersOnChangeRightAfterUpdated,
  };

  const props = {
    schema,
    uiSchema,
    validator,
  };

  class Container extends Component {
    constructor(props) {
      super(props);
      this.state = {};
    }

    onChange = ({ formData }) => {
      this.setState({ formData });
    };

    render() {
      return <Form {...this.props} {...this.state} onChange={this.onChange} />;
    }
  }

  it("doesn't cause a race condition", () => {
    const { node } = createComponent(Container, { ...props });

    fireEvent.click(node.querySelector('.rjsf-array-item-add button'));

    expect(node.querySelector('#root_0')).to.exist;
    expect(node.querySelector('#root_1').getAttribute('value')).to.eq('test');
  });
});

describe('Calling reset from ref object', () => {
  it('Reset API test', () => {
    const schema = {
      title: 'Test form',
      type: 'string',
    };
    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
    };
    const { node } = createFormComponent(props);
    expect(formRef.current.reset).to.exist;
    expect(node.querySelector('input')).to.exist;
    fireEvent.change(node.querySelector('input'), { target: { value: 'Some Value' } });
    act(() => {
      formRef.current.reset();
    });
    expect(node.querySelector('input').getAttribute('value')).to.eq('');
  });

  it('Clear errors', () => {
    const schema = {
      title: 'Test form',
      type: 'number',
    };
    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
    };
    const { node, comp } = createFormComponent(props);
    expect(formRef.current.reset).to.exist;
    expect(node.querySelector('input')).to.exist;
    fireEvent.change(node.querySelector('input'), { target: { value: 'Some Value' } });
    expect(comp.ref.current.state.errors).to.have.length(0);
    act(() => {
      fireEvent.submit(node);
    });
    expect(comp.ref.current.state.errors).to.have.length(1);
    expect(node.querySelector('.errors')).to.exist;
    act(() => {
      formRef.current.reset();
    });
    expect(node.querySelector('.errors')).not.to.exist;
    expect(node.querySelector('input').getAttribute('value')).to.eq('');
    expect(comp.ref.current.state.errors).to.have.length(0);
  });

  it('Reset button test with default value', () => {
    const schemaWithDefault = {
      title: 'Test form',
      type: 'string',
      default: 'Some-Value',
    };
    const formRef = createRef();
    const props = {
      ref: formRef,
      schema: schemaWithDefault,
    };
    const { node } = createFormComponent(props);
    const input = node.querySelector('input');
    expect(formRef.current.reset).to.exist;
    expect(input).to.exist;
    expect(input.getAttribute('value')).to.eq('Some-Value');
    act(() => {
      formRef.current.reset();
    });
    expect(input.getAttribute('value')).to.eq('Some-Value');
    fireEvent.change(input, { target: { value: 'Changed value' } });
    act(() => {
      formRef.current.reset();
    });
    expect(input.getAttribute('value')).to.eq('Some-Value');
  });

  it('Reset button test with complex schema', () => {
    const schema = widgetsSchema;
    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
    };
    const { node } = createFormComponent(props);
    const checkbox = node.querySelector('input[type="checkbox"]');
    const input = node.querySelector('input[type="text"]');
    expect(formRef.current.reset).to.exist;
    expect(checkbox).to.exist;
    expect(input).to.exist;
    expect(checkbox.checked).to.eq(true);
    expect(input.getAttribute('value')).to.eq('');
    act(() => {
      formRef.current.reset();
    });
    expect(checkbox.checked).to.eq(true);
    expect(input.getAttribute('value')).to.eq('');
    fireEvent.click(checkbox);
    fireEvent.change(input, { target: { value: 'Changed value' } });
    expect(checkbox.checked).to.eq(false);
    expect(input.getAttribute('value')).to.eq('Changed value');
    act(() => {
      formRef.current.reset();
    });
    expect(input.getAttribute('value')).to.eq('');
    expect(checkbox.checked).to.eq(true);
  });

  it('Reset button test with initialFormData', () => {
    const schemaWithDefault = {
      title: 'Test form',
      type: 'string',
    };
    const formRef = createRef();
    const props = {
      ref: formRef,
      initialFormData: 'foo',
      schema: schemaWithDefault,
    };
    const { node } = createFormComponent(props);
    const input = node.querySelector('input');
    expect(formRef.current.reset).to.exist;
    expect(input).to.exist;
    expect(input.getAttribute('value')).to.eq(props.initialFormData);
    fireEvent.change(input, { target: { value: 'Changed value' } });
    expect(input.getAttribute('value')).to.eq('Changed value');
    act(() => {
      formRef.current.reset();
    });
    expect(input.getAttribute('value')).to.eq(props.initialFormData);
  });
});

describe('validateForm()', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('Should call validateFormWithFormData with the current formData if omitExtraData is false', () => {
    const omitExtraData = false;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
      formData,
      omitExtraData: omitExtraData,
    };
    const { comp } = createFormComponent(props);
    sandbox.stub(comp.ref.current, 'validateFormWithFormData').returns({
      foo: '',
    });
    act(() => {
      comp.ref.current.validateForm();
    });
    sinon.assert.calledWithMatch(comp.ref.current.validateFormWithFormData, formData);
  });

  it('Should call validateFormWithFormData with a new formData with only used fields if omitExtraData is true', () => {
    const omitExtraData = true;
    const schema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef();
    const props = {
      ref: formRef,
      schema,
      formData,
      omitExtraData: omitExtraData,
    };
    const { comp } = createFormComponent(props);
    sandbox.stub(comp.ref.current, 'validateFormWithFormData').returns({
      foo: '',
    });
    act(() => {
      comp.ref.current.validateForm();
    });
    sinon.assert.calledWithMatch(comp.ref.current.validateFormWithFormData, { foo: 'bar' });
  });

  it('Should update state when data updated from invalid to valid', () => {
    const ref = createRef();
    const props = {
      schema: {
        type: 'object',
        required: ['input'],
        properties: {
          input: {
            type: 'string',
          },
        },
      },
      formData: {},
      ref,
    };
    const { comp, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current.validateForm()).to.eql(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].textContent).to.be.eql("must have required property 'input'");

    // populate the input and simulate a re-render from the parent.
    const textNode = node.querySelector('#root_input');
    fireEvent.change(textNode, {
      target: { value: 'populated value' },
    });
    setProps(comp, { ...props, formData: { input: 'populated value' } });
    // // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).to.have.lengthOf(0);

    // trigger programmatic validation again and make sure the error disappears.
    act(() => {
      expect(ref.current.validateForm()).to.eql(true);
    });
    errors = node.querySelectorAll('.error-detail');
    expect(errors).to.have.lengthOf(0);
  });
});

describe('setFieldValue()', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('Sets root to value using ""', () => {
    const ref = createRef();
    const props = {
      schema: {
        type: 'string',
      },
      formData: {},
      ref,
    };
    const { onChange, node } = createFormComponent(props);
    // populate the input
    act(() => {
      ref.current.setFieldValue('', 'populated value');
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: 'populated value',
      },
      'root',
    );

    expect(node.querySelector('input').value).to.eql('populated value');
  });
  it('Sets root to value using []', () => {
    const ref = createRef();
    const props = {
      schema: {
        type: 'string',
      },
      formData: {},
      ref,
    };
    const { onChange, node } = createFormComponent(props);
    // populate the input
    act(() => {
      ref.current.setFieldValue([], 'populated value');
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: 'populated value',
      },
      'root',
    );

    expect(node.querySelector('input').value).to.eql('populated value');
  });
  it('Sets field to new value via dotted path', () => {
    const ref = createRef();
    const props = {
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            required: ['input'],
            properties: {
              input: {
                type: 'string',
              },
            },
          },
        },
        required: ['foo'],
      },
      formData: {},
      ref,
      liveValidate: true,
    };
    const { onChange, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current.validateForm()).to.eql(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].textContent).to.be.eql("must have required property 'input'");

    // populate the input
    act(() => {
      ref.current.setFieldValue('foo.input', 'populated value');
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          foo: {
            input: 'populated value',
          },
        },
      },
      'root_foo_input',
    );

    // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).to.have.lengthOf(0);
  });
  it('Sets field to new value via field path list', () => {
    const ref = createRef();
    const props = {
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            required: ['input'],
            properties: {
              input: {
                type: 'string',
              },
            },
          },
        },
        required: ['foo'],
      },
      formData: {},
      ref,
      liveValidate: true,
    };
    const { onChange, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current.validateForm()).to.eql(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].textContent).to.be.eql("must have required property 'input'");

    // populate the input
    act(() => {
      ref.current.setFieldValue(['foo', 'input'], 'populated value');
    });

    sinon.assert.calledWithMatch(
      onChange.lastCall,
      {
        formData: {
          foo: {
            input: 'populated value',
          },
        },
      },
      'root_foo_input',
    );

    // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).to.have.lengthOf(0);
  });
});

describe('optionalDataControls', () => {
  const schema = {
    title: 'test',
    properties: {
      nestedObjectOptional: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
          },
        },
      },
      nestedArrayOptional: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  };
  const arrayOnUiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['array'],
    },
  };
  const objectOnUiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['object'],
    },
  };
  const bothOnUiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['object', 'array'],
    },
  };
  const experimental_defaultFormStateBehavior = {
    // Set the emptyObjectFields to only populate required defaults to highlight the code working
    emptyObjectFields: 'populateRequiredDefaults',
  };
  const arrayId = 'root_nestedArrayOptional';
  const objectId = 'root_nestedObjectOptional';
  const arrayControlAddId = optionalControlsId(arrayId, 'Add');
  const arrayControlRemoveId = optionalControlsId(arrayId, 'Remove');
  const arrayControlMsgId = optionalControlsId(arrayId, 'Msg');
  const arrayAddId = buttonId(arrayId, 'add');
  const objectControlAddId = optionalControlsId(objectId, 'Add');
  const objectControlRemoveId = optionalControlsId(objectId, 'Remove');
  const objectControlMsgId = optionalControlsId(objectId, 'Msg');
  it('does not render any optional data control messages when not turned on and readonly and disabled', () => {
    const props = {
      schema,
      experimental_defaultFormStateBehavior,
      readonly: true,
      disabled: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(msgArrayControlNode).eql(null);
    expect(addArrayBtn).not.eql(null);
    expect(addObjectControlNode).eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(msgObjectControlNode).eql(null);
    expect(testInput).not.eql(null);
  });
  it('renders optional data control messages when turned on and readonly', () => {
    const props = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
      readonly: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(msgArrayControlNode).not.eql(null);
    expect(addArrayBtn).eql(null);
    expect(addObjectControlNode).eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(msgObjectControlNode).not.eql(null);
    expect(testInput).eql(null);
  });
  it('renders optional data control messages when turned on and readonly', () => {
    const props = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
      disabled: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(msgArrayControlNode).not.eql(null);
    expect(addArrayBtn).eql(null);
    expect(addObjectControlNode).eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(msgObjectControlNode).not.eql(null);
    expect(testInput).eql(null);
  });
  it('does not render any optional data controls when not turned on', () => {
    const props = {
      schema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(addArrayBtn).not.eql(null);
    expect(addObjectControlNode).eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(testInput).not.eql(null);
  });
  it('only render object optional data controls when only object is turned on', () => {
    const props = {
      schema,
      uiSchema: objectOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    let addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    let removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    let testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(addArrayBtn).not.eql(null);
    expect(addObjectControlNode).not.eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(testInput).eql(null);

    // now click on the add optional data button
    act(() => addObjectControlNode.click());
    // now check to see if the UI adjusted
    addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addObjectControlNode).eql(null);
    expect(removeObjectControlNode).not.eql(null);
    expect(testInput).not.eql(null);

    // now click on the remove optional data button
    act(() => removeObjectControlNode.click());
    // now check to see if the UI adjusted
    addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addObjectControlNode).not.eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(testInput).eql(null);
  });
  it('only render array optional data controls when only array is turned on', () => {
    const props = {
      schema,
      uiSchema: arrayOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    let addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    let removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    let addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).not.eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(addArrayBtn).eql(null);
    expect(addObjectControlNode).eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(testInput).not.eql(null);

    // now click on the add optional data button
    act(() => addArrayControlNode.click());
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    expect(addArrayControlNode).eql(null);
    expect(removeArrayControlNode).not.eql(null);
    expect(addArrayBtn).not.eql(null);

    // now click on the remove optional data button
    act(() => removeArrayControlNode.click());
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    expect(addArrayControlNode).not.eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(addArrayBtn).eql(null);
  });
  it('render both kinds of optional data controls when only both are turned on', () => {
    const props = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    let addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    let removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    let addArrayBtn = node.querySelector(`#${arrayAddId}`);
    let addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    let removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    let testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).not.eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(addArrayBtn).eql(null);
    expect(addObjectControlNode).not.eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(testInput).eql(null);

    // now click on the add optional data button
    act(() => addArrayControlNode.click());
    act(() => addObjectControlNode.click());
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addArrayControlNode).eql(null);
    expect(removeArrayControlNode).not.eql(null);
    expect(addArrayBtn).not.eql(null);
    expect(addObjectControlNode).eql(null);
    expect(removeObjectControlNode).not.eql(null);
    expect(testInput).not.eql(null);

    // now click on the remove optional data button
    act(() => removeArrayControlNode.click());
    act(() => removeObjectControlNode.click());
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    addObjectControlNode = node.querySelector(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addArrayControlNode).not.eql(null);
    expect(removeArrayControlNode).eql(null);
    expect(addArrayBtn).eql(null);
    expect(addObjectControlNode).not.eql(null);
    expect(removeObjectControlNode).eql(null);
    expect(testInput).eql(null);
  });
});

describe('nameGenerator', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  it('should generate bracket notation names for simple fields', () => {
    const schema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const firstNameInput = node.querySelector('#root_firstName');
    const lastNameInput = node.querySelector('#root_lastName');

    expect(firstNameInput.getAttribute('name')).eql('root[firstName]');
    expect(lastNameInput.getAttribute('name')).eql('root[lastName]');
  });

  it('should generate dot notation names for simple fields', () => {
    const schema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: dotNotationNameGenerator });

    const firstNameInput = node.querySelector('#root_firstName');
    const lastNameInput = node.querySelector('#root_lastName');

    expect(firstNameInput.getAttribute('name')).eql('root.firstName');
    expect(lastNameInput.getAttribute('name')).eql('root.lastName');
  });

  it('should generate bracket notation names for nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const firstNameInput = node.querySelector('#root_person_firstName');
    const streetInput = node.querySelector('#root_person_address_street');
    const cityInput = node.querySelector('#root_person_address_city');

    expect(firstNameInput.getAttribute('name')).eql('root[person][firstName]');
    expect(streetInput.getAttribute('name')).eql('root[person][address][street]');
    expect(cityInput.getAttribute('name')).eql('root[person][address][city]');
  });

  it('should generate bracket notation names for array items', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };
    const formData = {
      tags: ['foo', 'bar'],
    };
    const { node } = createFormComponent({ schema, formData, nameGenerator: bracketNameGenerator });

    const firstTagInput = node.querySelector('#root_tags_0');
    const secondTagInput = node.querySelector('#root_tags_1');

    expect(firstTagInput.getAttribute('name')).eql('root[tags][0]');
    expect(secondTagInput.getAttribute('name')).eql('root[tags][1]');
  });

  it('should generate bracket notation names for array of objects', () => {
    const schema = {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              done: { type: 'boolean' },
            },
          },
        },
      },
    };
    const formData = {
      tasks: [
        { title: 'Task 1', done: false },
        { title: 'Task 2', done: true },
      ],
    };
    const { node } = createFormComponent({ schema, formData, nameGenerator: bracketNameGenerator });

    const firstTaskTitleInput = node.querySelector('#root_tasks_0_title');
    const firstTaskDoneInput = node.querySelector('#root_tasks_0_done');
    const secondTaskTitleInput = node.querySelector('#root_tasks_1_title');
    const secondTaskDoneInput = node.querySelector('#root_tasks_1_done');

    expect(firstTaskTitleInput.getAttribute('name')).eql('root[tasks][0][title]');
    expect(firstTaskDoneInput.getAttribute('name')).eql('root[tasks][0][done]');
    expect(secondTaskTitleInput.getAttribute('name')).eql('root[tasks][1][title]');
    expect(secondTaskDoneInput.getAttribute('name')).eql('root[tasks][1][done]');
  });

  it('should generate bracket notation names for select widgets', () => {
    const schema = {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          enum: ['red', 'green', 'blue'],
        },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const selectInput = node.querySelector('#root_color');
    expect(selectInput.getAttribute('name')).eql('root[color]');
  });

  it('should generate bracket notation names for radio widgets', () => {
    const schema = {
      type: 'object',
      properties: {
        option: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      },
    };
    const uiSchema = {
      option: {
        'ui:widget': 'radio',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const radioInputs = node.querySelectorAll('input[type="radio"]');
    expect(radioInputs[0].getAttribute('name')).eql('root[option]');
    expect(radioInputs[1].getAttribute('name')).eql('root[option]');
  });

  it('should generate bracket notation names for checkboxes widgets', () => {
    const schema = {
      type: 'object',
      properties: {
        choices: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['foo', 'bar', 'baz'],
          },
          uniqueItems: true,
        },
      },
    };
    const uiSchema = {
      choices: {
        'ui:widget': 'checkboxes',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const checkboxInputs = node.querySelectorAll('input[type="checkbox"]');
    // Checkboxes for multi-value fields have [] appended to indicate multiple values
    expect(checkboxInputs[0].getAttribute('name')).eql('root[choices][]');
    expect(checkboxInputs[1].getAttribute('name')).eql('root[choices][]');
    expect(checkboxInputs[2].getAttribute('name')).eql('root[choices][]');
  });

  it('should generate bracket notation names for textarea widgets', () => {
    const schema = {
      type: 'object',
      properties: {
        description: { type: 'string' },
      },
    };
    const uiSchema = {
      description: {
        'ui:widget': 'textarea',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const textareaInput = node.querySelector('#root_description');
    expect(textareaInput.getAttribute('name')).eql('root[description]');
  });

  it('should use default id if nameGenerator is not provided', () => {
    const schema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema });

    const firstNameInput = node.querySelector('#root_firstName');
    expect(firstNameInput.getAttribute('name')).eql('root_firstName');
  });

  it('should handle nameGenerator with number fields', () => {
    const schema = {
      type: 'object',
      properties: {
        age: { type: 'number' },
        count: { type: 'integer' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const ageInput = node.querySelector('#root_age');
    const countInput = node.querySelector('#root_count');

    expect(ageInput.getAttribute('name')).eql('root[age]');
    expect(countInput.getAttribute('name')).eql('root[count]');
  });

  it('should handle nameGenerator with boolean fields', () => {
    const schema = {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const activeInput = node.querySelector('#root_active');
    expect(activeInput.getAttribute('name')).eql('root[active]');
  });
});

describe('initialFormData feature to prevent form reset', () => {
  const schema = {
    title: 'Reset Example',
    properties: {
      name: { type: 'string', title: 'Name' },
    },
  };
  const data = { name: 'initial_id' };
  /** This was adapted from the [example](https://playcode.io/2038613) provided in issue #391
   */
  const FormWrapper = ({ formData, initialFormData }) => {
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = () => {
      setIsPending(true);
      setTimeout(() => setIsPending(false), 3000);
    };

    const props = {
      ...(formData !== undefined && { formData }),
    };

    return (
      <Form
        initialFormData={initialFormData}
        schema={schema}
        validator={validator}
        onSubmit={handleSubmit}
        disabled={isPending}
        {...props}
      />
    );
  };
  it('show that Form resets without initial data when it is controlled', () => {
    const { container } = render(<FormWrapper formData={data} />);
    let input = container.querySelector('input');
    expect(input.value).to.eql(data.name);

    fireEvent.change(input, {
      target: { value: 'new value' },
    });
    input = container.querySelector('input');
    expect(input.value).to.eql('new value');

    const submit = container.querySelector('button');
    act(() => {
      fireEvent.click(submit);
    });

    input = container.querySelector('input');
    expect(input.value).to.eql(data.name);
  });
  it('show that Form does not reset with initialFormData when it is uncontrolled', () => {
    const { container } = render(<FormWrapper initialFormData={data} />);
    let input = container.querySelector('input');
    expect(input.value).to.eql(data.name);

    fireEvent.change(input, {
      target: { value: 'new value' },
    });
    input = container.querySelector('input');
    expect(input.value).to.eql('new value');

    const submit = container.querySelector('button');
    act(() => {
      fireEvent.click(submit);
    });

    input = container.querySelector('input');
    expect(input.value).to.eql('new value');
  });
});
