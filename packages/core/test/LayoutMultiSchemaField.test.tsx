import {
  ANY_OF_KEY,
  DEFAULT_KEY,
  DEFINITIONS_KEY,
  EnumOptionsType,
  ERRORS_KEY,
  ErrorSchemaBuilder,
  FieldErrorProps,
  FieldProps,
  FieldTemplateProps,
  getDiscriminatorFieldFromSchema,
  ID_KEY,
  IdSchema,
  ONE_OF_KEY,
  optionsList,
  PROPERTIES_KEY,
  RJSFSchema,
  UI_OPTIONS_KEY,
  UI_WIDGET_KEY,
  WidgetProps,
} from '@rjsf/utils';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { get } from 'lodash';

import LayoutMultiSchemaField, {
  computeEnumOptions,
  getSelectedOption,
} from '../src/components/fields/LayoutMultiSchemaField';
import RadioWidget from '../src/components/widgets/RadioWidget';
import SelectWidget from '../src/components/widgets/SelectWidget';
import { SIMPLE_ONEOF, SIMPLE_ONEOF_OPTIONS } from './testData/layoutData';
import getTestRegistry from './testData/getTestRegistry';

jest.mock('@rjsf/utils', () => ({
  ...jest.requireActual('@rjsf/utils'),
  getWidget: jest.fn().mockImplementation((_schema, widget, widgets) => {
    const widgetToUse = widget === 'select' ? 'SelectWidget' : 'RadioWidget';
    // The real implementation wraps the resulting widget in another component, so we'll just do the simple thing
    return widgets[widgetToUse];
  }),
}));

const oneOfSchema = {
  type: 'object',
  title: 'Testing OneOfs',
  definitions: {
    first_option_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'first_option',
          readOnly: true,
        },
        flag: {
          type: 'boolean',
          default: false,
        },
        unlabeled_options: {
          oneOf: [
            {
              type: 'integer',
            },
            {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
          ],
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
    second_option_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'second_option',
          readOnly: true,
        },
        flag: {
          type: 'boolean',
          default: false,
        },
        unique_to_second: {
          type: 'integer',
        },
        labeled_options: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          ],
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  oneOf: [
    {
      $ref: '#/definitions/first_option_def',
      title: 'first option',
    },
    {
      $ref: '#/definitions/second_option_def',
      title: 'second option',
    },
  ],
};

const oneOfData = {
  name: 'second_option',
  flag: true,
};

const anyOfSchema = {
  discriminator: {
    propertyName: 'answer',
  },
  [ANY_OF_KEY]: SIMPLE_ONEOF[ONE_OF_KEY],
};

const DEFAULT_ID = 'test-id';
const FIELD_ERROR_TEST_ID = 'FakeFieldErrorTemplate-testId';
const FIELD_TEMPLATE_TEST_ID = 'FakeFieldTemplate-testId';

const NOT_SHOWN_ERROR_SCHEMA = new ErrorSchemaBuilder().addErrors(
  'error message will not be rendered due to hideError flag',
).ErrorSchema;
const NESTED_ERROR_SCHEMA = new ErrorSchemaBuilder()
  .addErrors(['first error', 'second error'])
  .addErrors('bar', 'nestedFieldErrors.foo').ErrorSchema;

const user = userEvent.setup();

function FakeFieldErrorTemplate(props: FieldErrorProps) {
  const { errors } = props;
  return <span data-testid={FIELD_ERROR_TEST_ID}>{errors}</span>;
}

function FakeFieldTemplate(props: FieldTemplateProps) {
  const { children, errors } = props;
  return (
    <div data-testid={FIELD_TEMPLATE_TEST_ID}>
      {children}
      {errors}
    </div>
  );
}

const SelectWidgetTestId = 'select-widget-testid';

function WrappedSelectWidget(props: WidgetProps) {
  return (
    <div data-testid={SelectWidgetTestId}>
      <SelectWidget {...props} />
    </div>
  );
}

const RadioWidgetTestId = 'select-widget-testid';

function WrappedRadioWidget(props: WidgetProps) {
  return (
    <div data-testid={RadioWidgetTestId}>
      <RadioWidget {...props} />
    </div>
  );
}

describe('LayoutMultiSchemaField', () => {
  function getProps(overrideProps: Partial<FieldProps> = {}): FieldProps {
    const {
      formData,
      idSchema = { [ID_KEY]: DEFAULT_ID } as IdSchema,
      options = SIMPLE_ONEOF[ONE_OF_KEY],
      schema = SIMPLE_ONEOF as RJSFSchema,
      uiSchema = {},
      disabled = false,
      hideError = false,
      errorSchema = {},
      required = false,
      autofocus = false,
    } = overrideProps;
    return {
      // required FieldProps stubbed
      autofocus,
      formContext: {},
      name: '',
      readonly: false,
      required,
      // end required FieldProps
      baseType: 'object',
      disabled,
      formData,
      idSchema,
      options,
      registry: getTestRegistry(
        schema,
        {},
        { FieldErrorTemplate: FakeFieldErrorTemplate, FieldTemplate: FakeFieldTemplate },
        { SelectWidget: WrappedSelectWidget, RadioWidget: WrappedRadioWidget },
      ),
      schema,
      uiSchema,
      errorSchema,
      hideError,
      onBlur: jest.fn(),
      onChange: jest.fn(),
      onFocus: jest.fn(),
    };
  }
  let consoleErrorSpy: jest.SpyInstance;
  beforeAll(() => {
    // silence the error reporting
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  afterEach(() => {
    consoleErrorSpy.mockClear();
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
  test('throws when no selectorField is provided', () => {
    const expectedError = 'No selector field provided for the LayoutMultiSchemaField';
    const schema: RJSFSchema = {
      oneOf: [
        {
          title: 'Choice 1',
          type: 'string',
          const: '1',
        },
        {
          title: 'Choice 2',
          type: 'string',
          const: '2',
        },
      ],
    };
    const props = getProps({ schema, options: schema[ONE_OF_KEY] });
    expect(() => render(<LayoutMultiSchemaField {...props} />)).toThrow(expectedError);
    expect(consoleErrorSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: expect.stringContaining(expectedError),
        type: 'unhandled exception',
      }),
    );
  });
  test('default render with SIMPLE_ONEOF schema', async () => {
    const selectorField = getDiscriminatorFieldFromSchema(SIMPLE_ONEOF)!;
    const props = getProps({ schema: { ...SIMPLE_ONEOF, title: undefined } });

    const { rerender } = render(<LayoutMultiSchemaField {...props} />);

    // Renders the FakeFieldTemplate
    const fakeFieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
    expect(fakeFieldTemplate).toBeInTheDocument();

    // Renders the formControl that is the outer wrapper of the RadioWidget
    const formControl = within(fakeFieldTemplate).getByTestId(SelectWidgetTestId);
    expect(formControl).toBeInTheDocument();

    // Renders formGroup
    const formGroup = within(formControl).getByRole('radiogroup');
    expect(formGroup).toBeInTheDocument();

    // Renders formLabel for each source
    const radios = within(formControl).getAllByRole('radio');
    expect(radios).toHaveLength(SIMPLE_ONEOF_OPTIONS.length);

    radios.forEach((radio, index) => {
      expect(radio).toBeInTheDocument();
      // Renders the correct label for each source
      expect(radio.parentElement).toHaveTextContent(SIMPLE_ONEOF_OPTIONS[index].label);
    });

    // Radio button should not be checked
    const input = radios[1];
    expect(input).not.toBeChecked();

    await user.click(input);

    // OnChange was called with the correct event
    expect(props.onChange).toHaveBeenCalledWith({ [selectorField]: '2' }, undefined, DEFAULT_ID);

    // Rerender to simulate the onChange updating the value
    const newFormData = { [selectorField]: SIMPLE_ONEOF_OPTIONS[1].value };
    rerender(<LayoutMultiSchemaField {...props} formData={newFormData} />);

    // Checkbox should now be checked
    expect(input).toBeChecked();
  });
  test('custom selector field, title and widget in uiSchema, formData, has error', async () => {
    const selectorField = 'name';
    const props = getProps({
      options: oneOfSchema[ONE_OF_KEY],
      schema: oneOfSchema as RJSFSchema,
      formData: oneOfData,
      uiSchema: {
        [UI_OPTIONS_KEY]: { optionsSchemaSelector: selectorField, title: 'Test Title' },
        [UI_WIDGET_KEY]: 'select',
      },
      errorSchema: NESTED_ERROR_SCHEMA,
    });
    render(<LayoutMultiSchemaField {...props} />);

    // Renders the FakeFieldTemplate
    const fakeFieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
    expect(fakeFieldTemplate).toBeInTheDocument();

    // Renders a form control
    const formControl = within(fakeFieldTemplate).getByTestId(SelectWidgetTestId);
    expect(formControl).toBeInTheDocument();

    // Renders the select button with correct text
    const button = screen.getByRole('combobox');
    expect(button).toHaveTextContent(oneOfSchema.oneOf[1].title);

    // Renders the FakeFieldErrorTemplate with correct text
    const fakeFieldErrorTemplate = screen.getByTestId(FIELD_ERROR_TEST_ID);
    expect(fakeFieldErrorTemplate).toHaveTextContent(get(props.errorSchema, [ERRORS_KEY])!.join(''));

    await user.click(button);
    // Verify the focus function was called
    expect(props.onFocus).toHaveBeenCalledWith(DEFAULT_ID, oneOfData.name);

    // Menu list has the expected items with expected text and style
    const items = within(formControl).getAllByRole('option');
    expect(items.length).toBe(oneOfSchema.oneOf.length + 1); // add one for clear selection text

    items.forEach((item, index) => {
      if (index === 0) {
        expect(item).toHaveTextContent('');
        expect(item).toHaveAttribute('value', '');
      } else {
        expect(item).toHaveTextContent(oneOfSchema.oneOf[index - 1].title);
        expect(item).toHaveAttribute('value', String(index - 1));
      }
    });

    // select the option with the '0' value
    await user.selectOptions(button, '0');

    // Verify the blur function was called
    await user.tab();
    expect(props.onBlur).toHaveBeenCalledWith(DEFAULT_ID, oneOfData.name);

    // OnChange was called with the correct event
    const retrievedOptions = props.options.map((opt: object) =>
      props.registry.schemaUtils.retrieveSchema(opt, props.formData),
    );
    const sanitizedFormData = props.registry.schemaUtils.sanitizeDataForNewSchema(
      retrievedOptions[0],
      retrievedOptions[1],
      props.formData,
    );
    await waitFor(() => {
      expect(props.onChange).toHaveBeenCalledWith(
        {
          ...props.registry.schemaUtils.getDefaultFormState(retrievedOptions[0], sanitizedFormData),
          [selectorField]: 'first_option',
        },
        undefined,
        DEFAULT_ID,
      );
    });
  });
  test('custom selector field, ui:hideError false, props.hideError true, required true, autofocus true', async () => {
    const selectorField = 'name';
    const props = getProps({
      autofocus: true,
      required: true,
      options: oneOfSchema[ONE_OF_KEY],
      schema: oneOfSchema as RJSFSchema,
      formData: oneOfData,
      errorSchema: NESTED_ERROR_SCHEMA,
      uiSchema: { [UI_OPTIONS_KEY]: { optionsSchemaSelector: selectorField, hideError: false } },
      hideError: true,
    });
    render(<LayoutMultiSchemaField {...props} />);

    // onFocus is called automatically because autofocus is true
    expect(props.onFocus).toHaveBeenCalledTimes(1);

    // Renders the FakeFieldTemplate
    const fakeFieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
    expect(fakeFieldTemplate).toBeInTheDocument();

    // Renders a form control
    const formControl = within(fakeFieldTemplate).getByTestId(SelectWidgetTestId);
    expect(formControl).toBeInTheDocument();

    // Renders the select button
    const button = screen.getByRole('combobox');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(oneOfSchema.oneOf[1].title);

    // Renders the FakeFieldErrorTemplate because 'ui:hideError' takes precedence over props.hideError
    const fakeFieldErrorTemplate = screen.queryByTestId(FIELD_ERROR_TEST_ID);
    expect(fakeFieldErrorTemplate).toBeInTheDocument();
    expect(fakeFieldErrorTemplate).toHaveTextContent(get(props.errorSchema, [ERRORS_KEY])!.join(''));

    await user.click(button);

    // Menu list has the expected items with expected text and style
    const items = within(formControl).getAllByRole('option');
    expect(items.length).toBe(oneOfSchema.oneOf.length + 1); // add one for clear selection text

    items.forEach((item, index) => {
      if (index === 0) {
        expect(item).toHaveTextContent('');
        expect(item).toHaveAttribute('value', '');
      } else {
        expect(item).toHaveTextContent(oneOfSchema.oneOf[index - 1].title);
        expect(item).toHaveAttribute('value', String(index - 1));
      }
    });

    // select the option with the '0' value
    await user.selectOptions(button, '');

    // OnChange was called with the correct event
    expect(props.onChange).toHaveBeenCalledWith(undefined, undefined, DEFAULT_ID);
  });
  test('no options for radio widget, ui:hideError true, props.hideError false, no errors to hide', () => {
    const props = getProps({ options: [], uiSchema: { 'ui:hideError': true }, hideError: false });
    render(<LayoutMultiSchemaField {...props} />);

    // Renders a form control
    const formControl = screen.getByTestId(RadioWidgetTestId);
    expect(formControl).toBeInTheDocument();

    // renders the radio group
    expect(screen.queryByRole('radiogroup')).toBeInTheDocument();

    // radio group has no radios because there are no options
    expect(screen.queryAllByRole('radio').length).toBe(0);

    // Does not render the FakeFieldErrorTemplate because 'ui:hideError' takes precedence over props.hideError
    const fakeFieldErrorTemplate = screen.queryByTestId(FIELD_ERROR_TEST_ID);
    expect(fakeFieldErrorTemplate).not.toBeInTheDocument();
  });
  test('implicitly disabled due to no options for select widget, ui:hideError true, props.hideError false, no errors to hide', () => {
    const selectorField = 'name';
    const props = getProps({
      schema: oneOfSchema as RJSFSchema,
      options: [],
      uiSchema: { [UI_OPTIONS_KEY]: { optionsSchemaSelector: selectorField, hideError: false } },
      hideError: false,
    });
    render(<LayoutMultiSchemaField {...props} />);

    // Renders the FakeFieldTemplate
    const fakeFieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
    expect(fakeFieldTemplate).toBeInTheDocument();

    // Renders a form control
    const formControl = within(fakeFieldTemplate).getByTestId(SelectWidgetTestId);
    expect(formControl).toBeInTheDocument();

    // Renders the select button
    const button = screen.getByRole('combobox');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Does not render the FakeFieldErrorTemplate because 'ui:hideError' takes precedence over props.hideError
    const fakeFieldErrorTemplate = screen.queryByTestId(FIELD_ERROR_TEST_ID);
    expect(fakeFieldErrorTemplate).not.toBeInTheDocument();
  });
  test('explicitly disabled, additional ui props, idSchema, has error, hideError prop true', () => {
    const props = getProps({
      idSchema: { [ID_KEY]: 'testid' } as IdSchema,
      disabled: true,
      options: SIMPLE_ONEOF[ONE_OF_KEY],
      schema: SIMPLE_ONEOF,
      hideError: true,
      errorSchema: NOT_SHOWN_ERROR_SCHEMA,
    });
    render(<LayoutMultiSchemaField {...props} />);

    // Renders the FakeFieldTemplate
    const fakeFieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
    expect(fakeFieldTemplate).toBeInTheDocument();

    // Renders the formControl that is the outer wrapper of the RadioWidget
    const formControl = within(fakeFieldTemplate).getByTestId(SelectWidgetTestId);
    expect(formControl).toBeInTheDocument();

    const formGroup = within(formControl).getByRole('radiogroup');
    expect(formGroup).toBeInTheDocument();

    // Renders formLabel for each source
    const radios = within(formControl).getAllByRole('radio');
    expect(radios).toHaveLength(SIMPLE_ONEOF_OPTIONS.length);

    radios.forEach((radio, index) => {
      expect(radio).toBeDisabled();
      // Renders the correct label for each source
      expect(radio.parentElement).toHaveTextContent(SIMPLE_ONEOF_OPTIONS[index].label);
    });

    // Does not render the FakeFieldErrorTemplate
    const fakeFieldErrorTemplate = screen.queryByTestId(FIELD_ERROR_TEST_ID);
    expect(fakeFieldErrorTemplate).not.toBeInTheDocument();
  });
  describe('computeEnumOptions', () => {
    test('Reads oneOfs from refs', () => {
      const schema = oneOfSchema as RJSFSchema;
      const uiSchema = { [UI_OPTIONS_KEY]: { optionsSchemaSelector: 'name' } };
      const { schemaUtils } = getTestRegistry(schema);
      const option1 = schemaUtils.retrieveSchema(oneOfSchema[ONE_OF_KEY][0]);
      const option2 = schemaUtils.retrieveSchema(oneOfSchema[ONE_OF_KEY][1]);
      const enumOptions = computeEnumOptions(schema, oneOfSchema[ONE_OF_KEY], schemaUtils, uiSchema);
      expect(enumOptions).toEqual([
        {
          schema: option1,
          label: get(oneOfSchema, [ONE_OF_KEY, 0, 'title']),
          value: get(oneOfSchema, [DEFINITIONS_KEY, 'first_option_def', PROPERTIES_KEY, 'name', DEFAULT_KEY]),
        },
        {
          schema: option2,
          label: get(oneOfSchema, [ONE_OF_KEY, 1, 'title']),
          value: get(oneOfSchema, [DEFINITIONS_KEY, 'second_option_def', PROPERTIES_KEY, 'name', DEFAULT_KEY]),
        },
      ]);
    });
    test('Reads anyOf', () => {
      const schema = anyOfSchema as RJSFSchema;
      const options = anyOfSchema[ANY_OF_KEY] as RJSFSchema[];
      const { schemaUtils } = getTestRegistry(schema);
      const enumOptions = computeEnumOptions(schema, options, schemaUtils);
      expect(enumOptions).toEqual([
        {
          schema: options[0],
          label: options[0].title,
          value: get(anyOfSchema, [ANY_OF_KEY, 0, PROPERTIES_KEY, 'answer', DEFAULT_KEY]),
        },
        {
          schema: options[1],
          label: options[1].title,
          value: get(anyOfSchema, [ANY_OF_KEY, 1, PROPERTIES_KEY, 'answer', DEFAULT_KEY]),
        },
      ]);
    });
    test('throws error when no enumOptions are generated', () => {
      const { schemaUtils } = getTestRegistry({});
      expect(() => computeEnumOptions({}, [], schemaUtils)).toThrow('No enumOptions were computed from the schema {}');
    });
  });
  describe('getSelectedOption', () => {
    let selectorField: string;
    let enumOptions: EnumOptionsType[];
    beforeAll(() => {
      selectorField = getDiscriminatorFieldFromSchema(SIMPLE_ONEOF)!;
      enumOptions = optionsList(SIMPLE_ONEOF)!;
    });
    test('no value, returns undefined', () => {
      expect(getSelectedOption(enumOptions, selectorField, undefined)).toBeUndefined();
    });
    test('existing value,returns option with existing value', () => {
      expect(getSelectedOption(enumOptions, selectorField, SIMPLE_ONEOF_OPTIONS[0].value)).toBe(
        SIMPLE_ONEOF[ONE_OF_KEY]![0],
      );
    });
    test('non-existing value, returns undefined', () => {
      expect(getSelectedOption(enumOptions, selectorField, 'randomValue')).toBeUndefined();
    });
  });
});
