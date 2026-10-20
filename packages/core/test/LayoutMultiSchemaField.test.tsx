import type {
  EnumOptionsType,
  FieldErrorProps,
  FieldProps,
  FieldTemplateProps,
  GenericObjectType,
  RJSFSchema,
  ThemePresentation,
  WidgetProps,
} from '@rjsf/utils';
import {
  ANY_OF_KEY,
  DEFAULT_KEY,
  DEFINITIONS_KEY,
  ERRORS_KEY,
  getByPath,
  ErrorSchemaBuilder,
  getDiscriminatorFieldFromSchema,
  getPropertySchema,
  ONE_OF_KEY,
  optionsList,
  toFieldPath,
  PROPERTIES_KEY,
  UI_FIELD_KEY,
  UI_OPTIONS_KEY,
  UI_WIDGET_KEY,
} from '@rjsf/utils';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { computeEnumOptions, getSelectedOption } from '../src/components/fields/layoutMultiSchemaFieldSelector.ts';
import SchemaField from '../src/components/fields/SchemaField.tsx';
import RadioWidget from '../src/components/widgets/RadioWidget.tsx';
import SelectWidget from '../src/components/widgets/SelectWidget.tsx';
import { getTestRegistry } from '../src/testing.ts';
import { SIMPLE_ONEOF, SIMPLE_ONEOF_OPTIONS, SIMPLE_ONEOF_SCHEMAS } from './testData/layoutData.ts';
import { setupConsoleErrorSuppression } from './testUtils.tsx';

vi.mock('@rjsf/utils', async (importOriginal) => ({
  ...(await importOriginal()),
  resolveWidget: vi.fn().mockImplementation((_schema: unknown, widget: unknown, widgets: Record<string, unknown>) => {
    const widgetToUse = widget === 'select' || widget === 'SelectWidget' ? 'SelectWidget' : 'RadioWidget';
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
} satisfies RJSFSchema;

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
  const { children, description, errors, help } = props;
  return (
    <div data-testid={FIELD_TEMPLATE_TEST_ID}>
      {description}
      {children}
      {errors}
      {help}
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
      schema = SIMPLE_ONEOF,
      uiSchema = {},
      disabled = false,
      hideError = false,
      errorSchema = {},
      required = false,
      autofocus = false,
      name = '',
    } = overrideProps;
    return {
      // required FieldProps stubbed
      autofocus,
      name,
      readonly: false,
      required,
      // end required FieldProps
      disabled,
      formData,
      fieldPath,
      id,
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
      // Named the way a layout grid names it for a discriminated cell, so it renders within the `FieldTemplate` and
      // with the resolution `SchemaField` gives every field, in place of the options
      uiSchema: { ...uiSchema, [UI_FIELD_KEY]: 'LayoutMultiSchemaField', 'ui:fieldReplacesAnyOrOneOf': true },
      errorSchema,
      hideError,
      onBlur: vi.fn(),
      onChange: vi.fn(),
      onFocus: vi.fn(),
    };
  }
  /** Renders the field with a `FieldTemplate` and a selector widget that record the props they were handed */
  function renderRecording(overrideProps: Partial<FieldProps> = {}, presentation?: ThemePresentation) {
    const recordTemplateProps = vi.fn<(props: FieldTemplateProps) => void>();
    const recordWidgetProps = vi.fn<(props: WidgetProps) => void>();
    function RecordingFieldTemplate(props: FieldTemplateProps) {
      recordTemplateProps(props);
      return <FakeFieldTemplate {...props} />;
    }
    function RecordingRadioWidget(props: WidgetProps) {
      recordWidgetProps(props);
      return <WrappedRadioWidget {...props} />;
    }
    const props = getProps(overrideProps);

    render(
      <SchemaField
        {...props}
        registry={getTestRegistry(
          props.schema,
          {},
          { FieldErrorTemplate: FakeFieldErrorTemplate, FieldTemplate: RecordingFieldTemplate },
          { SelectWidget: WrappedSelectWidget, RadioWidget: RecordingRadioWidget },
          undefined,
          undefined,
          presentation,
        )}
      />,
    );

    return { templateProps: recordTemplateProps.mock.lastCall?.[0], widgetProps: recordWidgetProps.mock.lastCall?.[0] };
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
    const props = getProps({ schema });
    expect(() => render(<SchemaField {...props} />)).toThrow(expectedError);
  });
  test('default render with SIMPLE_ONEOF schema', async () => {
    const selectorField = getDiscriminatorFieldFromSchema(SIMPLE_ONEOF)!;
    const props = getProps({ schema: { ...SIMPLE_ONEOF, title: undefined } });

    const { rerender } = render(<SchemaField {...props} />);

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
    rerender(<SchemaField {...props} formData={newFormData} />);

    // Checkbox should now be checked
    expect(input).toBeChecked();
  });
  test('custom selector field, title and widget in uiSchema, formData, has error', async () => {
    const selectorField = 'name';
    const props = getProps({
      schema: oneOfSchema,
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
    render(<SchemaField {...props} />);

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
    const retrievedOptions = (oneOfSchema[ONE_OF_KEY] as RJSFSchema[]).map((opt) =>
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
      schema: oneOfSchema,
      formData: { name: 'first_option', flag: true },
      uiSchema,
    });
    render(<SchemaField {...props} />);

    const button = screen.getByRole('combobox');
    // select the second option, whose schema has the `unique_to_second` field
    await user.selectOptions(button, '1');

    const retrievedOptions = (oneOfSchema[ONE_OF_KEY] as RJSFSchema[]).map((opt) =>
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
      schema: oneOfSchema,
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
    render(<SchemaField {...props} />);

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
      schema: oneOfSchema,
      formData: { name: 'first_option', flag: true },
      uiSchema,
    });
    render(<SchemaField {...props} />);

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
      schema: { ...oneOfSchema, [ANY_OF_KEY]: oneOfSchema[ONE_OF_KEY] },
      formData: { name: 'first_option', flag: true },
      uiSchema,
    });
    render(<SchemaField {...props} />);

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
      schema: oneOfSchema,
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
    render(<SchemaField {...props} />);

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
  test('ui:hideError null reads as false, showing errors despite props.hideError true', () => {
    const uiSchemaFromJson: GenericObjectType = {
      [UI_OPTIONS_KEY]: { optionsSchemaSelector: 'name' },
      'ui:hideError': null,
    };
    const props = getProps({
      schema: oneOfSchema,
      formData: oneOfData,
      errorSchema: NESTED_ERROR_SCHEMA,
      uiSchema: uiSchemaFromJson,
      hideError: true,
    });
    render(<SchemaField {...props} />);

    const fakeFieldErrorTemplate = screen.queryByTestId(FIELD_ERROR_TEST_ID);
    expect(fakeFieldErrorTemplate).toBeInTheDocument();
    expect(fakeFieldErrorTemplate).toHaveTextContent(getByPath<string[]>(props.errorSchema, [ERRORS_KEY]).join(''));
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
      formData: { answer: '1', runner: { name: 'runner-1', ratio: 0 } },
    });

    render(<SchemaField {...props} />);

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
      schema: { ...SIMPLE_ONEOF, [ONE_OF_KEY]: [] },
      uiSchema: { 'ui:hideError': true },
      hideError: false,
    });
    render(<SchemaField {...props} />);

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
      schema: { ...oneOfSchema, [ONE_OF_KEY]: [] },
      uiSchema: {
        [UI_OPTIONS_KEY]: {
          optionsSchemaSelector: selectorField,
          hideError: false,
        },
      },
      hideError: false,
    });
    render(<SchemaField {...props} />);

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
      schema: SIMPLE_ONEOF,
      hideError: true,
      errorSchema: NOT_SHOWN_ERROR_SCHEMA,
    });
    render(<SchemaField {...props} />);

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
  describe('the styling its FieldTemplate applies', () => {
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
  });
  describe('its plan', () => {
    test('hands its template and its widget one plan, whose template label names the widget', () => {
      const { templateProps, widgetProps } = renderRecording();

      expect(templateProps?.presentation).toBeDefined();
      expect(widgetProps?.presentation).toBe(templateProps?.presentation);
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      expect(templateProps?.displayLabel).toBe(true);
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      expect(widgetProps?.hideLabel).toBe(true);
    });
    test('hands its template the same plan across a change of data when its selector names no type', () => {
      const recordTemplateProps = vi.fn<(props: FieldTemplateProps) => void>();
      function RecordingFieldTemplate(props: FieldTemplateProps) {
        recordTemplateProps(props);
        return <FakeFieldTemplate {...props} />;
      }
      const options: RJSFSchema[] = SIMPLE_ONEOF_SCHEMAS.map((option) => ({
        ...option,
        properties: { answer: { default: (option.properties!.answer as RJSFSchema).default } },
      }));
      const schema: RJSFSchema = { ...SIMPLE_ONEOF, oneOf: options };
      const props = getProps({ schema, formData: { answer: '1' } });
      const registry = getTestRegistry(
        schema,
        {},
        { FieldErrorTemplate: FakeFieldErrorTemplate, FieldTemplate: RecordingFieldTemplate },
        { SelectWidget: WrappedSelectWidget, RadioWidget: WrappedRadioWidget },
      );
      const { rerender } = render(<SchemaField {...props} registry={registry} />);
      rerender(<SchemaField {...props} formData={{ answer: '1', note: 'x' }} registry={registry} />);

      const plans = recordTemplateProps.mock.calls.map(([templateProps]) => templateProps.presentation);
      expect(plans.length).toBeGreaterThan(1);
      expect(plans.at(-1)).toBe(plans[0]);
    });
    test('has a widget a theme declares as drawing its label draw it, with the template drawing none', () => {
      const { templateProps, widgetProps } = renderRecording({}, { widgets: { RadioWidget: { label: 'self' } } });

      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      expect(templateProps?.displayLabel).toBe(false);
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      expect(widgetProps?.hideLabel).toBe(false);
      expect(widgetProps?.presentation?.label.by).toBe('self');
    });
  });

  describe('a deprecated schema and ui:disabled', () => {
    const deprecatedSchema: RJSFSchema = { ...SIMPLE_ONEOF, deprecated: true };

    test('appends the deprecation marker to its FieldTemplate label by default', () => {
      const { templateProps, widgetProps } = renderRecording({ schema: deprecatedSchema });

      expect(templateProps?.label).toBe('Simple (deprecated)');
      expect(templateProps?.hidden).toBe(false);
      expect(templateProps?.disabled).toBe(false);
      // The widget's label is the plan's, marker included
      expect(widgetProps?.label).toBe('Simple (deprecated)');
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
    test('disables the field and its widget for a ui:disabled', () => {
      const { templateProps, widgetProps } = renderRecording({ uiSchema: { 'ui:disabled': true } });

      expect(templateProps?.disabled).toBe(true);
      expect(widgetProps?.disabled).toBe(true);
    });
    // `ui:disabled` overrides in both directions, resolved with `??`
    test('keeps an inherited disabled selector disabled for ui:disabled null', () => {
      const { templateProps, widgetProps } = renderRecording({
        disabled: true,
        uiSchema: JSON.parse('{"ui:disabled": null}'),
      });
      expect(templateProps?.disabled).toBe(true);
      expect(widgetProps?.disabled).toBe(true);
      screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeDisabled());
    });

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

      render(<SchemaField {...props} />);

      await user.click(screen.getAllByRole('radio')[1]);

      expect(props.onChange).toHaveBeenCalledWith({ [selectorField]: '2' }, props.fieldPath, undefined, DEFAULT_ID);
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
    test('reads the value of a selector property written as a $ref off the definition it names', () => {
      const options: RJSFSchema[] = [
        { type: 'object', properties: { kind: { $ref: '#/definitions/catKind' }, meow: { type: 'string' } } },
        { type: 'object', properties: { kind: { $ref: '#/definitions/dogKind' }, bark: { type: 'string' } } },
      ];
      const schema: RJSFSchema = {
        definitions: {
          catKind: { title: 'Cat', type: 'string', const: 'cat' },
          dogKind: { title: 'Dog', type: 'string', const: 'dog' },
        },
        discriminator: { propertyName: 'kind' },
        oneOf: options,
      };
      const { schemaUtils } = getTestRegistry(schema);
      const enumOptions = computeEnumOptions(schema, options, schemaUtils);
      expect(enumOptions.map(({ label, value }) => ({ label, value }))).toEqual([
        { label: 'Cat', value: 'cat' },
        { label: 'Dog', value: 'dog' },
      ]);
      expect(getPropertySchema(enumOptions[1].schema, 'kind')).toEqual(expect.objectContaining({ type: 'string' }));
      expect(getSelectedOption(enumOptions, 'kind', 'dog')).toBe(enumOptions[1].schema);
    });
    test('hands out each option as retrieving it gives, across changes of the data, when its selector is written in place', () => {
      const options: RJSFSchema[] = [
        { type: 'object', properties: { kind: { type: 'string', default: 'cat' }, meow: { type: 'string' } } },
        { type: 'object', properties: { kind: { type: 'string', default: 'dog' }, bark: { type: 'string' } } },
      ];
      const schema: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf: options };
      const { schemaUtils } = getTestRegistry(schema);
      const typed = computeEnumOptions(schema, options, schemaUtils, undefined, { kind: 'cat', meow: 'p' });
      const typedOn = computeEnumOptions(schema, options, schemaUtils, undefined, { kind: 'cat', meow: 'pu' });
      expect(typed.map(({ value }) => value)).toEqual(['cat', 'dog']);
      expect(typed[0].schema).toBe(schemaUtils.retrieveSchema(options[0], { kind: 'cat', meow: 'p' }));
      expect(typedOn[0].schema).toBe(typed[0].schema);
      expect(typedOn[1].schema).toBe(typed[1].schema);
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
