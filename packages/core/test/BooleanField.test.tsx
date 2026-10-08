import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

import {
  createFormComponent,
  expectToHaveBeenCalledWithFormData,
  getSelectedOptionValue,
  setupConsoleWarnSuppression,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

const CustomWidget = () => <div id='custom' />;

describe('BooleanField', () => {
  const rootSelect = (node: Element) => node.querySelector<HTMLSelectElement>('select#root')!;
  const texts = (node: Element) => [...rootSelect(node).options].map((option) => option.text);
  const radioTexts = (node: Element) =>
    [...node.querySelectorAll<HTMLInputElement>('input[type=radio]')].map(
      (radio) => radio.closest('label')?.textContent,
    );

  it('should pass ui:placeholder to a select widget', () => {
    const CustomSelect = ({ placeholder }: WidgetProps) => <div id='boolean-placeholder'>{placeholder}</div>;

    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      widgets: { SelectWidget: CustomSelect },
      uiSchema: { 'ui:widget': 'select', 'ui:placeholder': 'Yes or no?' },
    });

    expect(node.querySelector('#boolean-placeholder')).toHaveTextContent('Yes or no?');
  });

  it('should render a boolean field', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
    });

    expect(node.querySelectorAll('.rjsf-field input[type=checkbox]')).toHaveLength(1);
  });

  it('should render a boolean field with the expected id', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
    });

    expect(node.querySelector('.rjsf-field input[type=checkbox]')).toHaveAttribute('id', 'root');
  });

  it('should render a boolean field with a label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        title: 'foo',
      },
    });

    expect(node.querySelector('.rjsf-field label span')).toHaveTextContent('foo');
  });

  it('should render a required asterisk when the boolean field is required and schema requires true', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'boolean',
            title: 'Agree',
            const: true,
          },
        },
        required: ['foo'],
      },
    });

    expect(node.querySelector('.rjsf-field span.required')).toHaveTextContent('*');
  });

  describe('HTML5 required attribute', () => {
    it('should render a required attribute for simple required fields', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
            },
          },
          required: ['foo'],
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses const with a true value', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              const: true,
            },
          },
          required: ['foo'],
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses an enum with a single value of true', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              enum: [true],
            },
          },
          required: ['foo'],
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses an anyOf with a single value of true', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              anyOf: [
                {
                  const: true,
                },
              ],
            },
          },
          required: ['foo'],
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses a oneOf with a single value of true', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              oneOf: [
                {
                  const: true,
                },
              ],
            },
          },
          required: ['foo'],
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });

    it('should add a required attribute if the schema uses an allOf with a value of true', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            foo: {
              type: 'boolean',
              allOf: [
                {
                  const: true,
                },
              ],
            },
          },
          required: ['foo'],
        },
      });

      expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('required', '');
    });
  });

  it('should render a single label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        title: 'foo',
      },
    });

    expect(node.querySelectorAll('.rjsf-field label')).toHaveLength(1);
  });

  it('should render a description', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        description: 'my description',
      },
    });

    const description = node.querySelector('.field-description');
    expect(description).toHaveTextContent('my description');
  });

  it('should not pass ui:enumNames to the widget, whose enumOptions already apply it', () => {
    const widget = vi.fn((_: WidgetProps) => null);
    createFormComponent({
      schema: { type: 'boolean' },
      uiSchema: { 'ui:widget': widget, 'ui:enumNames': ['On', 'Off'] },
    });

    const { options } = widget.mock.lastCall![0];
    expect(options).not.toHaveProperty('enumNames');
    expect(options.enumOptions).toEqual([
      { label: 'On', value: true },
      { label: 'Off', value: false },
    ]);
  });

  it('should pass uiSchema to custom widget', () => {
    const CustomCheckboxWidget = ({ uiSchema }: WidgetProps) => (
      <div id='custom-ui-option-value'>{uiSchema?.custom_field_key['ui:options'].test}</div>
    );

    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        description: 'my description',
      },
      widgets: {
        CheckboxWidget: CustomCheckboxWidget,
      },
      uiSchema: {
        custom_field_key: {
          'ui:widget': 'checkbox',
          'ui:options': {
            test: 'foo',
          },
        },
      },
    });

    expect(node.querySelector('#custom-ui-option-value')).toHaveTextContent('foo');
  });

  it('should render the description using provided description field', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        description: 'my description',
      },
      templates: {
        DescriptionFieldTemplate: ({ description }) => (
          <div className='field-description'>{description} overridden</div>
        ),
      },
    });

    const description = node.querySelector('.field-description');
    expect(description).toHaveTextContent('my description overridden');
  });

  it('should assign a default value', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: true,
      },
    });

    expect(node.querySelector('.rjsf-field input')).toHaveAttribute('checked', '');
  });

  it('formData should default to undefined', async () => {
    const { node, onSubmit } = createFormComponent({
      schema: { type: 'boolean' },
      // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
      noValidate: true,
    });
    await submitForm(node, user);
    expectToHaveBeenCalledWithFormData(onSubmit, undefined, true);
  });

  it('should focus on required radio missing data when focusOnFirstField and shows error', async () => {
    const { node, onError } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          // string enum keeps the field absent from initial formData; required booleans
          // default to false (PR #5170), which satisfies AJV and suppresses the error.
          bool: {
            type: 'string',
            enum: ['a', 'b'],
          },
        },
        required: ['bool'],
      },
      focusOnFirstError: true,
      uiSchema: { bool: { 'ui:widget': 'radio' } },
    });
    const focusSpys = [vi.fn(), vi.fn()];
    const inputs = node.querySelectorAll('input[id^=root_bool]');
    expect(inputs).toHaveLength(2);
    let errorInputs = node.querySelectorAll('.form-group.rjsf-field-error input[id^=root_bool]');
    expect(errorInputs).toHaveLength(0);
    // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
    // Object.defineProperty is used because userEvent.setup() patches HTMLElement.prototype.focus as
    // a getter-only, making simple assignment throw in strict mode
    Object.defineProperty(inputs[0], 'focus', { value: focusSpys[0], writable: true, configurable: true });
    Object.defineProperty(inputs[1], 'focus', { value: focusSpys[1], writable: true, configurable: true });
    // The focus overrides don't work unless fire event happens
    await submitForm(node, user, true);
    expect(onError).toHaveBeenLastCalledWith([
      expect.objectContaining({ message: "must have required property 'bool'" }),
    ]);
    expect(focusSpys[0]).toHaveBeenCalled();
    expect(focusSpys[1]).not.toHaveBeenCalled();
    errorInputs = node.querySelectorAll('.form-group.rjsf-field-error input[id^=root_bool]');
    expect(errorInputs).toHaveLength(2);
  });

  it('should focus on required radio missing data when focusOnFirstField and hides error', async () => {
    const { node, onError } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          // string enum keeps the field absent from initial formData; required booleans
          // default to false (PR #5170), which satisfies AJV and suppresses the error.
          bool: {
            type: 'string',
            enum: ['a', 'b'],
          },
        },
        required: ['bool'],
      },
      focusOnFirstError: true,
      uiSchema: { bool: { 'ui:widget': 'radio', 'ui:hideError': true } },
    });
    const focusSpys = [vi.fn(), vi.fn()];
    const inputs = node.querySelectorAll('input[id^=root_bool]');
    expect(inputs).toHaveLength(2);
    let errorInputs = node.querySelectorAll('.form-group.rjsf-field-error input[id^=root_bool]');
    expect(errorInputs).toHaveLength(0);
    // Since programmatically triggering focus does not call onFocus, change the focus method to a spy
    // Object.defineProperty is used because userEvent.setup() patches HTMLElement.prototype.focus as
    // a getter-only, making simple assignment throw in strict mode
    Object.defineProperty(inputs[0], 'focus', { value: focusSpys[0], writable: true, configurable: true });
    Object.defineProperty(inputs[1], 'focus', { value: focusSpys[1], writable: true, configurable: true });
    // The focus overrides don't work unless fire event happens
    await submitForm(node, user, true);
    expect(onError).toHaveBeenLastCalledWith([
      expect.objectContaining({ message: "must have required property 'bool'" }),
    ]);
    expect(focusSpys[0]).toHaveBeenCalled();
    expect(focusSpys[1]).not.toHaveBeenCalled();
    errorInputs = node.querySelectorAll('.form-group.rjsf-field-error input[id^=root_bool]');
    expect(errorInputs).toHaveLength(0);
  });

  it('should handle a change event', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
    });

    await user.click(node.querySelector('input')!);

    expectToHaveBeenCalledWithFormData(onChange, true, 'root');
  });

  it('should fill field with data', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
      initialFormData: true,
    });

    expect(node.querySelector('.rjsf-field input')).toHaveAttribute('checked', '');
  });

  it('should render radio widgets with the expected id', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
      uiSchema: { 'ui:widget': 'radio' },
    });

    expect(node.querySelector('.field-radio-group')).toHaveAttribute('id', 'root');
  });

  it('should have default enum option labels for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
      initialFormData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Yes', 'No']);
  });

  it('should support enum option ordering for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        enum: [false, true],
      },
      initialFormData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['No', 'Yes']);
  });

  it('should support ui:enumNames for radio widgets', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      initialFormData: true,
      uiSchema: { 'ui:widget': 'radio', 'ui:enumNames': ['Yes', 'No'] },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Yes', 'No']);
  });

  it('should support oneOf titles for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        oneOf: [
          {
            const: true,
            title: 'Yes',
          },
          {
            const: false,
            title: 'No',
          },
        ],
      },
      initialFormData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Yes', 'No']);
  });

  it('should support anyOf titles for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        anyOf: [
          {
            const: true,
            title: 'Yes',
          },
          {
            const: false,
            title: 'No',
          },
        ],
      },
      formData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Yes', 'No']);
  });

  it('should render the anyOf, with the oneOf options within it, when the anyOf options are not all constants', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        oneOf: [
          { const: true, title: 'Yes' },
          { const: false, title: 'No' },
        ],
        anyOf: [{ title: 'A' }, { title: 'B' }],
      },
      formData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labelsOf = (group: string) =>
      [].map.call(node.querySelectorAll(`${group} label`), (label: Element) => label.textContent);
    expect(labelsOf('#root__anyof_select')).toEqual(['A', 'B']);
    expect(labelsOf('#root')).toEqual(['Yes', 'No']);
  });

  it.each<[string, RJSFSchema, UiSchema]>([
    ['is empty', { type: 'boolean', anyOf: [] }, { 'ui:widget': 'radio' }],
    [
      'holds only boolean schemas',
      { type: 'boolean', anyOf: [true, false] },
      { 'ui:field': 'BooleanField', 'ui:fieldReplacesAnyOrOneOf': true, 'ui:widget': 'radio' },
    ],
  ])('should offer Yes/No for a boolean whose anyOf %s', (_, schema, uiSchema) => {
    const { node } = createFormComponent({ schema, uiSchema });

    expect(radioTexts(node)).toEqual(['Yes', 'No']);
  });

  it('should offer Yes/No when rendered directly for a boolean whose anyOf is not made of constants', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean', anyOf: [{ type: 'boolean' }] },
      uiSchema: { 'ui:field': 'BooleanField', 'ui:fieldReplacesAnyOrOneOf': true, 'ui:widget': 'radio' },
    });

    expect(radioTexts(node)).toEqual(['Yes', 'No']);
  });

  describe('titled constant options (#5309)', () => {
    const titledSchema: RJSFSchema = {
      type: 'boolean',
      title: 'Answer',
      oneOf: [
        { const: true, title: 'Affirmative' },
        { const: false, title: 'Negative' },
      ],
    };

    it('should default to a select that shows the option titles and the field label', async () => {
      const { node, onChange } = createFormComponent({ schema: titledSchema });

      expect(texts(node)).toEqual(['', 'Affirmative', 'Negative']);
      expect(node.querySelector('label[for=root]')).toHaveTextContent('Answer');
      expect(node.querySelector('input[type=checkbox]')).not.toBeInTheDocument();
      await user.selectOptions(rootSelect(node), 'Negative');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: false }), 'root');
    });

    it('should keep a widget the uiSchema names', () => {
      const { node } = createFormComponent({ schema: titledSchema, uiSchema: { 'ui:widget': 'checkbox' } });

      expect(node.querySelector('input[type=checkbox]')).toBeInTheDocument();
      expect(node.querySelector('select')).not.toBeInTheDocument();
    });

    it('should default to a select when a ui:title in uiSchema.oneOf labels the options', () => {
      const uiSchema: UiSchema = { oneOf: [{ 'ui:title': 'Accept' }, {}] };
      const { node } = createFormComponent({
        schema: { type: 'boolean', oneOf: [{ const: true }, { const: false }] },
        uiSchema,
      });

      expect(texts(node)).toContain('Accept');
      expect(node.querySelector('input[type=checkbox]')).not.toBeInTheDocument();
    });

    it.each<[string, RJSFSchema]>([
      ['untitled options', { type: 'boolean', anyOf: [{ const: true }, { const: false }] }],
      ['a single titled option', { type: 'boolean', oneOf: [{ const: true, title: 'I agree' }] }],
    ])('should keep the checkbox for %s', (_, schema) => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector('input[type=checkbox]')).toBeInTheDocument();
      expect(node.querySelector('select')).not.toBeInTheDocument();
    });
  });

  it('should give an anyOf of single-value enums the same Yes/No labels as the const spelling', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean', anyOf: [{ enum: [true] }, { enum: [false] }] },
      uiSchema: { 'ui:widget': 'select' },
    });

    expect(texts(node)).toEqual(['', 'Yes', 'No']);
  });

  describe('ui:enumNames and ui:enumOrder beside constant options', () => {
    const consoleWarnSuppression = setupConsoleWarnSuppression();
    const ignoredWarning = expect.stringContaining('sets ui:enumNames or ui:enumOrder');
    const constantsWarning = expect.stringContaining(
      'but its options come from its constant `oneOf`, so they are ignored. Label those options with a `title` or a ' +
        '`ui:title` in `uiSchema.oneOf`, and list them in the order to show them.',
    );
    const titledSchema: RJSFSchema = {
      type: 'boolean',
      oneOf: [
        { const: true, title: 'Y' },
        { const: false, title: 'N' },
      ],
    };

    it.each<[string, UiSchema['ui:enumNames']]>([
      ['array', ['Affirmative', 'Negative']],
      ['record', { true: 'Affirmative', false: 'Negative' }],
    ])('should not label constant options with the %s spelling of ui:enumNames', (_, enumNames) => {
      // `ui:enumNames` names only `enum` values, as it does in `optionsList()`
      const uiSchema = { 'ui:widget': 'select', 'ui:enumNames': enumNames };
      const constants = createFormComponent({
        schema: { type: 'boolean', anyOf: [{ const: true }, { const: false }] },
        uiSchema,
      });
      const enumSpelling = createFormComponent({ schema: { type: 'boolean', enum: [true, false] }, uiSchema });

      expect(texts(constants.node)).toEqual(['', 'Yes', 'No']);
      expect(texts(enumSpelling.node)).toEqual(['', 'Affirmative', 'Negative']);
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('"root" sets ui:enumNames or ui:enumOrder, which apply only to `enum` values'),
      );
    });

    it('should read the constant options before an enum that ui:enumNames labels, and warn', () => {
      const { node } = createFormComponent({
        schema: { type: 'boolean', enum: [true, false], oneOf: [{ const: true }, { const: false }] },
        uiSchema: { 'ui:widget': 'select', 'ui:enumNames': ['Accept', 'Decline'] },
      });

      expect(texts(node)).toEqual(['', 'Yes', 'No']);
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(
          'but it shows its constant `oneOf` options rather than its `enum`, so they are ignored. Label those ' +
            'options with a `title` or a `ui:title` in `uiSchema.oneOf`, and list them in the order to show them, ' +
            'or drop the `oneOf` to show the `enum`.',
        ),
      );
    });

    it('should not point at an empty enum, which dropping the oneOf would leave with nothing to show', () => {
      createFormComponent({
        schema: { type: 'boolean', enum: [], oneOf: [{ const: true }, { const: false }] },
        uiSchema: { 'ui:widget': 'select', 'ui:enumNames': ['Accept', 'Decline'] },
      });

      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(constantsWarning);
    });

    it('should keep the order of the constant options over ui:enumOrder, and warn', () => {
      const { node } = createFormComponent({
        schema: titledSchema,
        uiSchema: { 'ui:widget': 'select', 'ui:enumOrder': [false, true] },
      });

      expect(texts(node)).toEqual(['', 'Y', 'N']);
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledWith(ignoredWarning);
    });

    it.each<[string, RJSFSchema, UiSchema['ui:enumOrder'], string[]]>([
      ['only a wildcard', titledSchema, ['*'], ['', 'Y', 'N']],
      ['the order the options already have', titledSchema, [true, false], ['', 'Y', 'N']],
      ['the only option', { type: 'boolean', oneOf: [{ const: true, title: 'Y' }] }, [true], ['', 'Y']],
    ])('should not warn for a ui:enumOrder of %s, which changes nothing', (_, schema, enumOrder, expected) => {
      const { node } = createFormComponent({ schema, uiSchema: { 'ui:widget': 'select', 'ui:enumOrder': enumOrder } });

      expect(texts(node)).toEqual(expected);
      expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalledWith(ignoredWarning);
    });

    it('should not point at the enum when dropping the anyOf would show the constant oneOf instead', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'boolean',
          enum: [true, false],
          anyOf: [{ const: true }, { const: false }],
          oneOf: [
            { const: true, title: 'A' },
            { const: false, title: 'B' },
          ],
        },
        uiSchema: { 'ui:widget': 'select', 'ui:enumNames': ['Accept', 'Decline'] },
      });

      expect(texts(node)).toEqual(['', 'Yes', 'No']);
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(
          'but it shows its constant `anyOf` options rather than its `enum`, so they are ignored. Label those ' +
            'options with a `title` or a `ui:title` in `uiSchema.anyOf`, and list them in the order to show them.',
        ),
      );
    });

    it('should not point a checkbox beside an enum at the enum, which dropping the oneOf would not show', () => {
      const { node } = createFormComponent({
        schema: { type: 'boolean', enum: [true, false], oneOf: [{ const: true }, { const: false }] },
        uiSchema: { 'ui:enumNames': ['Accept', 'Decline'] },
      });

      expect(node.querySelector('input[type=checkbox]')).toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(constantsWarning);
    });

    it('should keep the checkbox for untitled options that only ui:enumNames names, and warn', () => {
      const { node } = createFormComponent({
        schema: { type: 'boolean', oneOf: [{ const: true }, { const: false }] },
        uiSchema: { 'ui:enumNames': ['Accept', 'Decline'] },
      });

      expect(node.querySelector('input[type=checkbox]')).toBeInTheDocument();
      expect(node.querySelector('select')).not.toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledWith(ignoredWarning);
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      [
        'a reordering ui:enumOrder alone, which shows no order on the checkbox',
        { type: 'boolean', oneOf: [{ const: true }, { const: false }] },
        { 'ui:enumOrder': [false, true] },
      ],
      [
        'a wildcard ui:enumOrder alone, which shows no order on the checkbox',
        { type: 'boolean', oneOf: [{ const: true }, { const: false }] },
        { 'ui:enumOrder': ['*'] },
      ],
      [
        'a single option, whose checkbox no label could turn into a select',
        { type: 'boolean', oneOf: [{ const: true }] },
        { 'ui:enumNames': ['I agree'] },
      ],
    ])('should keep the checkbox and not warn for %s', (_, rendered, uiSchema) => {
      const { node } = createFormComponent({ schema: rendered, uiSchema });

      expect(node.querySelector('input[type=checkbox]')).toBeInTheDocument();
      expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalledWith(ignoredWarning);
    });

    it.each<[string, UiSchema['ui:widget']]>([
      ['checkbox', 'checkbox'],
      ['CheckboxWidget', 'CheckboxWidget'],
      ['hidden', 'hidden'],
      ['a custom widget', CustomWidget],
    ])('should not warn when rendered through %s', (_, widget) => {
      createFormComponent({
        schema: { type: 'boolean', oneOf: [{ const: true }, { const: false }] },
        uiSchema: { 'ui:widget': widget, 'ui:enumNames': ['Accept', 'Decline'], 'ui:enumOrder': [false, true] },
      });

      expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalledWith(ignoredWarning);
    });
  });

  it('should fall back to the oneOf when the anyOf is empty', () => {
    // Every option of an empty list is vacuously a constant, so the emptiness has to be checked on its own
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        anyOf: [],
        oneOf: [
          { const: true, title: 'Y' },
          { const: false, title: 'N' },
        ],
      },
      uiSchema: { 'ui:widget': 'select' },
    });

    expect(texts(node)).toEqual(['', 'Y', 'N']);
  });

  describe('an enum alongside an anyOf or oneOf that is not made of constants (#5319)', () => {
    const consoleWarnSuppression = setupConsoleWarnSuppression();
    const schema: RJSFSchema = { type: 'boolean', enum: [true, false], oneOf: [{ title: 'Y' }, { title: 'N' }] };

    it('should render the enum as a select', async () => {
      const { node, onChange } = createFormComponent({ schema, uiSchema: { 'ui:widget': 'select' } });

      expect(texts(node)).toEqual(['', 'Yes', 'No']);
      await user.selectOptions(rootSelect(node), 'No');
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: false }), 'root');
    });

    it('should render the enum as radios', async () => {
      const { node, onChange } = createFormComponent({ schema, uiSchema: { 'ui:widget': 'radio' } });

      expect(radioTexts(node)).toEqual(['Yes', 'No']);
      await user.click(node.querySelectorAll<HTMLInputElement>('.field-radio-group input')[0]);
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: true }), 'root');
    });

    it.each<[string, RJSFSchema, UiSchema, string[]]>([
      [
        'label the enum with ui:enumNames',
        schema,
        { 'ui:widget': 'select', 'ui:enumNames': ['Accept', 'Decline'] },
        ['', 'Accept', 'Decline'],
      ],
      ['apply ui:enumOrder', schema, { 'ui:widget': 'select', 'ui:enumOrder': [false, true] }, ['', 'No', 'Yes']],
      [
        'read the anyOf before a constant oneOf, as SchemaField does',
        {
          type: 'boolean',
          enum: [true, false],
          anyOf: [{ title: 'A' }, { title: 'B' }],
          oneOf: [
            { const: true, title: 'Y' },
            { const: false, title: 'N' },
          ],
        },
        { 'ui:widget': 'select' },
        ['', 'Yes', 'No'],
      ],
      [
        'read the enum when the oneOf mixes constants with a boolean schema',
        {
          type: 'boolean',
          enum: [true, false],
          oneOf: [{ const: true, title: 'Y' }, { const: false, title: 'N' }, false],
        },
        { 'ui:widget': 'select' },
        ['', 'Yes', 'No'],
      ],
    ])('should %s', (_, rendered, uiSchema, expected) => {
      const { node } = createFormComponent({ schema: rendered, uiSchema });

      expect(texts(node)).toEqual(expected);
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      ['oneOf', schema, { 'ui:widget': 'select' }],
      [
        'anyOf',
        { type: 'boolean', enum: [true, false], anyOf: [{ title: 'A' }, { title: 'B' }] },
        { 'ui:widget': 'select' },
      ],
      ['oneOf, which an empty ui:enumNames leaves unlabelled,', schema, { 'ui:widget': 'select', 'ui:enumNames': [] }],
      [
        'oneOf, which ui:enumNames names only in part,',
        schema,
        { 'ui:widget': 'select', 'ui:enumNames': { true: 'Accept' } },
      ],
      [
        'oneOf, titled through uiSchema.oneOf,',
        { type: 'boolean', enum: [true, false], oneOf: [{ description: 'y' }, { description: 'n' }] },
        { 'ui:widget': 'radio', oneOf: [{ 'ui:title': 'Y' }, {}] },
      ],
    ])('should warn that the %s titles are not shown', (_, warnedSchema, uiSchema) => {
      createFormComponent({ schema: warnedSchema, uiSchema });

      const keyword = warnedSchema.anyOf ? 'anyOf' : 'oneOf';
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(`"root" has an \`enum\` beside \`${keyword}\` options`),
      );
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      [
        'the enum is labelled by ui:enumNames',
        schema,
        { 'ui:widget': 'select', 'ui:enumNames': ['Accept', 'Decline'] },
      ],
      [
        'ui:enumNames names the enum values as they are spelled',
        schema,
        { 'ui:widget': 'select', 'ui:enumNames': ['true', 'false'] },
      ],
      ['it renders as a checkbox', schema, { 'ui:widget': 'checkbox' }],
      ['it renders as a CheckboxWidget', schema, { 'ui:widget': 'CheckboxWidget' }],
      ['it is hidden', schema, { 'ui:widget': 'hidden' }],
      ['it renders through a custom widget', schema, { 'ui:widget': CustomWidget }],
      [
        'ui:enumOrder drops the only value ui:enumNames leaves unnamed',
        schema,
        { 'ui:widget': 'select', 'ui:enumNames': { true: 'Accept' }, 'ui:enumOrder': [true] },
      ],
      [
        'the oneOf has no titles to hide',
        { type: 'boolean', enum: [true, false], oneOf: [{ description: 'x' }, { not: { const: true } }] },
        { 'ui:widget': 'radio' },
      ],
      [
        'the oneOf read after a non-constant anyOf has no titles to hide',
        {
          type: 'boolean',
          enum: [true, false],
          anyOf: [{ not: { const: null } }],
          oneOf: [{ const: true }, { const: false }],
        },
        { 'ui:widget': 'select' },
      ],
    ])('should not warn when %s', (_, unwarnedSchema, uiSchema) => {
      createFormComponent({ schema: unwarnedSchema, uiSchema });

      expect(consoleWarnSuppression.consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('has an `enum` beside'),
      );
    });

    it.each<[string, RJSFSchema['oneOf'], UiSchema]>([
      [
        'its own titles',
        [
          { const: true, title: 'Y' },
          { const: false, title: 'N' },
        ],
        { 'ui:widget': 'select' },
      ],
      [
        'a ui:title in uiSchema.oneOf',
        [{ const: true }, { const: false }],
        { 'ui:widget': 'select', oneOf: [{}, { 'ui:title': 'N' }] },
      ],
    ])('should warn that a oneOf read after a non-constant anyOf, titled by %s, is not shown', (_, oneOf, uiSchema) => {
      const { node } = createFormComponent({
        schema: { type: 'boolean', enum: [true, false], anyOf: [{ not: { const: null } }], oneOf },
        uiSchema,
      });

      expect(texts(node)).toEqual(['', 'Yes', 'No']);
      expect(consoleWarnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(
          '"root" has an `enum` beside an `anyOf` whose options aren\'t all `const` schemas and which is read ' +
            "before its `oneOf`, so its options come from the `enum` and the `oneOf` titles aren't shown.",
        ),
      );
    });
  });

  it('should keep an explicitly empty title on a constant option', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean', oneOf: [{ const: true, title: '' }, { const: false }] },
      uiSchema: { 'ui:widget': 'select' },
    });

    expect(texts(node)).toEqual(['', '', 'No']);
  });

  it('should select the constant, not a discriminator property, when the schema carries a discriminator', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'boolean',
        discriminator: { propertyName: 'kind' },
        oneOf: [
          { const: true, title: 'A' },
          { const: false, title: 'B' },
        ],
      },
      uiSchema: { 'ui:widget': 'select' },
    });

    await user.selectOptions(rootSelect(node), 'B');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: false }), 'root');
  });

  describe('an enum beside constant options', () => {
    it('should offer every constant option, leaving one the enum excludes to validation', () => {
      const { node } = createFormComponent({
        schema: { type: 'boolean', enum: [true], oneOf: [{ const: true }, { const: false }] },
        uiSchema: { 'ui:widget': 'select' },
      });

      expect(texts(node)).toEqual(['', 'Yes', 'No']);
    });

    it('should show the default the constant options give as selected', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          required: ['a'],
          properties: {
            a: {
              type: 'boolean',
              enum: [true],
              oneOf: [
                { const: false, title: 'No way' },
                { const: true, title: 'Sure' },
              ],
            },
          },
        },
        uiSchema: { a: { 'ui:widget': 'select' } },
      });

      expect(getSelectedOptionValue(node.querySelector<HTMLSelectElement>('select#root_a')!)).toBe('No way');
    });

    it('should keep a chosen option the enum excludes, and fail it on submit', async () => {
      const { node, onChange, onError } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            a: {
              type: ['boolean', 'null'],
              enum: [true, false],
              oneOf: [
                { const: true, title: 'Yes' },
                { const: false, title: 'No' },
                { const: null, title: 'Unknown' },
              ],
            },
          },
        },
        uiSchema: { a: { 'ui:widget': 'select' } },
      });

      const select = node.querySelector<HTMLSelectElement>('select#root_a')!;
      await user.selectOptions(select, 'Unknown');
      expectToHaveBeenCalledWithFormData(onChange, { a: null }, 'root_a');
      expect(getSelectedOptionValue(select)).toBe('Unknown');
      await submitForm(node, user);
      expect(onError).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'enum', property: '.a' })]);
    });

    it('should offer the constant options that an empty enum allows none of', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'boolean',
          enum: [],
          oneOf: [
            { const: true, title: 'A' },
            { const: false, title: 'B' },
          ],
        },
        uiSchema: { 'ui:widget': 'radio' },
      });

      expect(radioTexts(node)).toEqual(['A', 'B']);
    });

    it('should default to a select that lists as many options as SchemaField counted', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'boolean',
          enum: [true],
          oneOf: [
            { const: true, title: 'I agree' },
            { const: false, title: 'I disagree' },
          ],
        },
      });

      expect(texts(node)).toEqual(['', 'I agree', 'I disagree']);
    });
  });

  it('should label boolean enum values Yes/No, as it does boolean constants', () => {
    const { node } = createFormComponent({
      schema: { type: ['boolean', 'null'], enum: [true, false, null] },
      uiSchema: { 'ui:widget': 'select' },
    });

    expect(texts(node)).toEqual(['', 'Yes', 'No', 'null']);
  });

  it.each<[string, UiSchema, string[]]>([
    [
      'keep a ui:enumNames label spelled like its value rather than relabel it Yes/No',
      { 'ui:widget': 'select', 'ui:enumNames': ['true', 'false'] },
      ['', 'true', 'false'],
    ],
    [
      'label an enum Yes/No when only ui:globalOptions sets ui:enumNames, which optionsList() ignores',
      { 'ui:widget': 'select', 'ui:globalOptions': { enumNames: ['GA', 'GB'] } },
      ['', 'Yes', 'No'],
    ],
  ])('should %s', (_, uiSchema, expected) => {
    const { node } = createFormComponent({ schema: { type: 'boolean', enum: [true, false] }, uiSchema });

    expect(texts(node)).toEqual(expected);
  });

  it.each<[string, UiSchema['ui:enumOrder'], string[]]>([
    ['reorder', [false, true], ['No', 'Yes']],
    ['drop the value it does not list from', [true], ['Yes']],
  ])("should let ui:enumOrder %s a plain boolean's Yes/No, as it does any enum", (_, enumOrder, expected) => {
    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      uiSchema: { 'ui:widget': 'radio', 'ui:enumOrder': enumOrder },
    });

    expect(radioTexts(node)).toEqual(expected);
  });

  it('should label a null const with its value rather than sharing the false label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        oneOf: [{ const: null }, { const: true }, { const: false }],
      },
      uiSchema: { 'ui:widget': 'select' },
    });

    expect(texts(node)).toEqual(['', 'null', 'Yes', 'No']);
  });

  it('should support oneOf titles for radio widgets, overrides in uiSchema', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        oneOf: [
          {
            const: true,
            title: 'Yes',
          },
          {
            const: false,
            title: 'No',
          },
        ],
      },
      initialFormData: true,
      uiSchema: { 'ui:widget': 'radio', oneOf: [{ 'ui:title': 'Si!' }, { 'ui:title': 'No!' }] },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['Si!', 'No!']);
  });

  it('should preserve oneOf option ordering for radio widgets', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        oneOf: [
          {
            const: false,
            title: 'No',
          },
          {
            const: true,
            title: 'Yes',
          },
        ],
      },
      initialFormData: true,
      uiSchema: { 'ui:widget': 'radio' },
    });

    const labels = [].map.call(
      node.querySelectorAll('.field-radio-group label'),
      (label: Element) => label.textContent,
    );
    expect(labels).toEqual(['No', 'Yes']);
  });

  it('should support inline radio widgets', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      initialFormData: true,
      uiSchema: {
        'ui:widget': 'radio',
        'ui:options': {
          inline: true,
        },
      },
    });

    expect(node.querySelectorAll('.radio-inline')).toHaveLength(2);
  });

  it('should handle a focus event for radio widgets', async () => {
    const onFocus = vi.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'radio',
      },
      onFocus,
    });

    const element = node.querySelector('.field-radio-group');
    await user.click(node.querySelectorAll('input')[1]); // click "No" (false) radio at index 1
    expect(onFocus).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should handle a blur event for radio widgets', async () => {
    const onBlur = vi.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'radio',
      },
      onBlur,
    });

    const element = node.querySelector('.field-radio-group');
    await user.click(node.querySelectorAll('input')[1]); // focus "No" (false) radio at index 1
    await user.tab();
    expect(onBlur).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should support ui:enumNames for select, with overrides in uiSchema', () => {
    const { node } = createFormComponent({
      schema: { type: 'boolean' },
      initialFormData: true,
      uiSchema: { 'ui:widget': 'select', 'ui:enumNames': ['Si!', 'No!'] },
    });

    const labels = [].map.call(node.querySelectorAll('.rjsf-field option'), (label: Element) => label.textContent);
    expect(labels).toEqual(['', 'Si!', 'No!']);
  });

  it('should handle a focus event with checkbox', async () => {
    const onFocus = vi.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'select',
      },
      onFocus,
    });

    const element = node.querySelector('select');
    await user.click(element!); // focus select (currently has "false" selected at index 1)
    expect(onFocus).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should handle a blur event with select', async () => {
    const onBlur = vi.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'select',
      },
      onBlur,
    });

    const element = node.querySelector('select');
    await user.click(element!); // focus select (currently has "false" selected at index 1)
    await user.tab();
    expect(onBlur).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should render the widget with the expected id', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
    });

    expect(node.querySelector('input[type=checkbox]')).toHaveAttribute('id', 'root');
  });

  it('should render customized checkbox', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
      },
      widgets: {
        CheckboxWidget: CustomWidget,
      },
    });

    expect(node.querySelector('#custom')).toBeInTheDocument();
  });

  it('should handle a focus event with checkbox', async () => {
    const onFocus = vi.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'checkbox',
      },
      onFocus,
    });

    const element = node.querySelector('input');
    await user.tab(); // tab to focus the checkbox without toggling it
    expect(onFocus).toHaveBeenLastCalledWith(element?.id, false);
  });

  it('should handle a blur event with checkbox', async () => {
    const onBlur = vi.fn();
    const { node } = createFormComponent({
      schema: {
        type: 'boolean',
        default: false,
      },
      uiSchema: {
        'ui:widget': 'checkbox',
      },
      onBlur,
    });

    const element = node.querySelector('input');
    await user.tab(); // tab to focus the checkbox
    await user.tab(); // tab again to blur it
    expect(onBlur).toHaveBeenLastCalledWith(element?.id, false);
  });

  describe('Label', () => {
    const Widget = (props: WidgetProps) => <div id={`label-${props.label}`} />;

    const widgets = { Widget };

    it('should pass field name to widget if there is no title', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          boolean: {
            type: 'boolean',
          },
        },
      };
      const uiSchema = {
        boolean: {
          'ui:widget': 'Widget',
        },
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-boolean')).not.toBeNull();
    });

    it('should pass schema title to widget', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
      };
      const uiSchema = {
        'ui:widget': 'Widget',
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-test')).not.toBeNull();
    });

    it('should pass empty schema title to widget', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: '',
      };
      const uiSchema = {
        'ui:widget': 'Widget',
      };
      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector('#label-')).not.toBeNull();
    });
  });

  describe('SelectWidget', () => {
    it('should render a field that contains an enum of booleans', () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
    });

    it('should infer the value from an enum on change', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          enum: [true, false],
        },
      });

      expect(node.querySelectorAll('.rjsf-field select')).toHaveLength(1);
      const $select = node.querySelector<HTMLSelectElement>('.rjsf-field select');
      expect($select).toHaveValue('');
      const options = $select!.querySelectorAll('option');

      await user.selectOptions($select!, options[1]); // skip blank option, select enum[0] = true
      expect(getSelectedOptionValue($select!)).toEqual('true');
      expectToHaveBeenCalledWithFormData(onChange, true, 'root');
    });

    it('should render a string field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false],
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should assign a default value', () => {
      const { getFormData } = createFormComponent({
        schema: {
          enum: [true, false],
          default: true,
        },
      });
      expect(getFormData()).toBe(true);
    });

    it('should handle a change event', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          enum: [true, false],
        },
      });

      const $select = node.querySelector<HTMLSelectElement>('select')!;
      const options = $select.querySelectorAll('option');
      await user.selectOptions($select, options[2]); // skip blank option, select enum[1] = false

      expectToHaveBeenCalledWithFormData(onChange, false, 'root');
    });

    it('should render the widget with the expected id', () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false],
        },
      });

      expect(node.querySelector('select')).toHaveAttribute('id', 'root');
    });
  });
});
