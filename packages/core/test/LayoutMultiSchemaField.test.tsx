import type {
  EnumOptionsType,
  FieldErrorProps,
  FieldProps,
  FieldTemplateProps,
  GenericObjectType,
  RJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  ANY_OF_KEY,
  DEFAULT_KEY,
  DEFINITIONS_KEY,
  descriptionId,
  ERRORS_KEY,
  getByPath,
  ErrorSchemaBuilder,
  getDiscriminatorFieldFromSchema,
  getVisibleErrors,
  ONE_OF_KEY,
  optionsList,
  toFieldPath,
  PROPERTIES_KEY,
  UI_OPTIONS_KEY,
  UI_WIDGET_KEY,
} from '@rjsf/utils';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import LayoutMultiSchemaField, {
  computeEnumOptions,
  getSelectedOption,
} from '../src/components/fields/LayoutMultiSchemaField.tsx';
import RadioWidget from '../src/components/widgets/RadioWidget.tsx';
import SelectWidget from '../src/components/widgets/SelectWidget.tsx';
import { getTestRegistry } from '../src/testing.ts';
import { SIMPLE_ONEOF, SIMPLE_ONEOF_OPTIONS, SIMPLE_ONEOF_SCHEMAS } from './testData/layoutData.ts';
import { setupConsoleErrorSuppression } from './testUtils.tsx';

vi.mock('@rjsf/utils', async (importOriginal) => ({
  ...(await importOriginal()),
  resolveWidget: vi.fn().mockImplementation((_schema, widget, widgets) => {
    const widgetToUse = widget === 'select' ? 'SelectWidget' : 'RadioWidget';
    // Picks the registry widget directly, so the test controls which one renders without resolving the schema
    return { Widget: widgets[widgetToUse] };
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

const anyOfSchema: RJSFSchema = {
  discriminator: {
    propertyName: 'answer',
  },
  [ANY_OF_KEY]: SIMPLE_ONEOF_SCHEMAS,
};

const DEFAULT_ID = 'test-id';
const FIELD_ERROR_TEST_ID = 'FakeFieldErrorTemplate-testId';
const FIELD_TEMPLATE_TEST_ID = 'FakeFieldTemplate-testId';
const RAW_HELP_TEST_ID = 'FakeFieldTemplate-rawHelp-testId';

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
  const { children, description, errors, help, rawHelp } = props;
  return (
    <div data-testid={FIELD_TEMPLATE_TEST_ID}>
      {description}
      {children}
      {errors}
      {help}
      {rawHelp ? <span data-testid={RAW_HELP_TEST_ID} /> : null}
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

const RadioWidgetTestId = 'radio-widget-testid';

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
      fieldPath = toFieldPath(DEFAULT_ID),
      id = DEFAULT_ID,
      options = SIMPLE_ONEOF[ONE_OF_KEY],
      schema = SIMPLE_ONEOF,
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
      name: '',
      readonly: false,
      required,
      // end required FieldProps
      baseType: 'object',
      disabled,
      formData,
      fieldPath,
      id,
      options,
      registry: getTestRegistry(
        schema,
        {},
        {
          FieldErrorTemplate: FakeFieldErrorTemplate,
          FieldTemplate: FakeFieldTemplate,
        },
        { SelectWidget: WrappedSelectWidget, RadioWidget: WrappedRadioWidget },
      ),
      schema,
      uiSchema,
      errorSchema,
      hideError,
      onBlur: vi.fn(),
      onChange: vi.fn(),
      onFocus: vi.fn(),
    };
  }
  /** Renders the field with a `FieldTemplate` and a selector widget that record the props they were handed, which is
   * how the props this field builds for itself -- rather than receiving through `SchemaField` -- are asserted on
   */
  function renderRecording(overrideProps: Partial<FieldProps> = {}) {
    let templateProps: FieldTemplateProps | undefined;
    let widgetProps: WidgetProps | undefined;
    function RecordingFieldTemplate(props: FieldTemplateProps) {
      templateProps = props;
      return <FakeFieldTemplate {...props} />;
    }
    function RecordingRadioWidget(props: WidgetProps) {
      widgetProps = props;
      return <WrappedRadioWidget {...props} />;
    }
    const props = getProps(overrideProps);

    render(
      <LayoutMultiSchemaField
        {...props}
        registry={getTestRegistry(
          props.schema,
          {},
          { FieldErrorTemplate: FakeFieldErrorTemplate, FieldTemplate: RecordingFieldTemplate },
          { SelectWidget: WrappedSelectWidget, RadioWidget: RecordingRadioWidget },
        )}
      />,
    );

    return { templateProps, widgetProps };
  }
  setupConsoleErrorSuppression();
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
  });
  test('default render with SIMPLE_ONEOF schema', async () => {
    const selectorField = getDiscriminatorFieldFromSchema(SIMPLE_ONEOF)!;
    const props = getProps({ schema: { ...SIMPLE_ONEOF, title: undefined } });

    const { rerender } = render(<LayoutMultiSchemaField {...props} />);

    // Renders the FakeFieldTemplate
    const fakeFieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
    expect(fakeFieldTemplate).toBeInTheDocument();

    // Renders the formControl that is the outer wrapper of the RadioWidget
    const formControl = within(fakeFieldTemplate).getByTestId(RadioWidgetTestId);
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
    expect(props.onChange).toHaveBeenCalledWith({ [selectorField]: '2' }, props.fieldPath, undefined, DEFAULT_ID);

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
        [UI_OPTIONS_KEY]: {
          optionsSchemaSelector: selectorField,
          title: 'Test Title',
        },
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
    expect(fakeFieldErrorTemplate).toHaveTextContent(getByPath<string[]>(props.errorSchema, [ERRORS_KEY]).join(''));

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
          ...(props.registry.schemaUtils.getDefaultFormState(
            retrievedOptions[0],
            sanitizedFormData,
          ) as GenericObjectType),
          [selectorField]: 'first_option',
        },
        props.fieldPath,
        undefined,
        DEFAULT_ID,
      );
    });
  });
  test('applies ui:initialValue from uiSchema when a new option is selected', async () => {
    const selectorField = 'name';
    const uiSchema = {
      [UI_OPTIONS_KEY]: { optionsSchemaSelector: selectorField },
      [UI_WIDGET_KEY]: 'select',
      unique_to_second: { 'ui:initialValue': 42 },
    };
    const props = getProps({
      options: oneOfSchema[ONE_OF_KEY],
      schema: oneOfSchema as RJSFSchema,
      formData: { name: 'first_option', flag: true },
      uiSchema,
    });
    render(<LayoutMultiSchemaField {...props} />);

    const button = screen.getByRole('combobox');
    // select the second option, whose schema has the `unique_to_second` field
    await user.selectOptions(button, '1');

    const retrievedOptions = props.options.map((opt: object) =>
      props.registry.schemaUtils.retrieveSchema(opt, props.formData),
    );
    const sanitizedFormData = props.registry.schemaUtils.sanitizeDataForNewSchema(
      retrievedOptions[1],
      retrievedOptions[0],
      props.formData,
    );
    await waitFor(() => {
      expect(props.onChange).toHaveBeenCalledWith(
        {
          ...(props.registry.schemaUtils.getDefaultFormState(
            retrievedOptions[1],
            sanitizedFormData,
            undefined,
            undefined,
            uiSchema,
          ) as GenericObjectType),
          [selectorField]: 'second_option',
        },
        props.fieldPath,
        undefined,
        DEFAULT_ID,
      );
    });
    // Sanity check that the assertion above actually exercises the new default, not just an object shape match
    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ unique_to_second: 42 }),
      props.fieldPath,
      undefined,
      DEFAULT_ID,
    );
  });
  test('applies ui:initialValue from registry.uiSchemaDefinitions when a new option is selected', async () => {
    // `oneOf[1]` (`second_option_def`) is only ever reached via its own `$ref`, so `unique_to_second`'s
    // `ui:initialValue` lives in `ui:definitions` rather than directly on the field's own uiSchema - this only
    // resolves if onOptionChange threads the root's `ui:definitions` (via the registry) into getDefaultFormState().
    const selectorField = 'name';
    const uiSchema = {
      [UI_OPTIONS_KEY]: { optionsSchemaSelector: selectorField },
      [UI_WIDGET_KEY]: 'select',
    };
    const baseProps = getProps({
      options: oneOfSchema[ONE_OF_KEY],
      schema: oneOfSchema as RJSFSchema,
      formData: { name: 'first_option', flag: true },
      uiSchema,
    });
    // getTestRegistry() freezes the registry it returns, so a new object is substituted in rather than mutated.
    const props = {
      ...baseProps,
      registry: {
        ...baseProps.registry,
        uiSchemaDefinitions: {
          '#/definitions/second_option_def': { unique_to_second: { 'ui:initialValue': 42 } },
        },
      },
    };
    render(<LayoutMultiSchemaField {...props} />);

    const button = screen.getByRole('combobox');
    // select the second option, whose schema has the `unique_to_second` field
    await user.selectOptions(button, '1');

    await waitFor(() => {
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ unique_to_second: 42 }),
        props.fieldPath,
        undefined,
        DEFAULT_ID,
      );
    });
  });
  test('applies ui:initialValue from a per-option uiSchema.oneOf[index] entry when a new option is selected', async () => {
    // Matches AnyOfField's own optionsUiSchema/optionUiSchema resolution: once uiSchema.oneOf is declared as an
    // array, a plain per-key entry on the parent uiSchema (e.g. uiSchema.unique_to_second) is never consulted for
    // that option's own fields, so the override must be declared at uiSchema.oneOf[1] to take effect.
    const selectorField = 'name';
    const uiSchema = {
      [UI_OPTIONS_KEY]: { optionsSchemaSelector: selectorField },
      [UI_WIDGET_KEY]: 'select',
      [ONE_OF_KEY]: [{}, { unique_to_second: { 'ui:initialValue': 42 } }],
    };
    const props = getProps({
      options: oneOfSchema[ONE_OF_KEY],
      schema: oneOfSchema as RJSFSchema,
      formData: { name: 'first_option', flag: true },
      uiSchema,
    });
    render(<LayoutMultiSchemaField {...props} />);

    const button = screen.getByRole('combobox');
    // select the second option, whose schema has the `unique_to_second` field
    await user.selectOptions(button, '1');

    await waitFor(() => {
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ unique_to_second: 42 }),
        props.fieldPath,
        undefined,
        DEFAULT_ID,
      );
    });
  });
  test('applies ui:initialValue from uiSchema.anyOf[index] when the schema also has a oneOf (#5309)', async () => {
    const selectorField = 'name';
    const uiSchema = {
      [UI_OPTIONS_KEY]: { optionsSchemaSelector: selectorField },
      [UI_WIDGET_KEY]: 'select',
      [ANY_OF_KEY]: [{}, { unique_to_second: { 'ui:initialValue': 42 } }],
      [ONE_OF_KEY]: [{}, { unique_to_second: { 'ui:initialValue': 7 } }],
    };
    const props = getProps({
      options: oneOfSchema[ONE_OF_KEY],
      schema: { ...oneOfSchema, [ANY_OF_KEY]: oneOfSchema[ONE_OF_KEY] } as RJSFSchema,
      formData: { name: 'first_option', flag: true },
      uiSchema,
    });
    render(<LayoutMultiSchemaField {...props} />);

    await user.selectOptions(screen.getByRole('combobox'), '1');

    await waitFor(() => {
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ unique_to_second: 42 }),
        props.fieldPath,
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
      uiSchema: {
        [UI_OPTIONS_KEY]: {
          optionsSchemaSelector: selectorField,
          hideError: false,
        },
      },
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
    expect(fakeFieldErrorTemplate).toHaveTextContent(getByPath<string[]>(props.errorSchema, [ERRORS_KEY]).join(''));

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
    expect(props.onChange).toHaveBeenCalledWith(undefined, props.fieldPath, undefined, DEFAULT_ID);
  });
  test("replaces the old option's defaults when switching options", async () => {
    // This field picks `oldOption` out of `formData` by its selector value rather than from a selected index, and
    // writes the selector back after the defaults are filled in, so it exercises the switch differently than
    // `MultiSchemaField` does
    const optionFor = (answer: string): RJSFSchema => ({
      title: `Choice ${answer}`,
      type: 'object',
      properties: {
        answer: { type: 'string', default: answer, readOnly: true },
        runner: {
          type: 'object',
          default: { name: `runner-${answer}` },
          properties: { name: { type: 'string' }, ratio: { type: 'number', default: 0 } },
        },
      },
    });
    const schema: RJSFSchema = {
      title: 'Simple',
      type: 'object',
      discriminator: { propertyName: 'answer' },
      oneOf: [optionFor('1'), optionFor('2')],
    };
    const props = getProps({
      schema,
      options: schema[ONE_OF_KEY],
      formData: { answer: '1', runner: { name: 'runner-1', ratio: 0 } },
    });

    render(<LayoutMultiSchemaField {...props} />);

    const radios = within(screen.getByTestId(RadioWidgetTestId)).getAllByRole('radio');
    await user.click(radios[1]);

    expect(props.onChange).toHaveBeenCalledWith(
      { answer: '2', runner: { name: 'runner-2', ratio: 0 } },
      props.fieldPath,
      undefined,
      DEFAULT_ID,
    );
  });
  test('no options for radio widget, ui:hideError true, props.hideError false, no errors to hide', () => {
    const props = getProps({
      options: [],
      uiSchema: { 'ui:hideError': true },
      hideError: false,
    });
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
      uiSchema: {
        [UI_OPTIONS_KEY]: {
          optionsSchemaSelector: selectorField,
          hideError: false,
        },
      },
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
  test('explicitly disabled, additional ui props, fieldPath, has error, hideError prop true', () => {
    const props = getProps({
      fieldPath: toFieldPath('testid'),
      id: 'testid',
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
    const formControl = within(fakeFieldTemplate).getByTestId(RadioWidgetTestId);
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
  // `rawErrors` carries only what the template is showing, while `errorSchema` carries every error whatever
  // `hideError` says; this field renders its own `FieldTemplate` and must match `SchemaField` on both
  test.each([
    ['hands its FieldTemplate the errors it is showing', false, ['first error', 'second error']],
    ['withholds the errors from its FieldTemplate while they are hidden', true, []],
  ] satisfies [string, boolean, string[]][])('%s', (_, hidden, expectedVisibleErrors) => {
    const { templateProps } = renderRecording({ errorSchema: NESTED_ERROR_SCHEMA, hideError: hidden });

    expect(templateProps?.rawErrors).toEqual(hidden ? undefined : ['first error', 'second error']);
    expect(templateProps?.hideError).toBe(hidden);
    expect(getVisibleErrors(templateProps!)).toEqual(expectedVisibleErrors);
    // The hidden errors remain reachable, so a template rendering them itself is not cut off by the directive
    expect(templateProps?.errorSchema).toEqual(NESTED_ERROR_SCHEMA);
  });
  // This field renders its own `FieldTemplate` in place of `SchemaField`'s, so it has to compute the same class list;
  // otherwise a discriminated oneOf/anyOf in a layout grid is the one field a `rjsf-field*` CSS rule never reaches
  describe('classNames and style', () => {
    test('hands its FieldTemplate the schema-derived classes', () => {
      const { templateProps } = renderRecording();

      expect(templateProps?.classNames).toBe('rjsf-field rjsf-field-object');
      expect(templateProps?.style).toBeUndefined();
    });
    // `SchemaField` spells the same class `rjsf-field-undefined` for a schema `getSchemaType()` cannot type, which a
    // discriminated oneOf/anyOf of `$ref`s usually is, so the two agree on what a CSS rule has to match
    test('spells the type class the way SchemaField does for a schema with no derivable type', () => {
      const { templateProps } = renderRecording({
        schema: anyOfSchema,
        options: SIMPLE_ONEOF_SCHEMAS,
      });

      expect(templateProps?.classNames).toBe('rjsf-field rjsf-field-undefined');
    });
    test('adds rjsf-field-error when it has errors to show', () => {
      const { templateProps } = renderRecording({ errorSchema: NESTED_ERROR_SCHEMA });

      expect(templateProps?.classNames).toBe('rjsf-field rjsf-field-object rjsf-field-error');
    });
    test('omits rjsf-field-error while the errors are hidden', () => {
      const { templateProps } = renderRecording({ errorSchema: NESTED_ERROR_SCHEMA, hideError: true });

      expect(templateProps?.classNames).toBe('rjsf-field rjsf-field-object');
    });
    test('appends ui:classNames and passes ui:style, without leaking either to the widget', () => {
      const style = { color: 'red' };
      const { templateProps, widgetProps } = renderRecording({
        errorSchema: NESTED_ERROR_SCHEMA,
        uiSchema: { 'ui:classNames': 'custom-class', 'ui:style': style },
      });

      expect(templateProps?.classNames).toBe('rjsf-field rjsf-field-object rjsf-field-error custom-class');
      expect(templateProps?.style).toBe(style);
      // See #439: the template consumed them, so they are kept out of the widget's own options
      expect(widgetProps?.options).not.toHaveProperty('classNames');
      expect(widgetProps?.options).not.toHaveProperty('style');
      // ...nor is the widget's own `uiSchema` left carrying them, which `getUiOptions()` would read them back off
      expect(widgetProps?.uiSchema).not.toHaveProperty('ui:classNames');
      expect(widgetProps?.uiSchema).not.toHaveProperty('ui:style');
    });
    // `ui:classNames` and `ui:style` can also be written under `ui:options`, where a widget reading its own options
    // would find them if they were not stripped from both spellings
    test('reads and strips the ui:options spelling of classNames and style', () => {
      const style = { color: 'red' };
      const { templateProps, widgetProps } = renderRecording({
        uiSchema: { [UI_OPTIONS_KEY]: { classNames: 'custom-class', style } },
      });

      expect(templateProps?.classNames).toBe('rjsf-field rjsf-field-object custom-class');
      expect(templateProps?.style).toBe(style);
      expect(widgetProps?.options).not.toHaveProperty('classNames');
      expect(widgetProps?.options).not.toHaveProperty('style');
      expect(widgetProps?.uiSchema?.[UI_OPTIONS_KEY]).not.toHaveProperty('classNames');
      expect(widgetProps?.uiSchema?.[UI_OPTIONS_KEY]).not.toHaveProperty('style');
    });
    // The error class has to follow the same `hideError` resolution the errors themselves do: `ui:hideError` decides
    // it when it is set, in either direction, and only an unset one falls back to the prop
    test.each([
      ['omits rjsf-field-error for ui:hideError', false, true, false],
      ['adds rjsf-field-error when ui:hideError overrides a hiding prop', true, false, true],
    ] satisfies [string, boolean, boolean, boolean][])('%s', (_, hideError, uiHideError, expectsErrorClass) => {
      const { templateProps } = renderRecording({
        errorSchema: NESTED_ERROR_SCHEMA,
        hideError,
        uiSchema: { 'ui:hideError': uiHideError },
      });

      expect(templateProps?.classNames).toBe(
        expectsErrorClass ? 'rjsf-field rjsf-field-object rjsf-field-error' : 'rjsf-field rjsf-field-object',
      );
    });
  });
  // `SchemaField` sets all of these, and this field renders the same `FieldTemplate`, which has no other source for
  // them: whatever it leaves unset is a prop a template is told nothing about for this one field
  describe('the remaining FieldTemplate props', () => {
    test('hands its FieldTemplate the formData it was given', () => {
      const { templateProps } = renderRecording({ formData: oneOfData });

      expect(templateProps?.formData).toEqual(oneOfData);
    });
    test('renders no description, and reports none, for a schema that declares none', () => {
      const { templateProps } = renderRecording();

      expect(templateProps?.rawDescription).toBe('');
      expect(templateProps?.hidden).toBe(false);
      // `DescriptionField` renders nothing for an empty description, which is what keeps every theme's snapshot of an
      // undescribed cell unchanged by this field passing the prop at all
      expect(document.getElementById(descriptionId(DEFAULT_ID))).toBeNull();
    });
    test('falls back to the schema description, and renders it', () => {
      const { templateProps } = renderRecording({ schema: { ...SIMPLE_ONEOF, description: 'from the schema' } });

      expect(templateProps?.rawDescription).toBe('from the schema');
      expect(screen.getByText('from the schema')).toBeInTheDocument();
    });
    test('prefers a ui:description over the schema one, and renders that', () => {
      const { templateProps } = renderRecording({
        schema: { ...SIMPLE_ONEOF, description: 'from the schema' },
        uiSchema: { 'ui:description': 'from the uiSchema' },
      });

      expect(templateProps?.rawDescription).toBe('from the uiSchema');
      expect(screen.getByText('from the uiSchema')).toBeInTheDocument();
      expect(screen.queryByText('from the schema')).not.toBeInTheDocument();
    });
    test('tells its FieldTemplate the field is hidden for a ui:widget of hidden', () => {
      const { templateProps } = renderRecording({ uiSchema: { [UI_WIDGET_KEY]: 'hidden' } });

      expect(templateProps?.hidden).toBe(true);
    });
  });
  // A deprecated schema and `ui:disabled` are resolved by `SchemaField` for every other field, so this one has to
  // resolve them itself to render the same way inside a layout grid as the same schema does outside one
  describe('a deprecated schema and ui:disabled', () => {
    const deprecatedSchema: RJSFSchema = { ...SIMPLE_ONEOF, deprecated: true };

    test('appends the deprecation marker to its FieldTemplate label by default', () => {
      const { templateProps, widgetProps } = renderRecording({ schema: deprecatedSchema });

      expect(templateProps?.label).toBe('Simple (deprecated)');
      expect(templateProps?.hidden).toBe(false);
      expect(templateProps?.disabled).toBe(false);
      // Only the template's label is decorated, as in `SchemaField`: the widget's label names its own control
      expect(widgetProps?.label).toBe('Simple');
    });
    // There is no label for the marker to decorate, and a template rendering the decorated one would show a label
    // reading only "(deprecated)" naming nothing
    test('leaves the label empty for a deprecated schema with no title', () => {
      const { templateProps } = renderRecording({ schema: { ...deprecatedSchema, title: undefined } });

      expect(templateProps?.label).toBe('');
    });
    test('hides the field for a deprecatedHandling of hide', () => {
      const { templateProps } = renderRecording({
        schema: deprecatedSchema,
        uiSchema: { [UI_OPTIONS_KEY]: { deprecatedHandling: 'hide' } },
      });

      expect(templateProps?.hidden).toBe(true);
      expect(templateProps?.label).toBe('Simple');
    });
    test('disables the field and its widget for a deprecatedHandling of disable', () => {
      const { templateProps, widgetProps } = renderRecording({
        schema: deprecatedSchema,
        uiSchema: { [UI_OPTIONS_KEY]: { deprecatedHandling: 'disable' } },
      });

      expect(templateProps?.disabled).toBe(true);
      expect(widgetProps?.disabled).toBe(true);
      expect(templateProps?.label).toBe('Simple');
    });
    test('leaves a schema that is not deprecated undecorated, whatever deprecatedHandling says', () => {
      const { templateProps } = renderRecording({
        uiSchema: { [UI_OPTIONS_KEY]: { deprecatedHandling: 'hide' } },
      });

      expect(templateProps?.hidden).toBe(false);
      expect(templateProps?.label).toBe('Simple');
    });
    test('disables the field and its widget for a ui:disabled', () => {
      const { templateProps, widgetProps } = renderRecording({ uiSchema: { 'ui:disabled': true } });

      expect(templateProps?.disabled).toBe(true);
      expect(widgetProps?.disabled).toBe(true);
    });
    // `ui:disabled` overrides in both directions, the way `SchemaField` resolves it with `??`
    test('re-enables a disabled field for a ui:disabled of false', () => {
      const { templateProps, widgetProps } = renderRecording({
        disabled: true,
        uiSchema: { 'ui:disabled': false },
      });

      expect(templateProps?.disabled).toBe(false);
      expect(widgetProps?.disabled).toBe(false);
    });
    // The change handler has to read the same resolution the widget's `disabled` does, or a re-enabled selector is
    // clickable and every selection made on it is dropped
    test('reports a selection made on a selector a ui:disabled of false re-enabled', async () => {
      const selectorField = getDiscriminatorFieldFromSchema(SIMPLE_ONEOF)!;
      const props = getProps({ disabled: true, uiSchema: { 'ui:disabled': false } });

      render(<LayoutMultiSchemaField {...props} />);

      await user.click(screen.getAllByRole('radio')[1]);

      expect(props.onChange).toHaveBeenCalledWith({ [selectorField]: '2' }, props.fieldPath, undefined, DEFAULT_ID);
    });
  });
  test('a uiSchema FieldTemplate and FieldErrorTemplate override the registry ones', () => {
    const overrideTemplateTestId = 'override-field-template';
    const overrideErrorTestId = 'override-field-error-template';
    const props = getProps({
      errorSchema: NESTED_ERROR_SCHEMA,
      uiSchema: {
        'ui:FieldTemplate': ({ children, errors }: FieldTemplateProps) => (
          <div data-testid={overrideTemplateTestId}>
            {children}
            {errors}
          </div>
        ),
        'ui:FieldErrorTemplate': ({ errors }: FieldErrorProps) => (
          <span data-testid={overrideErrorTestId}>{errors}</span>
        ),
      },
    });

    render(<LayoutMultiSchemaField {...props} />);

    expect(screen.getByTestId(overrideTemplateTestId)).toBeInTheDocument();
    expect(screen.getByTestId(overrideErrorTestId)).toBeInTheDocument();
    expect(screen.queryByTestId(FIELD_TEMPLATE_TEST_ID)).not.toBeInTheDocument();
    expect(screen.queryByTestId(FIELD_ERROR_TEST_ID)).not.toBeInTheDocument();
  });
  describe('ui:help', () => {
    test('renders the help for a ui:help on the field', () => {
      const props = getProps({ uiSchema: { [UI_OPTIONS_KEY]: { help: 'some help text' } } });
      render(<LayoutMultiSchemaField {...props} />);

      const fieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
      expect(within(fieldTemplate).getByText('some help text')).toBeInTheDocument();
      expect(within(fieldTemplate).getByTestId(RAW_HELP_TEST_ID)).toBeInTheDocument();
    });

    test('renders the help for a ui:help given as a React element', () => {
      const props = getProps({ uiSchema: { [UI_OPTIONS_KEY]: { help: <strong>element help</strong> } } });
      render(<LayoutMultiSchemaField {...props} />);

      const fieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
      expect(within(fieldTemplate).getByText('element help')).toBeInTheDocument();
      expect(within(fieldTemplate).getByTestId(RAW_HELP_TEST_ID)).toBeInTheDocument();
    });

    test('renders the help inherited from ui:globalOptions', () => {
      const baseProps = getProps();
      // getTestRegistry() freezes the registry it returns, so a new object is substituted in rather than mutated.
      const props = {
        ...baseProps,
        registry: { ...baseProps.registry, globalUiOptions: { help: 'global help' } },
      };
      render(<LayoutMultiSchemaField {...props} />);

      const fieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
      expect(within(fieldTemplate).getByText('global help')).toBeInTheDocument();
    });

    test('renders no help when there is no ui:help', () => {
      render(<LayoutMultiSchemaField {...getProps()} />);

      const fieldTemplate = screen.getByTestId(FIELD_TEMPLATE_TEST_ID);
      expect(within(fieldTemplate).queryByTestId(RAW_HELP_TEST_ID)).toBeNull();
    });
  });

  describe('computeEnumOptions', () => {
    test('Reads oneOfs from refs', () => {
      const schema = oneOfSchema as RJSFSchema;
      const uiSchema = { [UI_OPTIONS_KEY]: { optionsSchemaSelector: 'name' } };
      const { schemaUtils } = getTestRegistry(schema);
      const option1 = schemaUtils.retrieveSchema(oneOfSchema[ONE_OF_KEY][0]);
      const option2 = schemaUtils.retrieveSchema(oneOfSchema[ONE_OF_KEY][1]);
      const enumOptions = computeEnumOptions(schema, oneOfSchema[ONE_OF_KEY] as RJSFSchema[], schemaUtils, uiSchema);
      expect(enumOptions).toEqual([
        {
          schema: option1,
          label: getByPath(oneOfSchema, [ONE_OF_KEY, 0, 'title']),
          value: getByPath(oneOfSchema, [DEFINITIONS_KEY, 'first_option_def', PROPERTIES_KEY, 'name', DEFAULT_KEY]),
        },
        {
          schema: option2,
          label: getByPath(oneOfSchema, [ONE_OF_KEY, 1, 'title']),
          value: getByPath(oneOfSchema, [DEFINITIONS_KEY, 'second_option_def', PROPERTIES_KEY, 'name', DEFAULT_KEY]),
        },
      ]);
    });
    test('Reads anyOf', () => {
      const schema = anyOfSchema;
      const options = SIMPLE_ONEOF_SCHEMAS;
      const { schemaUtils } = getTestRegistry(schema);
      const enumOptions = computeEnumOptions(schema, options, schemaUtils);
      expect(enumOptions).toEqual([
        {
          schema: options[0],
          label: options[0].title,
          value: getByPath(anyOfSchema, [ANY_OF_KEY, 0, PROPERTIES_KEY, 'answer', DEFAULT_KEY]),
        },
        {
          schema: options[1],
          label: options[1].title,
          value: getByPath(anyOfSchema, [ANY_OF_KEY, 1, PROPERTIES_KEY, 'answer', DEFAULT_KEY]),
        },
      ]);
    });
    test('Reads the resolved anyOf when the schema also has a oneOf (#5309)', () => {
      const schema: RJSFSchema = {
        definitions: {
          a: { title: 'A', type: 'object', properties: { answer: { type: 'string', const: 'a' } } },
          b: { title: 'B', type: 'object', properties: { answer: { type: 'string', const: 'b' } } },
        },
        anyOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }],
        oneOf: [{ title: 'Other', type: 'object', properties: { answer: { type: 'string', const: 'x' } } }],
      };
      const uiSchema = { [UI_OPTIONS_KEY]: { optionsSchemaSelector: 'answer' } };
      const { schemaUtils } = getTestRegistry(schema);
      const enumOptions = computeEnumOptions(schema, schema[ANY_OF_KEY] as RJSFSchema[], schemaUtils, uiSchema);
      expect(enumOptions.map(({ label, value }) => ({ label, value }))).toEqual([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
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
