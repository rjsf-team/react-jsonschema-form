import React from 'react';
import { Simulate } from 'react-dom/test-utils';
import { fireEvent, cleanup } from 'react-testing-library';

import { parseDateString, toDateString } from 'react-jsonschema-form/src/utils';
import { utcToLocal } from 'react-jsonschema-form-bootstrap/src/components/widgets/DateTimeWidget';

import { createFormComponent } from './test_utils';

describe('StringField', () => {
  const CustomWidget = () => <div id="custom" />;

  afterEach(cleanup);

  describe('TextWidget', () => {
    it('should render a string field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string'
        }
      });

      expect(node.querySelectorAll('.field input[type=text]')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          title: 'foo'
        }
      });

      expect(node.querySelector('.field label').textContent).toEqual('foo');
    });

    it('should render a string field with a description', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          description: 'bar'
        }
      });

      expect(node.querySelector('.field-description').textContent).toEqual(
        'bar'
      );
    });

    it('should assign a default value', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          default: 'plop'
        }
      });

      expect(node.querySelector('.field input').value).toEqual('plop');
    });

    it('should default state value to undefined', () => {
      const { getInstance } = createFormComponent({
        schema: { type: 'string' }
      });

      expect(getInstance().state.formData).toEqual(undefined);
    });

    it('should handle a change event', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string'
        }
      });
      const input = node.querySelector('input');

      input.value = 'yo';
      fireEvent.change(input);

      expect(getInstance().state.formData).toEqual('yo');
    });

    it('should handle a blur event', () => {
      const onBlur = jest.fn();
      const { node } = createFormComponent({
        schema: {
          type: 'string'
        },
        onBlur
      });
      const input = node.querySelector('input');

      input.value = 'yo';
      fireEvent.blur(input);

      expect(onBlur).toHaveBeenCalledWith(input.id, 'yo');
    });

    it('should handle a focus event', () => {
      const onFocus = jest.fn();
      const { node } = createFormComponent({
        schema: {
          type: 'string'
        },
        onFocus
      });
      const input = node.querySelector('input');

      input.value = 'yo';
      fireEvent.focus(input);

      expect(onFocus).toHaveBeenCalledWith(input.id, 'yo');
    });

    it('should handle an empty string change event', () => {
      const { getInstance, node } = createFormComponent({
        schema: { type: 'string' },
        formData: 'x'
      });
      const input = node.querySelector('input');

      input.value = '';
      fireEvent.change(input);

      expect(getInstance().state.formData).toEqual(undefined);
    });

    it('should handle an empty string change event with custom ui:defaultValue', () => {
      const { getInstance, node } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: { 'ui:emptyValue': 'default' },
        formData: 'x'
      });
      const input = node.querySelector('input');

      input.value = '';
      fireEvent.change(input);

      expect(getInstance().state.formData).toEqual('default');
    });

    it('should fill field with data', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string'
        },
        formData: 'plip'
      });

      expect(node.querySelector('.field input').value).toEqual('plip');
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string'
        }
      });

      expect(node.querySelector('input[type=text]').id).toEqual('root');
    });

    it('should render customized TextWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string'
        },
        widgets: {
          TextWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('SelectWidget', () => {
    it('should render a string field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar']
        }
      });

      expect(node.querySelectorAll('.field select')).toHaveLength(1);
    });

    it('should render a string field for an enum without a type', () => {
      const { node } = createFormComponent({
        schema: {
          enum: ['foo', 'bar']
        }
      });

      expect(node.querySelectorAll('.field select')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
          title: 'foo'
        }
      });

      expect(node.querySelector('.field label').textContent).toEqual('foo');
    });

    it('should render empty option', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar']
        }
      });

      expect(node.querySelectorAll('.field option')[0].value).toEqual('');
    });

    it('should render empty option with placeholder text', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar']
        },
        uiSchema: {
          'ui:options': {
            placeholder: 'Test'
          }
        }
      });

      expect(node.querySelectorAll('.field option')[0].textContent).toEqual(
        'Test'
      );
    });

    it('should assign a default value', () => {
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
          default: 'bar'
        }
      });

      expect(getInstance().state.formData).toEqual('bar');
    });

    it('should reflect the change into the form state', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar']
        }
      });
      const select = node.querySelector('select');

      select.value = 'foo';
      fireEvent.change(select);

      expect(getInstance().state.formData).toEqual('foo');
    });

    it('should reflect undefined into form state if empty option selected', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar']
        }
      });
      const select = node.querySelector('select');

      select.value = '';
      fireEvent.change(select);

      expect(getInstance().state.formData).toBeUndefined();
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar']
        }
      });
      const select = node.querySelector('select');

      select.value = 'foo';
      fireEvent.change(select);

      expect(select.value).toEqual('foo');
    });

    it('should reflect undefined value into the dom as empty option', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar']
        }
      });
      const select = node.querySelector('select');

      select.value = '';
      fireEvent.change(select);

      expect(select.value).toEqual('');
    });

    it('should fill field with data', () => {
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar']
        },
        formData: 'bar'
      });

      expect(getInstance().state.formData).toEqual('bar');
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['a', 'b']
        }
      });

      expect(node.querySelector('select').id).toEqual('root');
    });

    it('should render customized SelectWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: []
        },
        widgets: {
          SelectWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('TextareaWidget', () => {
    it('should handle an empty string change event', () => {
      const { getInstance, node } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: { 'ui:widget': 'textarea' },
        formData: 'x'
      });
      const textarea = node.querySelector('textarea');

      textarea.value = '';
      fireEvent.change(textarea);

      expect(getInstance().state.formData).toEqual(undefined);
    });

    it('should handle an empty string change event with custom ui:defaultValue', () => {
      const { getInstance, node } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: {
          'ui:widget': 'textarea',
          'ui:emptyValue': 'default'
        },
        formData: 'x'
      });
      const textarea = node.querySelector('textarea');

      textarea.value = '';
      fireEvent.change(textarea);

      expect(getInstance().state.formData).toEqual('default');
    });

    it('should render a textarea field with rows', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: {
          'ui:widget': 'textarea',
          'ui:options': { rows: 20 }
        },
        formData: 'x'
      });

      expect(node.querySelector('textarea').getAttribute('rows')).toEqual('20');
    });
  });

  describe('DateTimeWidget', () => {
    it('should render an datetime-local field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        }
      });

      expect(
        node.querySelectorAll('.field [type=datetime-local]')
      ).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const datetime = new Date().toJSON();
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
          default: datetime
        }
      });

      expect(getInstance().state.formData).toEqual(datetime);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        }
      });

      /**
       * I don't know how to write this with fireEvent(),
       * because it doesn't work as usual input.
       */
      const datetime = node.querySelector('[type=datetime-local]');
      const newDatetime = new Date().toJSON();
      Simulate.change(datetime, { target: { value: newDatetime } });

      expect(datetime.value).toEqual(utcToLocal(newDatetime));
    });

    it('should fill field with data', () => {
      const datetime = new Date().toJSON();
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        formData: datetime
      });

      expect(getInstance().state.formData).toEqual(datetime);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        }
      });

      expect(node.querySelector('[type=datetime-local]').id).toEqual('root');
    });

    it('should reject an invalid entered datetime', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        liveValidate: true
      });

      fireEvent.change(node.querySelector('[type=datetime-local]'), {
        target: { value: 'invalid' }
      });

      expect(getInstance().state.errors).toHaveLength(1);
    });

    it('should render customized DateTimeWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        widgets: {
          DateTimeWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });

    it('should allow overriding of BaseInput', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        widgets: {
          BaseInput: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('DateWidget', () => {
    const uiSchema = { 'ui:widget': 'date' };

    it('should render a date field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema
      });

      expect(node.querySelectorAll('.field [type=date]')).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const datetime = new Date().toJSON();
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
          default: datetime
        },
        uiSchema
      });

      expect(getInstance().state.formData).toEqual(datetime);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema
      });

      const newDatetime = '2012-12-12';

      Simulate.change(node.querySelector('[type=date]'), {
        target: { value: newDatetime }
      });

      // XXX import and use conversion helper
      expect(node.querySelector('[type=date]').value).toEqual(
        newDatetime.slice(0, 10)
      );
    });

    it('should fill field with data', () => {
      const datetime = new Date().toJSON();
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        formData: datetime
      });

      expect(getInstance().state.formData).toEqual(datetime);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema
      });

      expect(node.querySelector('[type=date]').id).toEqual('root');
    });

    it('should accept a valid entered date', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema,
        liveValidate: true
      });

      Simulate.change(node.querySelector('[type=date]'), {
        target: { value: '2012-12-12' }
      });

      expect(getInstance().state.errors).toHaveLength(0);
      expect(getInstance().state.formData).toEqual('2012-12-12');
    });

    it('should reject an invalid entered date', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema,
        liveValidate: true
      });

      fireEvent.change(node.querySelector('[type=date]'), {
        target: { value: 'invalid' }
      });

      expect(getInstance().state.errors).toHaveLength(1);
    });

    it('should render customized DateWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        widgets: {
          DateWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });

    it('should allow overriding of BaseInput', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        widgets: {
          BaseInput: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('AltDateTimeWidget', () => {
    const uiSchema = { 'ui:widget': 'alt-datetime' };

    it('should render a datetime field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        uiSchema
      });

      expect(node.querySelectorAll('.field select')).toHaveLength(6);
    });

    it('should render a string field with a main label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
          title: 'foo'
        },
        uiSchema
      });

      expect(node.querySelector('.field label').textContent).toEqual('foo');
    });

    it('should assign a default value', () => {
      const datetime = new Date().toJSON();
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
          default: datetime
        },
        uiSchema
      });

      expect(getInstance().state.formData).toEqual(datetime);
    });

    it('should reflect the change into the dom', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        uiSchema
      });

      Simulate.change(node.querySelector('#root_year'), {
        target: { value: 2012 }
      });
      Simulate.change(node.querySelector('#root_month'), {
        target: { value: 10 }
      });
      Simulate.change(node.querySelector('#root_day'), {
        target: { value: 2 }
      });
      Simulate.change(node.querySelector('#root_hour'), {
        target: { value: 1 }
      });
      Simulate.change(node.querySelector('#root_minute'), {
        target: { value: 2 }
      });
      Simulate.change(node.querySelector('#root_second'), {
        target: { value: 3 }
      });

      expect(getInstance().state.formData).toEqual('2012-10-02T01:02:03.000Z');
    });

    it('should fill field with data', () => {
      const datetime = new Date().toJSON();
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        formData: datetime
      });

      expect(getInstance().state.formData).toEqual(datetime);
    });

    it('should render the widgets with the expected ids', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        uiSchema
      });

      const ids = [].map.call(node.querySelectorAll('select'), node => node.id);

      expect(ids).toEqual([
        'root_year',
        'root_month',
        'root_day',
        'root_hour',
        'root_minute',
        'root_second'
      ]);
    });

    it('should render the widgets with the expected options\' values', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        uiSchema
      });

      const lengths = [].map.call(
        node.querySelectorAll('select'),
        node => node.length
      );

      expect(lengths).toEqual([
        121 + 1, // from 1900 to 2020 + undefined
        12 + 1,
        31 + 1,
        24 + 1,
        60 + 1,
        60 + 1
      ]);
      const monthOptions = node.querySelectorAll('select#root_month option');
      const monthOptionsValues = [].map.call(monthOptions, o => o.value);
      expect(monthOptionsValues).toEqual([
        '',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12'
      ]);
    });

    it('should render the widgets with the expected options\' labels', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        uiSchema
      });

      const monthOptions = node.querySelectorAll('select#root_month option');
      const monthOptionsLabels = [].map.call(monthOptions, o => o.text);
      expect(monthOptionsLabels).toEqual([
        'month',
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        '09',
        '10',
        '11',
        '12'
      ]);
    });

    describe('Action buttons', () => {
      it('should render action buttons', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time'
          },
          uiSchema
        });

        const buttonLabels = [].map.call(
          node.querySelectorAll('a.btn'),
          x => x.textContent
        );
        expect(buttonLabels).toEqual(['Now', 'Clear']);
      });

      it('should set current date when pressing the Now button', () => {
        const { getInstance, node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time'
          },
          uiSchema
        });

        fireEvent.click(node.querySelector('a.btn-now'));

        // Test that the two DATETIMEs are within 5 seconds of each other.
        const now = new Date().getTime();
        const timeDiff = now - new Date(getInstance().state.formData).getTime();
        expect(timeDiff).toBeLessThanOrEqual(5000);
      });

      it('should clear current date when pressing the Clear button', () => {
        const { getInstance, node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time'
          },
          uiSchema
        });

        fireEvent.click(node.querySelector('a.btn-now'));
        fireEvent.click(node.querySelector('a.btn-clear'));

        expect(getInstance().state.formData).toEqual(undefined);
      });
    });

    it('should render customized AltDateWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time'
        },
        uiSchema: {
          'ui:widget': 'alt-datetime'
        },
        widgets: {
          AltDateTimeWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });

    it('should render customized AltDateTimeWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema: {
          'ui:widget': 'alt-datetime'
        },
        widgets: {
          AltDateTimeWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('AltDateWidget', () => {
    const uiSchema = { 'ui:widget': 'alt-date' };

    it('should render a date field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema
      });

      expect(node.querySelectorAll('.field select')).toHaveLength(3);
    });

    it('should render a string field with a main label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
          title: 'foo'
        },
        uiSchema
      });

      expect(node.querySelector('.field label').textContent).toEqual('foo');
    });

    it('should assign a default value', () => {
      const datetime = '2012-12-12';
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
          default: datetime
        },
        uiSchema
      });

      expect(getInstance().state.formData).toEqual(datetime);
    });

    it('should reflect the change into the dom', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema
      });

      Simulate.change(node.querySelector('#root_year'), {
        target: { value: 2012 }
      });
      Simulate.change(node.querySelector('#root_month'), {
        target: { value: 10 }
      });
      Simulate.change(node.querySelector('#root_day'), {
        target: { value: 2 }
      });

      expect(getInstance().state.formData).toEqual('2012-10-02');
    });

    it('should fill field with data', () => {
      const datetime = '2012-12-12';
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema,
        formData: datetime
      });

      expect(getInstance().state.formData).toEqual(datetime);
    });

    it('should render the widgets with the expected ids', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema
      });

      const ids = [].map.call(node.querySelectorAll('select'), node => node.id);

      expect(ids).toEqual(['root_year', 'root_month', 'root_day']);
    });

    it('should render the widgets with the expected options\' values', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema
      });

      const lengths = [].map.call(
        node.querySelectorAll('select'),
        node => node.length
      );

      expect(lengths).toEqual([
        121 + 1, // from 1900 to 2020 + undefined
        12 + 1,
        31 + 1
      ]);
      const monthOptions = node.querySelectorAll('select#root_month option');
      const monthOptionsValues = [].map.call(monthOptions, o => o.value);
      expect(monthOptionsValues).toEqual([
        '',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12'
      ]);
    });

    it('should render the widgets with the expected options\' labels', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema
      });

      const monthOptions = node.querySelectorAll('select#root_month option');
      const monthOptionsLabels = [].map.call(monthOptions, o => o.text);
      expect(monthOptionsLabels).toEqual([
        'month',
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        '09',
        '10',
        '11',
        '12'
      ]);
    });

    it('should accept a valid date', () => {
      const { getInstance, rerender } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema,
        liveValidate: true
      });

      rerender({ formData: '2012-12-12' });

      expect(getInstance().state.errors).toHaveLength(0);
    });

    describe('Action buttons', () => {
      it('should render action buttons', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date'
          },
          uiSchema
        });

        const buttonLabels = [].map.call(
          node.querySelectorAll('a.btn'),
          x => x.textContent
        );
        expect(buttonLabels).toEqual(['Now', 'Clear']);
      });

      it('should set current date when pressing the Now button', () => {
        const { getInstance, node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date'
          },
          uiSchema
        });

        fireEvent.click(node.querySelector('a.btn-now'));

        const expected = toDateString(
          parseDateString(new Date().toJSON()),
          false
        );
        expect(getInstance().state.formData).toEqual(expected);
      });

      it('should clear current date when pressing the Clear button', () => {
        const { getInstance, node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date'
          },
          uiSchema
        });

        fireEvent.click(node.querySelector('a.btn-now'));
        fireEvent.click(node.querySelector('a.btn-clear'));

        expect(getInstance().state.formData).toEqual(undefined);
      });
    });

    it('should render customized AltDateWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date'
        },
        uiSchema: {
          'ui:widget': 'alt-date'
        },
        widgets: {
          AltDateWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('EmailWidget', () => {
    it('should render an email field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email'
        }
      });

      expect(node.querySelectorAll('.field [type=email]')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
          title: 'foo'
        }
      });

      expect(node.querySelector('.field label').textContent).toEqual('foo');
    });

    it('should render a select field with a description', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
          description: 'baz'
        }
      });

      expect(node.querySelector('.field-description').textContent).toEqual(
        'baz'
      );
    });

    it('should assign a default value', () => {
      const email = 'foo@bar.baz';
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
          default: email
        }
      });

      expect(getInstance().state.formData).toEqual(email);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email'
        }
      });

      const newDatetime = new Date().toJSON();

      Simulate.change(node.querySelector('[type=email]'), {
        target: { value: newDatetime }
      });

      expect(node.querySelector('[type=email]').value).toEqual(newDatetime);
    });

    it('should fill field with data', () => {
      const email = 'foo@bar.baz';
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email'
        },
        formData: email
      });

      expect(getInstance().state.formData).toEqual(email);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email'
        }
      });

      expect(node.querySelector('[type=email]').id).toEqual('root');
    });

    it('should reject an invalid entered email', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email'
        },
        liveValidate: true
      });

      fireEvent.change(node.querySelector('[type=email]'), {
        target: { value: 'invalid' }
      });

      expect(getInstance().state.errors).toHaveLength(1);
    });

    it('should render customized EmailWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email'
        },
        widgets: {
          EmailWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('URLWidget', () => {
    it('should render an url field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri'
        }
      });

      expect(node.querySelectorAll('.field [type=url]')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
          title: 'foo'
        }
      });

      expect(node.querySelector('.field label').textContent).toEqual('foo');
    });

    it('should render a select field with a placeholder', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
          description: 'baz'
        }
      });

      expect(node.querySelector('.field-description').textContent).toEqual(
        'baz'
      );
    });

    it('should assign a default value', () => {
      const url = 'http://foo.bar/baz';
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
          default: url
        }
      });

      expect(getInstance().state.formData).toEqual(url);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri'
        }
      });

      const newDatetime = new Date().toJSON();
      Simulate.change(node.querySelector('[type=url]'), {
        target: { value: newDatetime }
      });

      expect(node.querySelector('[type=url]').value).toEqual(newDatetime);
    });

    it('should fill field with data', () => {
      const url = 'http://foo.bar/baz';
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri'
        },
        formData: url
      });

      expect(getInstance().state.formData).toEqual(url);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri'
        }
      });

      expect(node.querySelector('[type=url]').id).toEqual('root');
    });

    it('should reject an invalid entered url', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri'
        },
        liveValidate: true
      });

      fireEvent.change(node.querySelector('[type=url]'), {
        target: { value: 'invalid' }
      });

      expect(getInstance().state.errors).toHaveLength(1);
    });

    it('should render customized URLWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri'
        },
        widgets: {
          URLWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('ColorWidget', () => {
    const uiSchema = { 'ui:widget': 'color' };
    const color = '#123456';

    it('should render a color field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color'
        },
        uiSchema
      });

      expect(node.querySelectorAll('.field [type=color]')).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color',
          default: color
        },
        uiSchema
      });

      expect(getInstance().state.formData).toEqual(color);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color'
        },
        uiSchema
      });

      const newColor = '#654321';

      Simulate.change(node.querySelector('[type=color]'), {
        target: { value: newColor }
      });

      expect(node.querySelector('[type=color]').value).toEqual(newColor);
    });

    it('should fill field with data', () => {
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color'
        },
        formData: color
      });

      expect(getInstance().state.formData).toEqual(color);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color'
        },
        uiSchema
      });

      expect(node.querySelector('[type=color]').id).toEqual('root');
    });

    it('should reject an invalid entered color', () => {
      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color'
        },
        uiSchema,
        liveValidate: true
      });

      Simulate.change(node.querySelector('[type=color]'), {
        target: { value: 'invalid' }
      });

      expect(getInstance().state.errors).toHaveLength(1);
    });

    it('should render customized ColorWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color'
        },
        widgets: {
          ColorWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('FileWidget', () => {
    const initialValue = 'data:text/plain;name=file1.txt;base64,dGVzdDE=';

    it('should render a color field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url'
        }
      });

      expect(node.querySelectorAll('.field [type=file]')).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const { getInstance } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color',
          default: initialValue
        }
      });

      expect(getInstance().state.formData).toEqual(initialValue);
    });

    it('should reflect the change into the dom', async () => {
      window.FileReader = jest.fn(() => ({
        set onload(fn) {
          fn({ target: { result: 'data:text/plain;base64,x=' } });
        },
        readAsDataUrl() {}
      }));

      const { getInstance, node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url'
        }
      });

      Simulate.change(node.querySelector('[type=file]'), {
        target: {
          files: [{ name: 'file1.txt', size: 1, type: 'type' }]
        }
      });

      await new Promise(setImmediate);

      expect(getInstance().state.formData).toEqual(
        'data:text/plain;name=file1.txt;base64,x='
      );
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url'
        }
      });

      expect(node.querySelector('[type=file]').id).toEqual('root');
    });

    it('should render customized FileWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url'
        },
        widgets: {
          FileWidget: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('UpDownWidget', () => {
    it('should allow overriding of BaseInput', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          format: 'updown'
        },
        widgets: {
          BaseInput: CustomWidget
        }
      });

      expect(node.querySelector('#custom')).toBeDefined();
    });
  });

  describe('Label', () => {
    const Widget = props => <div id={`label-${props.label}`} />;

    const widgets = { Widget };

    it('should pass field name to widget if there is no title', () => {
      const schema = {
        type: 'object',
        properties: {
          string: {
            type: 'string'
          }
        }
      };
      const uiSchema = {
        string: {
          'ui:widget': 'Widget'
        }
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-string')).not.toBeNull();
    });

    it('should pass schema title to widget', () => {
      const schema = {
        type: 'string',
        title: 'test'
      };
      const uiSchema = {
        'ui:widget': 'Widget'
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-test')).not.toBeNull();
    });

    it('should pass empty schema title to widget', () => {
      const schema = {
        type: 'string',
        title: ''
      };
      const uiSchema = {
        'ui:widget': 'Widget'
      };
      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-')).not.toBeNull();
    });
  });
});
