import React from 'react';
import { Simulate } from 'react-dom/test-utils';
import { cleanup } from 'react-testing-library';

import { createFormComponent } from './test_utils';

describe('NumberField', () => {
  afterEach(cleanup);

  describe('TextWidget', () => {
    it('should render a string field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number'
        }
      });

      expect(node.querySelectorAll('.field input[type=text]')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          title: 'foo'
        }
      });

      expect(node.querySelector('.field label').textContent).toEqual('foo');
    });

    it('should render a string field with a description', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          description: 'bar'
        }
      });

      expect(node.querySelector('.field-description').textContent).toEqual(
        'bar'
      );
    });

    it('should default state value to undefined', () => {
      const { getInstance } = createFormComponent({
        schema: { type: 'number' }
      });

      expect(getInstance().state.formData).toEqual(undefined);
    });

    it('should assign a default value', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          default: 2
        }
      });

      expect(node.querySelector('.field input').value).toEqual('2');
    });

    it('should handle a change event', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'number'
        }
      });

      Simulate.change(node.querySelector('input'), {
        target: { value: '2' }
      });

      expect(getInstance().state.formData).toEqual(2);
    });

    it('should handle a blur event', () => {
      const onBlur = jest.fn();
      const { node } = createFormComponent({
        schema: {
          type: 'number'
        },
        onBlur
      });

      const input = node.querySelector('input');
      Simulate.blur(input, {
        target: { value: '2' }
      });

      /**
       * Does it should return a number or a string?
       */
      expect(onBlur).toHaveBeenCalledWith(input.id, '2');
    });

    it('should handle a focus event', () => {
      const onFocus = jest.fn();
      const { node } = createFormComponent({
        schema: {
          type: 'number'
        },
        onFocus
      });

      const input = node.querySelector('input');
      Simulate.focus(input, {
        target: { value: '2' }
      });

      /**
       * Does it should return a number or a string?
       */
      expect(onFocus).toHaveBeenCalledWith(input.id, '2');
    });

    it('should fill field with data', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number'
        },
        formData: 2
      });

      expect(node.querySelector('.field input').value).toEqual('2');
    });

    it('should not cast the input as a number if it ends with a dot', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'number'
        }
      });

      Simulate.change(node.querySelector('input'), {
        target: { value: '2.' }
      });

      expect(getInstance().state.formData).toEqual('2.');
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number'
        }
      });

      expect(node.querySelector('input[type=text]').id).toEqual('root');
    });

    it('should render with trailing zeroes', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number'
        }
      });

      Simulate.change(node.querySelector('input'), {
        target: { value: '2.' }
      });
      expect(node.querySelector('.field input').value).toEqual('2.');

      Simulate.change(node.querySelector('input'), {
        target: { value: '2.0' }
      });
      expect(node.querySelector('.field input').value).toEqual('2.0');

      Simulate.change(node.querySelector('input'), {
        target: { value: '2.00' }
      });
      expect(node.querySelector('.field input').value).toEqual('2.00');

      Simulate.change(node.querySelector('input'), {
        target: { value: '2.000' }
      });
      expect(node.querySelector('.field input').value).toEqual('2.000');
    });

    it('should render customized StringField', () => {
      const CustomStringField = () => <div id="custom" />;

      const { node } = createFormComponent({
        schema: {
          type: 'number'
        },
        fields: {
          StringField: CustomStringField
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('SelectWidget', () => {
    it('should render a number field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2]
        }
      });

      expect(node.querySelectorAll('.field select')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
          title: 'foo'
        }
      });

      expect(node.querySelector('.field label').textContent).toEqual('foo');
    });

    it('should assign a default value', () => {
      const { getInstance } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2],
          default: 1
        }
      });

      expect(getInstance().state.formData).toEqual(1);
    });

    it('should handle a change event', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2]
        }
      });

      Simulate.change(node.querySelector('select'), {
        target: { value: '2' }
      });

      expect(getInstance().state.formData).toEqual(2);
    });

    it('should fill field with data', () => {
      const { getInstance } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2]
        },
        formData: 2
      });

      expect(getInstance().state.formData).toEqual(2);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          enum: [1, 2]
        }
      });

      expect(node.querySelector('select').id).toEqual('root');
    });
  });
});
