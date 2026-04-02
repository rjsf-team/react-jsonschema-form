import { fireEvent, act } from '@testing-library/react';
import {
  parseDateString,
  toDateString,
  TranslatableString,
  utcToLocal,
  ErrorSchema,
  FieldPathList,
  FieldProps,
  RJSFSchema,
  UiSchema,
  WidgetProps,
} from '@rjsf/utils';

import StringField from '../src/components/fields/StringField';
import TextWidget from '../src/components/widgets/TextWidget';

import {
  createFormComponent,
  getSelectedOptionValue,
  submitForm,
  expectToHaveBeenCalledWithFormData,
} from './testUtils';

const mockFileReader = {
  // eslint-disable-next-line no-unused-vars
  set onload(fn: (event: { target: { result: string } }) => void) {
    fn({ target: { result: 'data:text/plain;base64,x=' } });
  },
  readAsDataURL() {
    return;
  },
} as unknown as FileReader;

function StringFieldTest(props: FieldProps) {
  const onChangeTest = (newFormData: any, path: FieldPathList, errorSchema?: ErrorSchema, id?: string) => {
    const value = newFormData;
    let raiseError = errorSchema;
    if (value !== 'test') {
      raiseError = {
        __errors: ['Value must be "test"'],
      } as ErrorSchema;
    }
    props.onChange(newFormData, path, raiseError, id);
  };
  return <StringField {...props} onChange={onChangeTest} />;
}

export function TextWidgetTest(props: WidgetProps) {
  const onChangeTest = (newFormData: any, errorSchema?: ErrorSchema, id?: string) => {
    const value = newFormData;
    let raiseError = errorSchema;
    if (value !== 'test') {
      raiseError = {
        __errors: ['Value must be "test"'],
      } as ErrorSchema;
    }
    props.onChange(newFormData, raiseError, id);
  };
  return <TextWidget {...props} onChange={onChangeTest} />;
}

describe('StringField', () => {
  const CustomWidget = () => <div id='custom' />;
  beforeAll(() => {
    jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader);
  });

  describe('TextWidget', () => {
    it('should render a string field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
        },
      });

      expect(node.querySelectorAll('.rjsf-field input[type=text]')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should render a string field with a description', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          description: 'bar',
        },
      });

      expect(node.querySelector('.field-description')).toHaveTextContent('bar');
    });

    it('should assign a default value', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          default: 'plop',
        },
      });

      expect(node.querySelector('.rjsf-field input')).toHaveValue('plop');
      expect(node.querySelectorAll('.rjsf-field datalist > option')).toHaveLength(0);
    });

    it('should render a string field with examples', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          examples: ['Firefox', 'Chrome', 'Vivaldi'],
        },
      });

      expect(node.querySelectorAll('.rjsf-field datalist > option')).toHaveLength(3);
      const datalistId = node.querySelector('.rjsf-field datalist')?.id;
      expect(node.querySelector('.rjsf-field input')).toHaveAttribute('list', datalistId);
    });

    it('should render a string with examples that includes the default value', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          default: 'Firefox',
          examples: ['Chrome', 'Vivaldi'],
        },
      });
      expect(node.querySelectorAll('.rjsf-field datalist > option')).toHaveLength(3);
      const datalistId = node.querySelector('.rjsf-field datalist')?.id;
      expect(node.querySelector('.rjsf-field input')).toHaveAttribute('list', datalistId);
    });

    it('should render a string with examples that overlaps with the default value', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          default: 'Firefox',
          examples: ['Firefox', 'Chrome', 'Vivaldi'],
        },
      });
      expect(node.querySelectorAll('.rjsf-field datalist > option')).toHaveLength(3);
      const datalistId = node.querySelector('.rjsf-field datalist')?.id;
      expect(node.querySelector('.rjsf-field input')).toHaveAttribute('list', datalistId);
    });

    it('should render without duplicate keys when examples are strings and default is a number', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'integer',
          default: 5432,
          examples: ['5432', '3306', '1433'],
        },
      });
      // Should have 3 options (not 4), since default 5432 matches example '5432'
      expect(node.querySelectorAll('.rjsf-field datalist > option')).toHaveLength(3);
      const datalistId = node.querySelector('.rjsf-field datalist')?.id;
      expect(node.querySelector('.rjsf-field input')).toHaveAttribute('list', datalistId);
    });

    it('should include default in datalist when types mismatch and values differ', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'integer',
          default: 8080,
          examples: ['5432', '3306', '1433'],
        },
      });
      // Should have 4 options (examples + default)
      expect(node.querySelectorAll('.rjsf-field datalist > option')).toHaveLength(4);
      const datalistId = node.querySelector('.rjsf-field datalist')?.id;
      expect(node.querySelector('.rjsf-field input')).toHaveAttribute('list', datalistId);
    });

    it('should default submit value to undefined', () => {
      const { node, onSubmit } = createFormComponent({
        schema: { type: 'string' },
        noValidate: true,
      });
      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, undefined, true);
    });

    it('should handle a change event', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
        },
      });

      act(() => {
        fireEvent.change(node.querySelector('input')!, {
          target: { value: 'yo' },
        });
      });

      expectToHaveBeenCalledWithFormData(onChange, 'yo', 'root');
    });

    it('should handle a blur event', () => {
      const onBlur = jest.fn();
      const { node } = createFormComponent({
        schema: {
          type: 'string',
        },
        onBlur,
      });
      const input = node.querySelector('input');
      fireEvent.blur(input!, {
        target: { value: 'yo' },
      });

      expect(onBlur).toHaveBeenLastCalledWith(input?.id, 'yo');
    });

    it('should handle a focus event', () => {
      const onFocus = jest.fn();
      const { node } = createFormComponent({
        schema: {
          type: 'string',
        },
        onFocus,
      });
      const input = node.querySelector('input');
      fireEvent.focus(input!, {
        target: { value: 'yo' },
      });

      expect(onFocus).toHaveBeenLastCalledWith(input?.id, 'yo');
    });

    it('should handle an empty string change event', () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'string' },
        formData: 'x',
      });

      fireEvent.change(node.querySelector('input')!, {
        target: { value: '' },
      });

      expectToHaveBeenCalledWithFormData(onChange, undefined, 'root');
    });

    it('should handle an empty string change event with custom ui:emptyValue', () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: { 'ui:emptyValue': 'default' },
        formData: 'x',
      });

      fireEvent.change(node.querySelector('input')!, {
        target: { value: '' },
      });

      expectToHaveBeenCalledWithFormData(onChange, 'default', 'root');
    });

    it('should handle an empty string change event with defaults set', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          default: 'a',
        },
      });

      fireEvent.change(node.querySelector('input')!, {
        target: { value: '' },
      });

      expectToHaveBeenCalledWithFormData(onChange, undefined, 'root');
    });

    it('should fill field with data', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
        },
        formData: 'plip',
      });

      expect(node.querySelector('.rjsf-field input')).toHaveValue('plip');
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
        },
      });

      expect(node.querySelector('input[type=text]')).toHaveAttribute('id', 'root');
    });

    it('should render customized TextWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
        },
        widgets: {
          TextWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    it('should create and set autocomplete attribute', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: { 'ui:autocomplete': 'family-name' },
        formData: undefined,
      });

      expect(node.querySelector('input')).toHaveAttribute('autocomplete', 'family-name');
    });

    it('Check that when formData changes, the form should re-validate', () => {
      const { node, rerender } = createFormComponent({
        schema: { type: 'string' },
        formData: null,
        liveValidate: true,
      });

      // trigger the errors by submitting the form since initial render no longer shows them
      submitForm(node);

      const errorMessages = node.querySelectorAll('#root__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('must be string');

      rerender({ schema: { type: 'string' }, formData: 'hello', liveValidate: true });

      expect(node.querySelectorAll('#root__error')).toHaveLength(0);
    });

    it('raise an error and check if the error is displayed', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        fields: {
          StringField: StringFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      const errorMessages = node.querySelectorAll('#root__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('Value must be "test"');
    });

    it('should not raise an error if value is correct', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        fields: {
          StringField: StringFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      const errorMessages = node.querySelectorAll('#root__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('should clear an error if value is entered correctly', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        fields: {
          StringField: StringFieldTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      let errorMessages = node.querySelectorAll('#root__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('Value must be "test"');

      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      errorMessages = node.querySelectorAll('#root__error');
      expect(errorMessages).toHaveLength(0);
    });

    it('raise an error and check if the error is displayed using custom text widget', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        widgets: {
          TextWidget: TextWidgetTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'hello' } });
      });

      const errorMessages = node.querySelectorAll('#root__error');
      expect(errorMessages).toHaveLength(1);
      const errorMessageContent = node.querySelector('#root__error .text-danger');
      expect(errorMessageContent).toHaveTextContent('Value must be "test"');
    });

    it('should not raise an error if value is correct using custom text widget', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        widgets: {
          TextWidget: TextWidgetTest,
        },
      });

      const inputs = node.querySelectorAll('.rjsf-field-string input[type=text]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'test' } });
      });

      const errorMessages = node.querySelectorAll('#root__error');
      expect(errorMessages).toHaveLength(0);
    });
  });

  describe('SelectWidget', () => {
    it('should render a string field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
    });

    it('should render a string field for an enum without a type', () => {
      const { node } = createFormComponent({
        schema: {
          enum: ['foo', 'bar'],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should render empty option', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      });

      expect(node.querySelectorAll('.rjsf-field option')[0]).toHaveValue('');
    });

    it('should render empty option with placeholder text', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
        uiSchema: {
          'ui:options': {
            placeholder: 'Test',
          },
        },
      });

      expect(node.querySelectorAll('.rjsf-field option')[0]).toHaveTextContent('Test');
    });

    it('should assign a default value', () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
          default: 'bar',
        },
      });

      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, 'bar', true);
    });

    it('should reflect the change in the change event', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      });
      act(() => {
        fireEvent.change(node.querySelector('select')!, {
          target: { value: 0 }, // use index
        });
      });
      expectToHaveBeenCalledWithFormData(onChange, 'foo', 'root');
    });

    it('should reflect undefined in change event if empty option selected', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      });

      act(() => {
        fireEvent.change(node.querySelector('select')!, {
          target: { value: '' },
        });
      });

      expectToHaveBeenCalledWithFormData(onChange, undefined, 'root');
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      });

      act(() => {
        fireEvent.change(node.querySelector('select')!, {
          target: { value: 0 }, // use index
        });
      });

      expect(getSelectedOptionValue(node.querySelector('select')!)).toEqual('foo');
    });

    it('should reflect undefined value into the dom as empty option', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      });

      act(() => {
        fireEvent.change(node.querySelector('select')!, {
          target: { value: '' },
        });
      });

      expect(getSelectedOptionValue(node.querySelector('select')!)).toEqual('');
    });

    it('should fill field with data', () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
        formData: 'bar',
      });
      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, 'bar', true);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: ['a', 'b'],
        },
      });

      expect(node.querySelector('select')).toHaveAttribute('id', 'root');
    });

    it('should render customized SelectWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          enum: [],
        },
        widgets: {
          SelectWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    it("should render a select element with first option 'false' if the default value is false", () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            enum: [false, true],
            default: false,
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const options = node.querySelectorAll('option');
      expect(options[0]).toHaveTextContent('false');
      expect(options).toHaveLength(2);
    });

    it("should render a select element and the option's length is equal the enum's length, if set the enum and the default value is empty.", () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            enum: ['', '1'],
            default: '',
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const options = node.querySelectorAll('option');
      expect(options[0]).toHaveTextContent('');
      expect(options).toHaveLength(2);
    });

    it('should render only one empty option when the default value is empty.', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            enum: [''],
            default: '',
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const options = node.querySelectorAll('option');
      expect(options[0]).toHaveTextContent('');
      expect(options).toHaveLength(1);
    });
  });

  describe('TextareaWidget', () => {
    it('should handle an empty string change event', () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: { 'ui:widget': 'textarea' },
        formData: 'x',
      });

      act(() => {
        fireEvent.change(node.querySelector('textarea')!, {
          target: { value: '' },
        });
      });

      expectToHaveBeenCalledWithFormData(onChange, undefined, 'root');
    });

    it('should handle an empty string change event with custom ui:emptyValue', () => {
      const { node, onChange } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: {
          'ui:widget': 'textarea',
          'ui:emptyValue': 'default',
        },
        formData: 'x',
      });

      act(() => {
        fireEvent.change(node.querySelector('textarea')!, {
          target: { value: '' },
        });
      });

      expectToHaveBeenCalledWithFormData(onChange, 'default', 'root');
    });

    it('should render a textarea field with rows', () => {
      const { node } = createFormComponent({
        schema: { type: 'string' },
        uiSchema: {
          'ui:widget': 'textarea',
          'ui:options': { rows: 20 },
        },
        formData: 'x',
      });

      expect(node.querySelector('textarea')).toHaveAttribute('rows', '20');
    });
  });

  describe('DateTimeWidget', () => {
    it('should render an datetime-local field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
      });

      expect(node.querySelectorAll('.rjsf-field [type=datetime-local]')).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
          default: datetime,
        },
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, datetime, true);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
      });

      // The original test's use of Simulate to pass the UTC version to the underlying callback worked fine. Switching
      // to @testing-library/react results in the event handler not being fired due to the `datetime-local` input type
      // not accepting the trailing Z in the string, thus we remove it via utcToLocal
      const newDatetime = utcToLocal(new Date().toJSON());
      const dateNode = node.querySelector('[type=datetime-local]');

      act(() => {
        fireEvent.change(dateNode!, {
          target: { value: newDatetime },
        });
      });

      expect(dateNode).toHaveValue(newDatetime);
    });

    it('should fill field with data', () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        formData: datetime,
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, datetime, true);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
      });

      expect(node.querySelector('[type=datetime-local]')).toHaveAttribute('id', 'root');
    });

    it('should render customized DateTimeWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        widgets: {
          DateTimeWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    it('should allow overriding of BaseInputTemplate', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        templates: {
          BaseInputTemplate: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });
  });

  describe('DateWidget', () => {
    const uiSchema: UiSchema = { 'ui:widget': 'date' };

    it('should render a date field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      expect(node.querySelectorAll('.rjsf-field [type=date]')).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
          default: datetime,
        },
        uiSchema,
        noValidate: true,
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, datetime, true);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      const newDatetime = '2012-12-12';

      act(() => {
        fireEvent.change(node.querySelector('[type=date]')!, {
          target: { value: newDatetime },
        });
      });

      // XXX import and use conversion helper
      expect(node.querySelector('[type=date]')).toHaveValue(newDatetime.slice(0, 10));
    });

    it('should fill field with data', () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        formData: datetime,
        noValidate: true,
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, datetime, true);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      expect(node.querySelector('[type=date]')).toHaveAttribute('id', 'root');
    });

    it('should accept a valid entered date', () => {
      const { node, onError, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
        liveValidate: true,
      });

      act(() => {
        fireEvent.change(node.querySelector('[type=date]')!, {
          target: { value: '2012-12-12' },
        });
      });

      expect(onError).not.toHaveBeenCalled();

      expectToHaveBeenCalledWithFormData(onChange, '2012-12-12', 'root');
    });

    it('should render customized DateWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        widgets: {
          DateWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    it('should allow overriding of BaseInputTemplate', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        templates: {
          BaseInputTemplate: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });
  });

  describe('TimeWidget', () => {
    it('should render a time field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'time',
        },
      });

      expect(node.querySelectorAll('.rjsf-field [type=time]')).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const time = '01:10:00';
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'time',
          default: time,
        },
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, time, true);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'time',
        },
      });

      const newTime = '11:10';

      act(() => {
        fireEvent.change(node.querySelector('[type=time]')!, {
          target: { value: newTime },
        });
      });

      expect(node.querySelector('[type=time]')).toHaveValue(`${newTime}:00`);
    });

    it('should fill field with data', () => {
      const time = '13:10:00';
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'time',
        },
        formData: time,
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, time, true);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'time',
        },
      });

      expect(node.querySelector('[type=time]')).toHaveAttribute('id', 'root');
    });

    it('should render customized TimeWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'time',
        },
        widgets: {
          TimeWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    it('should allow overriding of BaseInputTemplate', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'time',
        },
        templates: {
          BaseInputTemplate: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });
  });

  describe('AltDateTimeWidget', () => {
    const uiSchema: UiSchema = { 'ui:widget': 'alt-datetime' };

    it('should render a datetime field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        uiSchema,
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(6);
    });

    it('should render a string field with a main label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
          title: 'foo',
        },
        uiSchema,
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should assign a default value', () => {
      const current = new Date();
      current.setMilliseconds(0);
      const datetime = current.toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
          default: datetime,
        },
        uiSchema,
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, datetime, true);
    });

    it('should reflect the change into the dom', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        uiSchema,
      });

      act(() => {
        fireEvent.change(node.querySelector('#root_year')!, {
          target: { value: 2012 - 1900 }, // convert year to index
        });
        fireEvent.change(node.querySelector('#root_month')!, {
          target: { value: 9 }, // Month index
        });
        fireEvent.change(node.querySelector('#root_day')!, {
          target: { value: 1 }, // Day index
        });
        fireEvent.change(node.querySelector('#root_hour')!, {
          target: { value: 1 },
        });
        fireEvent.change(node.querySelector('#root_minute')!, {
          target: { value: 2 },
        });
        fireEvent.change(node.querySelector('#root_second')!, {
          target: { value: 3 },
        });
      });
      expectToHaveBeenCalledWithFormData(onChange, '2012-10-02T01:02:03.000Z', 'root');
    });

    it('should fill field with data', () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        formData: datetime,
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, datetime, true);
    });

    it('should render the widgets with the expected ids', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        uiSchema,
      });

      const ids = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.id);

      expect(ids).toEqual(['root_year', 'root_month', 'root_day', 'root_hour', 'root_minute', 'root_second']);
    });

    it("should render the widgets with the expected options' values", () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        uiSchema,
      });

      const lengths = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.length);

      expect(lengths).toEqual([
        // from 1900 to current year + 2 (inclusive) + 1 undefined option
        new Date().getFullYear() - 1900 + 3 + 1,
        12 + 1,
        31 + 1,
        24 + 1,
        60 + 1,
        60 + 1,
      ]);
      const monthOptions = node.querySelectorAll('select#root_month option');
      const monthOptionsValues = [].map.call(monthOptions, (o: HTMLOptionElement) => o.value);
      expect(monthOptionsValues).toEqual(['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
    });

    it("should render the widgets with the expected options' labels", () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        uiSchema,
      });

      const monthOptions = node.querySelectorAll('select#root_month option');
      const monthOptionsLabels = [].map.call(monthOptions, (o: HTMLOptionElement) => o.text);
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
        '12',
      ]);
    });

    describe('Action buttons', () => {
      it('should render action buttons', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time',
          },
          uiSchema,
        });

        const buttonLabels = [].map.call(node.querySelectorAll('a.btn'), (x: HTMLElement) => x.textContent);
        expect(buttonLabels).toEqual(['Now', 'Clear']);
      });

      it('should set current date when pressing the Now button', () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time',
          },
          uiSchema,
        });

        act(() => {
          fireEvent.click(node.querySelector('a.btn-now')!);
        });
        const formValue = onChange.mock.lastCall[0].formData;
        // Test that the two DATETIMEs are within 5 seconds of each other.
        const now = new Date().getTime();
        const timeDiff = now - new Date(formValue).getTime();
        expect(timeDiff).toBeLessThanOrEqual(5000);
      });

      it('should clear current date when pressing the Clear button', () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date-time',
          },
          uiSchema,
        });

        act(() => {
          fireEvent.click(node.querySelector('a.btn-now')!);
          fireEvent.click(node.querySelector('a.btn-clear')!);
        });

        expectToHaveBeenCalledWithFormData(onChange, undefined, 'root');
      });
    });

    it('should render customized AltDateWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date-time',
        },
        uiSchema: {
          'ui:widget': 'alt-datetime',
        },
        widgets: {
          AltDateTimeWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    it('should render customized AltDateTimeWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema: {
          'ui:widget': 'alt-datetime',
        },
        widgets: {
          AltDateTimeWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    describe('AltDateTimeWidget with format option', () => {
      const uiSchema: UiSchema = { 'ui:widget': 'alt-datetime', 'ui:options': { format: 'YMD' } };

      it('should render a date field with YMD format', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const ids = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.id);

        expect(ids).toEqual(['root_year', 'root_month', 'root_day', 'root_hour', 'root_minute', 'root_second']);
      });

      it('should render a date field with DMY format', () => {
        uiSchema['ui:options']!['format'] = 'DMY';
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const ids = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.id);

        expect(ids).toEqual(['root_day', 'root_month', 'root_year', 'root_hour', 'root_minute', 'root_second']);
      });

      it('should render a date field with MDY format', () => {
        uiSchema['ui:options']!['format'] = 'MDY';
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const ids = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.id);

        expect(ids).toEqual(['root_month', 'root_day', 'root_year', 'root_hour', 'root_minute', 'root_second']);
      });
    });

    describe('AltDateTimeWidget with yearsRange option', () => {
      it('should render a date field with years range from 1980-1985', () => {
        const uiSchema: UiSchema = { 'ui:widget': 'alt-datetime', 'ui:options': { yearsRange: [1980, 1985] } };
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const yearOptions = node.querySelectorAll('select#root_year option');
        const yearOptionsLabels = [].map.call(yearOptions, (o: HTMLOptionElement) => o.text);
        expect(yearOptionsLabels).toEqual(['year', '1980', '1981', '1982', '1983', '1984', '1985']);
      });
      it('should render a date field with years range from 1985-1980', () => {
        const uiSchema: UiSchema = { 'ui:widget': 'alt-datetime', 'ui:options': { yearsRange: [1985, 1980] } };
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const yearOptions = node.querySelectorAll('select#root_year option');
        const yearOptionsLabels = [].map.call(yearOptions, (o: HTMLOptionElement) => o.text);
        expect(yearOptionsLabels).toEqual(['year', '1985', '1984', '1983', '1982', '1981', '1980']);
      });
      it('should render a date field with years range from this year to 3 years ago', () => {
        const uiSchema: UiSchema = { 'ui:widget': 'alt-datetime', 'ui:options': { yearsRange: [0, -3] } };
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const thisYear = new Date().getFullYear();
        const yearOptions = node.querySelectorAll('select#root_year option');
        const yearOptionsLabels = [].map.call(yearOptions, (o: HTMLOptionElement) => o.text);
        expect(yearOptionsLabels).toEqual([
          'year',
          `${thisYear}`,
          `${thisYear - 1}`,
          `${thisYear - 2}`,
          `${thisYear - 3}`,
        ]);
      });
      it('should render a date field with years range from 3 years ago to this year ', () => {
        const uiSchema: UiSchema = { 'ui:widget': 'alt-datetime', 'ui:options': { yearsRange: [-3, 0] } };
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const thisYear = new Date().getFullYear();
        const yearOptions = node.querySelectorAll('select#root_year option');
        const yearOptionsLabels = [].map.call(yearOptions, (o: HTMLOptionElement) => o.text);
        expect(yearOptionsLabels).toEqual([
          'year',
          `${thisYear - 3}`,
          `${thisYear - 2}`,
          `${thisYear - 1}`,
          `${thisYear}`,
        ]);
      });
    });
  });

  describe('AltDateWidget', () => {
    const uiSchema: UiSchema = { 'ui:widget': 'alt-date' };

    it('should render a date field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(3);
    });

    it('should render a string field with a main label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
          title: 'foo',
        },
        uiSchema,
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should assign a default value', () => {
      const datetime = '2012-12-12';
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
          default: datetime,
        },
        uiSchema,
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, datetime, true);
    });

    it('should call the provided onChange function once all values are filled', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      act(() => {
        fireEvent.change(node.querySelector('#root_year')!, {
          target: { value: 2012 - 1900 }, // convert year to index
        });
        fireEvent.change(node.querySelector('#root_month')!, {
          target: { value: 9 }, // Month index
        });
        fireEvent.change(node.querySelector('#root_day')!, {
          target: { value: 1 }, // Day index
        });
      });
      expectToHaveBeenCalledWithFormData(onChange, '2012-10-02', 'root');
    });

    it('should reflect the change into the dom, even when not all values are filled', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      act(() => {
        fireEvent.change(node.querySelector('#root_year')!, {
          target: { value: 2012 - 1900 }, // convert year to index
        });
        fireEvent.change(node.querySelector('#root_month')!, {
          target: { value: 9 }, // Month index
        });
      });
      expect(getSelectedOptionValue(node.querySelector<HTMLSelectElement>('#root_year')!)).toEqual('2012');
      expect(getSelectedOptionValue(node.querySelector<HTMLSelectElement>('#root_month')!)).toEqual('10');
      expect(getSelectedOptionValue(node.querySelector<HTMLSelectElement>('#root_day')!)).toEqual('day');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should fill field with data', () => {
      const datetime = '2012-12-12';
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
        formData: datetime,
      });
      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, datetime, true);
    });

    it('should render the widgets with the expected ids', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      const ids = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.id);

      expect(ids).toEqual(['root_year', 'root_month', 'root_day']);
    });

    it("should render the widgets with the expected options' values", () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      const lengths = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.length);

      expect(lengths).toEqual([
        // from 1900 to current year + 2 (inclusive) + 1 undefined option
        new Date().getFullYear() - 1900 + 3 + 1,
        12 + 1,
        31 + 1,
      ]);
      const monthOptions = node.querySelectorAll('select#root_month option');
      const monthOptionsValues = [].map.call(monthOptions, (o: HTMLOptionElement) => o.value);
      expect(monthOptionsValues).toEqual(['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
    });

    it("should render the widgets with the expected options' labels", () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
      });

      const monthOptions = node.querySelectorAll('select#root_month option');
      const monthOptionsLabels = [].map.call(monthOptions, (o: HTMLOptionElement) => o.text);
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
        '12',
      ]);
    });

    it('should accept a valid date', () => {
      const { onError } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema,
        liveValidate: true,
        formData: '2012-12-12',
      });

      expect(onError).not.toHaveBeenCalled();
    });

    it('should throw on invalid date', () => {
      const mockError = jest.spyOn(console, 'error').mockImplementation();
      expect(() =>
        createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
          liveValidate: true,
          formData: '2012-1212',
        }),
      ).toThrow('Unable to parse date 2012-1212');
      mockError.mockRestore();
    });

    describe('AltDateWidget with format option', () => {
      const uiSchema: UiSchema = { 'ui:widget': 'alt-date', 'ui:options': { format: 'YMD' } };

      it('should render a date field with YMD format', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const ids = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.id);

        expect(ids).toEqual(['root_year', 'root_month', 'root_day']);
      });

      it('should render a date field with MDY format', () => {
        uiSchema['ui:options']!['format'] = 'MDY';
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const ids = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.id);

        expect(ids).toEqual(['root_month', 'root_day', 'root_year']);
      });

      it('should render a date field with DMY format', () => {
        uiSchema['ui:options']!['format'] = 'DMY';
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const ids = [].map.call(node.querySelectorAll('select'), (node: HTMLSelectElement) => node.id);

        expect(ids).toEqual(['root_day', 'root_month', 'root_year']);
      });
    });

    describe('Action buttons', () => {
      it('should render action buttons', () => {
        const { node } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        const buttonLabels = [].map.call(node.querySelectorAll('a.btn'), (x: HTMLElement) => x.textContent);
        expect(buttonLabels).toEqual(['Now', 'Clear']);
      });

      it('should set current date when pressing the Now button', () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        act(() => {
          fireEvent.click(node.querySelector('a.btn-now')!);
        });

        const expected = toDateString(parseDateString(new Date().toJSON()), false);

        expectToHaveBeenCalledWithFormData(onChange, expected, 'root');
      });

      it('should clear current date when pressing the Clear button', () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'string',
            format: 'date',
          },
          uiSchema,
        });

        act(() => {
          fireEvent.click(node.querySelector('a.btn-now')!);
          fireEvent.click(node.querySelector('a.btn-clear')!);
        });

        expectToHaveBeenCalledWithFormData(onChange, undefined, 'root');
      });
    });

    it('should render customized AltDateWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'date',
        },
        uiSchema: {
          'ui:widget': 'alt-date',
        },
        widgets: {
          AltDateWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });
  });

  describe('EmailWidget', () => {
    it('should render an email field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
        },
      });

      expect(node.querySelectorAll('.rjsf-field [type=email]')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should render a select field with a description', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
          description: 'baz',
        },
      });

      expect(node.querySelector('.field-description')).toHaveTextContent('baz');
    });

    it('should assign a default value', () => {
      const email = 'foo@bar.baz';
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
          default: email,
        },
      });

      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, email, true);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
        },
      });

      const newDatetime = new Date().toJSON();

      fireEvent.change(node.querySelector('[type=email]')!, {
        target: { value: newDatetime },
      });

      expect(node.querySelector('[type=email]')).toHaveValue(newDatetime);
    });

    it('should fill field with data', () => {
      const email = 'foo@bar.baz';
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
        },
        formData: email,
      });

      submitForm(node);
      expectToHaveBeenCalledWithFormData(onSubmit, email, true);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
        },
      });

      expect(node.querySelector('[type=email]')).toHaveAttribute('id', 'root');
    });

    it('should reject an invalid entered email', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
        },
        liveValidate: true,
      });

      fireEvent.change(node.querySelector('[type=email]')!, {
        target: { value: 'invalid' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          errorSchema: { __errors: ['must match format "email"'] },
          errors: [
            {
              message: 'must match format "email"',
              name: 'format',
              params: { format: 'email' },
              property: '',
              schemaPath: '#/format',
              stack: 'must match format "email"',
              title: '',
            },
          ],
        }),
        'root',
      );
    });

    it('should render customized EmailWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'email',
        },
        widgets: {
          EmailWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });
  });

  describe('URLWidget', () => {
    it('should render an url field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
        },
      });

      expect(node.querySelectorAll('.rjsf-field [type=url]')).toHaveLength(1);
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should render a select field with a placeholder', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
          description: 'baz',
        },
      });

      expect(node.querySelector('.field-description')).toHaveTextContent('baz');
    });

    it('should assign a default value', () => {
      const url = 'http://foo.bar/baz';
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
          default: url,
        },
      });

      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, url, true);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
        },
      });

      const newDatetime = new Date().toJSON();
      fireEvent.change(node.querySelector('[type=url]')!, {
        target: { value: newDatetime },
      });

      expect(node.querySelector('[type=url]')).toHaveValue(newDatetime);
    });

    it('should fill field with data', () => {
      const url = 'http://foo.bar/baz';
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
        },
        formData: url,
      });

      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, url, true);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
        },
      });

      expect(node.querySelector('[type=url]')).toHaveAttribute('id', 'root');
    });

    it('should reject an invalid entered url', () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
        },
        liveValidate: true,
      });

      fireEvent.change(node.querySelector('[type=url]')!, {
        target: { value: 'invalid' },
      });

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          errorSchema: { __errors: ['must match format "uri"'] },
          errors: [
            {
              message: 'must match format "uri"',
              name: 'format',
              params: { format: 'uri' },
              property: '',
              schemaPath: '#/format',
              stack: 'must match format "uri"',
              title: '',
            },
          ],
        }),
        'root',
      );
    });

    it('should render customized URLWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'uri',
        },
        widgets: {
          URLWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });
  });

  describe('ColorWidget', () => {
    const uiSchema: UiSchema = { 'ui:widget': 'color' };
    const color = '#123456';

    it('should render a color field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color',
        },
        uiSchema,
      });

      expect(node.querySelectorAll('.rjsf-field [type=color]')).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color',
          default: color,
        },
        uiSchema,
      });
      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, color, true);
    });

    it('should reflect the change into the dom', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color',
        },
        uiSchema,
      });

      const newColor = '#654321';

      act(() => {
        fireEvent.change(node.querySelector('[type=color]')!, {
          target: { value: newColor },
        });
      });

      expect(node.querySelector('[type=color]')).toHaveValue(newColor);
    });

    it('should fill field with data', () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color',
        },
        formData: color,
      });
      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, color, true);
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color',
        },
        uiSchema,
      });

      expect(node.querySelector('[type=color]')).toHaveAttribute('id', 'root');
    });

    // This test no longer works with @testing-utils/react's fireEvent since the input field does not accept
    // invalid data, unlike when `Simulate` was being used
    //
    // it('should reject an invalid entered color', () => {
    //   const { node, onChange } = createFormComponent({
    //     schema: {
    //       type: 'string',
    //       format: 'color',
    //     },
    //     uiSchema,
    //     liveValidate: true,
    //   });
    //
    //   act(() => {
    //     fireEvent.change(node.querySelector('[type=color]')!, {
    //       target: { value: 'invalid' },
    //     });
    //   });
    //
    //   expect(onChange).toHaveBeenLastCalledWith(
    //     expect.objectContaining({
    //       errorSchema: { __errors: ['must match format "color"'] },
    //       errors: [
    //         {
    //           message: 'must match format "color"',
    //           name: 'format',
    //           params: { format: 'color' },
    //           property: '',
    //           schemaPath: '#/format',
    //           stack: 'must match format "color"',
    //           title: '',
    //         },
    //       ],
    //     }),
    //     'root',
    //   );
    // });

    it('should render customized ColorWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'color',
        },
        widgets: {
          ColorWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });
  });

  describe('FileWidget', () => {
    const initialValue = 'data:text/plain;name=file1.txt;base64,dGVzdDE=';

    it('should render a file field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
      });

      expect(node.querySelectorAll('.rjsf-field [type=file]')).toHaveLength(1);
    });

    it('should assign a default value', () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
          default: initialValue,
        },
      });
      submitForm(node);

      expectToHaveBeenCalledWithFormData(onSubmit, initialValue, true);
    });

    it('should reflect the change into the dom', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
      });

      await act(() => {
        fireEvent.change(node.querySelector('[type=file]')!, {
          target: {
            files: [{ name: 'file1.txt', size: 1, type: 'type' }],
          },
        });
      });

      await new Promise(setImmediate);

      expectToHaveBeenCalledWithFormData(onChange, 'data:text/plain;name=file1.txt;base64,x=', 'root');
    });

    it('should reflect the change into the dom (multi)', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'array',
          items: {
            type: 'string',
            format: 'data-url',
          },
        },
      });

      await act(() => {
        fireEvent.change(node.querySelector('[type=file]')!, {
          target: {
            files: [{ name: 'file1.txt', size: 1, type: 'type' }],
          },
        });
      });

      await new Promise(setImmediate);

      await act(() => {
        fireEvent.change(node.querySelector('[type=file]')!, {
          target: {
            files: [{ name: 'file2.txt', size: 1, type: 'type' }],
          },
        });
      });

      await new Promise(setImmediate);

      await act(() => {
        fireEvent.change(node.querySelector('[type=file]')!, {
          target: {
            files: [{ name: 'file3.txt', size: 1, type: 'type' }],
          },
        });
      });

      await new Promise(setImmediate);

      expectToHaveBeenCalledWithFormData(
        onChange,
        [
          'data:text/plain;name=file1.txt;base64,x=',
          'data:text/plain;name=file2.txt;base64,x=',
          'data:text/plain;name=file3.txt;base64,x=',
        ],
        'root',
      );
    });

    it('should encode file name with encodeURIComponent', async () => {
      const nonUriEncodedValue = 'fileáéí óú1.txt';
      const uriEncodedValue = 'file%C3%A1%C3%A9%C3%AD%20%C3%B3%C3%BA1.txt';
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
      });

      await act(() => {
        fireEvent.change(node.querySelector('[type=file]')!, {
          target: {
            files: [{ name: nonUriEncodedValue, size: 1, type: 'type' }],
          },
        });
      });
      await new Promise(setImmediate);

      expectToHaveBeenCalledWithFormData(onChange, `data:text/plain;name=${uriEncodedValue};base64,x=`, 'root');
    });

    it('should render the file widget with accept attribute', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
        uiSchema: {
          'ui:options': { accept: '.pdf' },
        },
      });

      expect(node.querySelector('[type=file]')).toHaveAttribute('accept', '.pdf');
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
      });

      expect(node.querySelector('[type=file]')).toHaveAttribute('id', 'root');
    });

    it('should render customized FileWidget', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
        widgets: {
          FileWidget: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });

    it('should render the file widget with preview attribute', () => {
      const formData =
        'data:image/png;name=test.png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAABg2lDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AYht+mSkUqDmYQcchQnSyIijhqFYpQIdQKrTqYXPoHTRqSFBdHwbXg4M9i1cHFWVcHV0EQ/AFxdXFSdJESv0sKLWK847iH97735e47QGhUmG53jQO64VjpZELK5lalyCvCECHQjCvMNudkOYXA8XWPEN/v4jwruO7P0aflbQaEJOJZZloO8Qbx9KZjct4nFllJ0YjPiccsuiDxI9dVn984Fz0WeKZoZdLzxCKxVOxgtYNZydKJp4hjmm5QvpD1WeO8xVmv1FjrnvyF0byxssx1WsNIYhFLkCFBRQ1lVOAgTrtBio00nScC/EOeXyaXSq4yGDkWUIUOxfOD/8Hv3tqFyQk/KZoAul9c92MEiOwCzbrrfh+7bvMECD8DV0bbX20AM5+k19ta7Ajo3wYurtuaugdc7gCDT6ZiKZ4UpiUUCsD7GX1TDhi4BXrX/L61znH6AGSoV6kb4OAQGC1S9nrAu3s6+/ZvTat/PyV4cojSYDGVAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5wMUAgM6setlnQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAWSURBVAjXY/z//z8DAwMTAwMDAwMDACQGAwG9HuO6AAAAAElFTkSuQmCC';
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
        uiSchema: {
          'ui:options': { filePreview: true },
        },
        formData,
      });

      const preview = node.querySelector<HTMLImageElement>('img.file-preview');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute('src', formData);
    });

    it('should render the file widget with download link', () => {
      const formData = 'data:text/plain;name=file1.txt;base64,x=';
      const { node } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
        uiSchema: {
          'ui:options': { filePreview: true },
        },
        formData,
      });

      const download = node.querySelector<HTMLLinkElement>('a.file-download');
      expect(download).toBeInTheDocument();
      expect(download).toHaveAttribute('href', formData);
      expect(download).toHaveTextContent(TranslatableString.PreviewLabel);
    });

    it('should delete the file when delete button is pressed (single)', () => {
      const formData = 'data:text/plain;name=file1.txt;base64,x=';
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'string',
          format: 'data-url',
        },
        formData,
      });

      // Find the delete button
      const deleteButton = node.querySelector('button[title="Remove"]');
      expect(deleteButton).toBeInTheDocument();

      // Click the delete button
      act(() => {
        fireEvent.click(deleteButton!);
      });
      expectToHaveBeenCalledWithFormData(onChange, undefined, 'root');
    });
    it('should delete the file when delete button is pressed (multi)', () => {
      const formData = [
        'data:text/plain;name=file1.txt;base64,x=',
        'data:text/plain;name=file2.txt;base64,x=',
        'data:text/plain;name=file3.txt;base64,x=',
      ];
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'array',
          items: {
            type: 'string',
            format: 'data-url',
          },
        },
        formData,
      });

      // Find the 2nd file and check the file name
      const file2 = node.querySelectorAll('li')[1];
      expect(file2).toHaveTextContent('file2.txt');

      // Find the delete button and click it
      const deleteButton = file2.querySelector('button[title="Remove"]');
      expect(deleteButton).toBeInTheDocument();
      act(() => {
        fireEvent.click(deleteButton!);
      });

      // Check that the file is deleted
      expect(node.querySelectorAll('li')).toHaveLength(2);
      expectToHaveBeenCalledWithFormData(
        onChange,
        ['data:text/plain;name=file1.txt;base64,x=', 'data:text/plain;name=file3.txt;base64,x='],
        'root',
      );
    });
  });

  describe('UpDownWidget', () => {
    it('should allow overriding of BaseInputTemplate', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'number',
          format: 'updown',
        },
        templates: {
          BaseInputTemplate: CustomWidget,
        },
      });

      expect(node.querySelector('#custom')).toBeInTheDocument();
    });
  });

  describe('Label', () => {
    const Widget = (props: WidgetProps) => <div id={`label-${props.label}`} />;

    const widgets = { Widget };

    it('should pass field name to widget if there is no title', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          string: {
            type: 'string',
          },
        },
      };
      const uiSchema: UiSchema = {
        string: {
          'ui:widget': 'Widget',
        },
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-string')).not.toBeNull();
    });

    it('should pass schema title to widget', () => {
      const schema: RJSFSchema = {
        type: 'string',
        title: 'test',
      };
      const uiSchema: UiSchema = {
        'ui:widget': 'Widget',
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-test')).not.toBeNull();
    });

    it('should pass empty schema title to widget', () => {
      const schema: RJSFSchema = {
        type: 'string',
        title: '',
      };
      const uiSchema: UiSchema = {
        'ui:widget': 'Widget',
      };
      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-')).not.toBeNull();
    });
  });
});
