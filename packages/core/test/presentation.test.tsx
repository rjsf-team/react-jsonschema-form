import type {
  ArrayFieldTemplateProps,
  FieldHelpProps,
  FieldPresentation,
  FieldProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  UiSchema,
  Widget,
  WidgetPresentationDeclaration,
  WidgetProps,
} from '@rjsf/utils';
import { errorId, fieldLabelId, helpId, optionHelpId, selectedOptionDescriptionId, titleId } from '@rjsf/utils';
import { screen, within } from '@testing-library/react';

import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import type { NoValFormProps } from './testUtils.tsx';
import { createFormComponent, setupConsoleWarnSuppression } from './testUtils.tsx';

const { FieldTemplate: CoreFieldTemplate } = generateTemplates();
const {
  TextWidget: CoreTextWidget,
  SelectWidget: CoreSelectWidget,
  CheckboxWidget: CoreCheckboxWidget,
  FileWidget: CoreFileWidget,
} = generateWidgets();
const { ArrayFieldTemplate: CoreArrayFieldTemplate, ObjectFieldTemplate: CoreObjectFieldTemplate } =
  generateTemplates();

/** Renders the form with a `FieldTemplate` and a `TextWidget` that record the plans they are handed, by id. Several
 * templates render the same id under a `oneOf`, so `outerTemplatePlans` keeps the plan of the outermost, which inherits
 * none
 */
function renderPlans(
  schema: RJSFSchema,
  props: { uiSchema?: UiSchema; formData?: unknown } & Record<string, unknown> = {},
) {
  const templatePlans = new Map<string, FieldPresentation | undefined>();
  const outerTemplatePlans = new Map<string, FieldPresentation | undefined>();
  const widgetPlans = new Map<string, FieldPresentation | undefined>();
  function FieldTemplate(templateProps: FieldTemplateProps) {
    templatePlans.set(templateProps.id, templateProps.presentation);
    if (!templateProps.presentation?.inherited) {
      outerTemplatePlans.set(templateProps.id, templateProps.presentation);
    }
    return <CoreFieldTemplate {...templateProps} />;
  }
  function TextWidget(widgetProps: WidgetProps) {
    widgetPlans.set(widgetProps.id, widgetProps.presentation);
    return <CoreTextWidget {...widgetProps} />;
  }
  const templates = { FieldTemplate };
  const widgets = { TextWidget };
  const result = createFormComponent({ schema, templates, widgets, ...props });
  const rerender = (newProps: Record<string, unknown>) => result.rerender({ schema, templates, widgets, ...newProps });
  return { templatePlans, outerTemplatePlans, widgetPlans, rerender };
}

describe('the plan SchemaField builds', () => {
  it('has the template label a text input with the id it names, and hands the widget the same plan', () => {
    const { templatePlans, widgetPlans } = renderPlans({
      type: 'object',
      properties: { foo: { type: 'string', title: 'Foo', description: 'Describes foo' } },
    });
    const plan = templatePlans.get('root_foo');
    expect(plan?.label).toEqual({ text: 'Foo', by: 'template', id: fieldLabelId('root_foo'), requiredMarker: false });
    expect(plan?.description).toEqual({ text: 'Describes foo', by: 'template', id: 'root_foo__description' });
    expect(plan?.control?.id).toBe('root_foo');
    expect(widgetPlans.get('root_foo')).toBe(plan);
  });

  it('leaves the label and description of a checkbox to the widget', () => {
    const { templatePlans } = renderPlans({
      type: 'object',
      properties: { done: { type: 'boolean', title: 'Done', description: 'Whether it is done' } },
    });
    const plan = templatePlans.get('root_done');
    expect(plan?.label.by).toBe('self');
    expect(plan?.description.by).toBe('self');
  });

  it('plans no control for an object, whose heading is its own', () => {
    const { templatePlans } = renderPlans({ type: 'object', title: 'Thing', properties: {} });
    const plan = templatePlans.get('root');
    expect(plan?.label.by).toBe('self');
    expect(plan?.control).toBeUndefined();
  });

  it("plans a field by the declarations the Form's presentation prop layers over core's", () => {
    const { templatePlans } = renderPlans(
      { type: 'object', properties: { foo: { type: 'string', title: 'Foo' } } },
      { presentation: { widgets: { TextWidget: { label: 'self' } } } },
    );
    expect(templatePlans.get('root_foo')?.label.by).toBe('self');
  });

  describe('a field named by its key, whatever ui:field names', () => {
    setupConsoleWarnSuppression();

    it.each<[string, UiSchema]>([
      ['its key in ui:field', { 'ui:field': 'StringField' }],
      ['a ui:field that names no field', { 'ui:field': 'StringFeild' }],
    ])('plans a field named by %s as one its type picked', (_, fooUiSchema) => {
      const { templatePlans } = renderPlans(
        { type: 'object', properties: { foo: { type: 'string', title: 'Foo' } } },
        { uiSchema: { foo: fooUiSchema } },
      );
      expect(templatePlans.get('root_foo')?.label.by).toBe('template');
    });
  });

  it('hands the selected option of a oneOf the plan of its field, whose template label names the control', () => {
    const { templatePlans, outerTemplatePlans, widgetPlans } = renderPlans(
      {
        type: 'object',
        properties: { foo: { title: 'Foo', oneOf: [{ type: 'string', title: 'Text' }, { type: 'number' }] } },
      },
      { formData: { foo: 'a' } },
    );
    const plan = widgetPlans.get('root_foo');
    expect(templatePlans.get('root_foo')).toBe(plan);
    expect(plan?.inherited).toBeDefined();
    expect(plan?.inherited).toBe(outerTemplatePlans.get('root_foo'));
    expect(plan?.inherited?.label).toEqual({
      text: 'Foo',
      by: 'template',
      id: fieldLabelId('root_foo'),
      requiredMarker: false,
    });
    expect(plan?.label).toEqual({ text: 'Foo', by: 'above', id: fieldLabelId('root_foo'), requiredMarker: false });
  });

  it("labels an untitled option by the field's label, under an option id, where the selector draws the field's", () => {
    const { widgetPlans } = renderPlans(
      { type: 'object', properties: { foo: { title: 'Foo', anyOf: [{ type: 'string' }, { type: 'number' }] } } },
      {
        formData: { foo: 'a' },
        presentation: { default: { label: 'self' }, fields: { AnyOfField: { label: 'self' } } },
      },
    );
    expect(widgetPlans.get('root_foo')?.label).toEqual({
      text: 'Foo',
      by: 'self',
      id: 'root_foo__optionLabel',
      requiredMarker: false,
    });
  });

  it("carries the field's ui:label false to an option given a uiSchema of its own", () => {
    const { widgetPlans } = renderPlans(
      {
        type: 'object',
        properties: {
          foo: { title: 'Foo', oneOf: [{ type: 'string', description: 'Describes the option' }, { type: 'number' }] },
        },
      },
      { formData: { foo: 'a' }, uiSchema: { foo: { 'ui:label': false, oneOf: [{ 'ui:placeholder': 'Type' }, {}] } } },
    );
    const plan = widgetPlans.get('root_foo');
    expect(plan?.label.by).toBe('none');
    expect(plan?.description.by).toBe('none');
  });

  it("hands the fallback UI's value field the plan of its field", () => {
    const { widgetPlans } = renderPlans(
      { type: 'object', properties: { foo: { type: ['string', 'number'], title: 'Foo' } } },
      { formData: { foo: 'a' }, useFallbackUiForUnsupportedType: true },
    );
    const plan = widgetPlans.get('root_foo');
    expect(plan?.inherited?.label.by).toBe('template');
    expect(plan?.label).toEqual({ text: 'Foo', by: 'above', id: fieldLabelId('root_foo'), requiredMarker: false });
  });

  it('plans a required checkbox as required, by marker and attribute alike, only where its schema demands true', () => {
    const { templatePlans } = renderPlans({
      type: 'object',
      required: ['agree', 'accept'],
      properties: { agree: { type: 'boolean' }, accept: { type: 'boolean', const: true } },
    });
    expect(templatePlans.get('root_agree')?.label.requiredMarker).toBe(false);
    expect(templatePlans.get('root_agree')?.control?.attributes.required).toBeUndefined();
    expect(templatePlans.get('root_accept')?.label.requiredMarker).toBe(true);
    expect(templatePlans.get('root_accept')?.control?.attributes.required).toBe(true);
  });

  it('marks the heading of a required object, which has no control', () => {
    const { templatePlans } = renderPlans({
      type: 'object',
      required: ['pet'],
      properties: { pet: { type: 'object', title: 'Pet', properties: { name: { type: 'string' } } } },
    });
    const plan = templatePlans.get('root_pet');
    expect(plan?.label).toMatchObject({ text: 'Pet', requiredMarker: true });
    expect(plan?.control).toBeUndefined();
  });

  it('hands the template the same plan on a render that changes nothing it reads', () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } } };
    const { templatePlans, rerender } = renderPlans(schema, { formData: { foo: 'a', bar: 'b' } });
    const before = templatePlans.get('root_foo');
    rerender({ formData: { foo: 'a', bar: 'c' } });
    expect(templatePlans.get('root_foo')).toBe(before);
  });

  it("re-renders none of an object's properties when only the object's own plan changes", () => {
    const renders = new Map<string, number>();
    function TextWidget(widgetProps: WidgetProps) {
      renders.set(widgetProps.id, (renders.get(widgetProps.id) ?? 0) + 1);
      return <CoreTextWidget {...widgetProps} />;
    }
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const widgets = { TextWidget };
    const { rerender } = createFormComponent({ schema, widgets, extraErrors: { __errors: ['first'] } });
    const before = renders.get('root_foo');
    rerender({ schema, widgets, extraErrors: { __errors: ['second'] } });

    expect(screen.getByText('second')).toBeInTheDocument();
    expect(renders.get('root_foo')).toBe(before);
  });

  it.each([
    ['shows', false, ['is wrong']],
    ['hides', true, []],
  ] satisfies [string, boolean, string[]][])(
    '%s the errors in the plan a ui:field is handed while ui:hideError is %s, keeping them in its rawErrors',
    (_, hideError, messages) => {
      const recordFieldProps = vi.fn<(props: FieldProps) => void>();
      function MyField(props: FieldProps) {
        recordFieldProps(props);
        const { id } = props;
        return <input id={id} />;
      }
      createFormComponent({
        schema: { type: 'object', properties: { foo: { type: 'string' } } },
        uiSchema: { foo: { 'ui:field': MyField, 'ui:hideError': hideError } },
        extraErrors: { foo: { __errors: ['is wrong'] } },
      });
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      const { presentation, rawErrors } = recordFieldProps.mock.lastCall![0];
      expect(presentation?.errors.messages).toEqual(messages);
      expect(presentation?.control?.attributes['aria-invalid']).toBe(hideError ? undefined : true);
      expect(rawErrors).toEqual(['is wrong']);
    },
  );

  // A field a named field frames for its own data takes its errors from the field naming it, through the context,
  // whatever the named field does with the deprecated `rawErrors`: where the named field hides them and it shows them,
  // it draws them itself
  it.each([
    ['hands on', false],
    ['drops', true],
  ])(
    "plans a framed field's own errors where the field naming it hides them, when that field %s its rawErrors",
    (_, dropsRawErrors) => {
      const framedTemplates: FieldTemplateProps[] = [];
      function FieldTemplate(templateProps: FieldTemplateProps) {
        if (templateProps.presentation?.inherited) {
          framedTemplates.push(templateProps);
        }
        return <CoreFieldTemplate {...templateProps} />;
      }
      function FramingField(props: FieldProps) {
        const { SchemaField } = props.registry.fields;
        // oxlint-disable-next-line typescript/no-deprecated -- a wrapper leaving the deprecated prop out
        const { rawErrors, ...withoutRawErrors } = props;
        const fieldProps = dropsRawErrors ? withoutRawErrors : props;
        return <SchemaField {...fieldProps} uiSchema={{ ...props.uiSchema, 'ui:hideError': false }} />;
      }
      createFormComponent({
        schema: { type: 'object', properties: { foo: { type: 'string' } } },
        uiSchema: { foo: { 'ui:field': FramingField, 'ui:hideError': true } },
        extraErrors: { foo: { __errors: ['is wrong'] } },
        showErrorList: false,
        templates: { FieldTemplate },
      });

      const framed = framedTemplates.at(-1)!;
      expect(framed.hasErrors).toBe(true);
      expect(framed.presentation?.errors).toMatchObject({ messages: ['is wrong'], by: 'template' });
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getAllByText('is wrong')).toHaveLength(1);
    },
  );

  // Beside the options the selected option is handed the named field's errors, so the field it frames takes none
  it('leaves the errors of a named field beside its options to the selected option, drawn once', () => {
    function FramingField(props: FieldProps) {
      const { SchemaField } = props.registry.fields;
      return <SchemaField {...props} uiSchema={{ ...props.uiSchema, 'ui:hideError': false }} />;
    }
    createFormComponent({
      schema: {
        type: 'object',
        properties: { a: { type: 'string' } },
        anyOf: [{ properties: { b: { type: 'string' } } }, { properties: { c: { type: 'number' } } }],
      },
      uiSchema: { 'ui:field': FramingField, 'ui:hideError': true, anyOf: [{ 'ui:hideError': false }, {}] },
      extraErrors: { __errors: ['is wrong'] },
      showErrorList: false,
    });

    expect(screen.getAllByText('is wrong')).toHaveLength(1);
  });

  // A framed field rendering the options itself, as below a named field the options give way to, hands the selected
  // option the errors it took from the context, so the option follows its own `ui:hideError` as it does unnamed
  it('hands the selected option of a framed field rendering the options the errors it took from the context', () => {
    function FramingField(props: FieldProps) {
      const { SchemaField } = props.registry.fields;
      return <SchemaField {...props} />;
    }
    const { node } = createFormComponent({
      schema: { anyOf: [{ type: 'string', title: 'Text' }, { type: 'number' }] },
      uiSchema: {
        'ui:field': FramingField,
        'ui:fieldReplacesAnyOrOneOf': true,
        'ui:hideError': true,
        anyOf: [{ 'ui:hideError': false }, {}],
      },
      extraErrors: { __errors: ['is wrong'] },
      showErrorList: false,
    });

    expect(screen.getAllByText('is wrong')).toHaveLength(1);
    expect(node.querySelectorAll('.rjsf-field-error')).toHaveLength(1);
  });

  describe("an anyOf field's option selector", () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          title: 'Foo',
          description: 'Describes foo',
          anyOf: [
            { title: 'Text', type: 'string' },
            { title: 'Number', type: 'number' },
          ],
        },
      },
    };

    it("is named through aria-labelledby by a label whose for names the option's control, which carries the field's id", () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelector(`#${fieldLabelId('root_foo')}`)?.closest('label')).toHaveAttribute('for', 'root_foo');
      expect(node.querySelector('input#root_foo')).toHaveAccessibleName('Foo');
      expect(node.querySelector('#root_foo__anyof_select')).toHaveAccessibleName('Foo');
    });

    it('is named by a fallback when its field has no title (#5586)', () => {
      const { node } = createFormComponent({
        schema: {
          oneOf: [
            { type: 'string', title: 'Text' },
            { type: 'number', title: 'Num' },
          ],
        },
        initialFormData: 'a',
      });

      expect(node.querySelector('#root__oneof_select')).toHaveAccessibleName('Select ...');
    });

    it('is named by its placeholder when its field has no title', () => {
      const { node } = createFormComponent({
        schema: {
          oneOf: [
            { type: 'string', title: 'Text' },
            { type: 'number', title: 'Num' },
          ],
        },
        uiSchema: { 'ui:placeholder': 'Pick a kind' },
        initialFormData: 'a',
      });

      expect(node.querySelector('#root__oneof_select')).toHaveAccessibleName('Pick a kind');
    });

    it('is a radiogroup named by a fallback when its field has no title', () => {
      const { node } = createFormComponent({
        schema: {
          oneOf: [
            { type: 'string', title: 'Text' },
            { type: 'number', title: 'Num' },
          ],
        },
        uiSchema: { 'ui:widget': 'radio', oneOf: [{}, {}] },
        initialFormData: 'a',
      });

      const group = node.querySelector('#root__oneof_select');
      expect(group).toHaveAttribute('role', 'radiogroup');
      expect(group).toHaveAccessibleName('Choose an option');
    });

    it("is named by the label the field's template draws, and described by the parts that render", () => {
      const { node } = createFormComponent({
        schema,
        extraErrors: { foo: { __errors: ['is wrong'] } },
      });
      const selector = node.querySelector('#root_foo__anyof_select')!;
      expect(selector).toHaveAttribute('aria-labelledby', fieldLabelId('root_foo'));
      expect(node.querySelector(`#${fieldLabelId('root_foo')}`)).toHaveTextContent('Foo');
      expect(selector).toHaveAttribute('aria-invalid', 'true');
      const describedBy = selector.getAttribute('aria-describedby')!.split(' ');
      expect(describedBy).toEqual(['root_foo__error', 'root_foo__description']);
      describedBy.forEach((describer) => expect(node.querySelector(`#${describer}`)).toBeInTheDocument());
    });

    // The schema of #5399, whose first option is an enum, so the option's own control is a select or radiogroup too
    const pick: RJSFSchema = {
      type: 'object',
      properties: { pick: { title: 'Pick', anyOf: [{ type: 'string', enum: ['a', 'b'] }, { type: 'number' }] } },
    };

    it("is a radiogroup named through aria-labelledby by the field's label under ui:widget radio", () => {
      const { node } = createFormComponent({ schema: pick, uiSchema: { pick: { 'ui:widget': 'radio' } } });
      // The option's own enum takes the field's ui:widget too, so it renders a second radiogroup beside the selector's
      const group = node.querySelector('#root_pick__anyof_select');
      expect(screen.getAllByRole('radiogroup', { name: 'Pick' })).toContain(group);
      expect(group).toHaveAttribute('aria-labelledby', fieldLabelId('root_pick'));
      expect(node.querySelector(`#${fieldLabelId('root_pick')}`)).toHaveTextContent('Pick');
    });

    it("hands its widget the field's title as a label drawn above it", () => {
      const selectorProps: WidgetProps[] = [];
      function SelectWidget(props: WidgetProps) {
        selectorProps.push(props);
        return <CoreSelectWidget {...props} />;
      }
      createFormComponent({ schema: pick, widgets: { SelectWidget } });
      const selector = selectorProps.find((props) => props.id === 'root_pick__anyof_select')!;
      expect(selector.label).toBe('Pick');
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      expect(selector.hideLabel).toBe(true);
      expect(selector.presentation?.label).toMatchObject({ by: 'above', id: fieldLabelId('root_pick') });
    });

    it("gives an option's own help an id of its own beside the field's", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { foo: { 'ui:help': 'Field help', anyOf: [{ 'ui:help': 'Option help' }] } },
      });
      expect(node.querySelectorAll(`#${helpId('root_foo')}`)).toHaveLength(1);
      expect(node.querySelector(`#${helpId('root_foo')}`)).toHaveTextContent('Field help');
      expect(node.querySelector(`#${optionHelpId('root_foo')}`)).toHaveTextContent('Option help');
      expect(node.querySelector('#root_foo')!.getAttribute('aria-describedby')!.split(' ')).toEqual(
        expect.arrayContaining([helpId('root_foo'), optionHelpId('root_foo')]),
      );
    });

    it('draws none of the parts a custom field rendered beside the options draws itself', () => {
      const selectorProps: WidgetProps[] = [];
      function SelectWidget(props: WidgetProps) {
        selectorProps.push(props);
        return <CoreSelectWidget {...props} />;
      }
      const MyField = ({ presentation }: FieldProps) => <span id='custom'>{presentation?.label.text}</span>;
      const { node } = createFormComponent({
        schema,
        uiSchema: { foo: { 'ui:field': MyField } },
        widgets: { SelectWidget },
      });
      const selector = selectorProps.find((props) => props.id === 'root_foo__anyof_select')!;
      expect(node.querySelector('#custom')).toHaveTextContent('Foo');
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      expect(selector.hideLabel).toBe(true);
      expect(selector.presentation?.label.by).toBe('none');
      expect(selector.presentation?.description.by).toBe('none');
      expect(node.querySelector('#root_foo__anyof_select')).not.toHaveAttribute('aria-labelledby');
    });

    it('is described, as the option below is, by none of the ids a custom field beside the options may not render', () => {
      const MyField = () => <span id='custom' />;
      const { node } = createFormComponent({
        schema,
        // An option given a uiSchema of its own renders its own field rather than the custom one (#5391)
        uiSchema: { foo: { 'ui:field': MyField, anyOf: [{}, {}] } },
        initialFormData: { foo: 'a' },
      });

      for (const control of [node.querySelector('#root_foo__anyof_select')!, node.querySelector('input#root_foo')!]) {
        const describers = control.getAttribute('aria-describedby')?.split(' ') ?? [];
        expect(describers).not.toContain('root_foo__XxxOf__description');
        describers.forEach((describer) => expect(node.querySelector(`#${describer}`)).toBeInTheDocument());
      }
    });

    it("draws no label of its own when the field's ui:label hides it", () => {
      const selectorProps: WidgetProps[] = [];
      function SelectWidget(props: WidgetProps) {
        selectorProps.push(props);
        return <CoreSelectWidget {...props} />;
      }
      createFormComponent({
        schema,
        uiSchema: { foo: { 'ui:label': false } },
        widgets: { SelectWidget },
        presentation: { fields: { AnyOfField: { label: 'self' } } },
      });
      const selector = selectorProps.find((props) => props.id === 'root_foo__anyof_select')!;
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      expect(selector.hideLabel).toBe(true);
    });

    it.each([
      ['is', false],
      ['is not', true],
    ])("%s invalid, or described by the field's errors, while ui:hideError is %s", (_, hideError) => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { foo: { 'ui:hideError': hideError } },
        extraErrors: { foo: { __errors: ['is wrong'] } },
      });
      const selector = node.querySelector('#root_foo__anyof_select')!;
      const describedBy = selector.getAttribute('aria-describedby')?.split(' ') ?? [];
      expect(selector.getAttribute('aria-invalid')).toBe(hideError ? null : 'true');
      expect(describedBy.includes(errorId('root_foo'))).toBe(!hideError);
    });
  });

  // The class and the help's error state follow the option's own errors and `ui:hideError`, as the deprecated
  // `rawErrors` its template is handed do, while its plan takes the errors as the field above shows them, or its own
  // where the field above hides them, so an option marked in error has the message its control is described by
  it.each([
    ['shows', true, false],
    ['hides', false, true],
  ])(
    "styles an anyOf option's template by whether the option %s the errors, whatever the field above does",
    (_, aboveHides, optionHides) => {
      const optionTemplates: FieldTemplateProps[] = [];
      function FieldTemplate(templateProps: FieldTemplateProps) {
        if (templateProps.presentation?.inherited) {
          optionTemplates.push(templateProps);
        }
        return <CoreFieldTemplate {...templateProps} />;
      }
      const optionHelps: FieldHelpProps[] = [];
      function FieldHelpTemplate(helpProps: FieldHelpProps) {
        if (helpProps.presentation?.inherited) {
          optionHelps.push(helpProps);
        }
        return null;
      }
      createFormComponent({
        schema: { type: 'object', properties: { foo: { anyOf: [{ type: 'string' }, { type: 'number' }] } } },
        uiSchema: { foo: { 'ui:hideError': aboveHides, anyOf: [{ 'ui:hideError': optionHides }, {}] } },
        extraErrors: { foo: { __errors: ['is wrong'] } },
        templates: { FieldTemplate, FieldHelpTemplate },
      });
      const option = optionTemplates.at(-1)!;
      expect(option.id).toBe('root_foo');
      expect(option.classNames?.split(' ').includes('rjsf-field-error')).toBe(!optionHides);
      expect(optionHelps.at(-1)?.hasErrors).toBe(!optionHides);
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop the class agrees with
      expect(option.rawErrors).toEqual(optionHides ? undefined : ['is wrong']);
      expect(option.presentation?.errors).toMatchObject({
        messages: ['is wrong'],
        by: aboveHides ? 'template' : 'above',
      });
    },
  );

  // Core's `WrapIfAdditionalTemplate` takes its `data-invalid` from `hasErrors` alone, in both its branches: an option
  // following its own `ui:hideError` rather than the field above's, and an extra key's row
  it.each([
    ['shows', true, false],
    ['hides', false, true],
  ])(
    "marks an anyOf option's and an extra key's wrapper data-invalid by whether each %s the errors",
    (_, aboveHides, optionHides) => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { foo: { anyOf: [{ type: 'string', title: 'Text' }, { type: 'number' }] } },
          additionalProperties: { type: 'string' },
        },
        uiSchema: {
          foo: { 'ui:hideError': aboveHides, anyOf: [{ 'ui:hideError': optionHides }, {}] },
          additionalProperties: { 'ui:hideError': optionHides },
        },
        initialFormData: { extra: 'value' },
        extraErrors: { foo: { __errors: ['is wrong'] }, extra: { __errors: ['is wrong'] } },
        showErrorList: false,
      });

      const optionWrapper = node.querySelector('#root_foo')?.closest('.rjsf-field');
      expect(optionWrapper?.hasAttribute('data-invalid')).toBe(!optionHides);
      const extraWrapper = node.querySelector('#root_extra')?.closest('.rjsf-field');
      expect(extraWrapper?.hasAttribute('data-invalid')).toBe(!optionHides);
    },
  );

  // A container takes its error state from its own errors and `ui:hideError`, as its `FieldTemplate` does, where the
  // plan's errors are the field above's
  it.each([
    ['object', 'shows', true, false],
    ['object', 'hides', false, true],
    ['array', 'shows', true, false],
    ['array', 'hides', false, true],
  ] satisfies ['object' | 'array', string, boolean, boolean][])(
    "hands an anyOf option's %s container hasErrors by whether the option %s the errors",
    (type, _, aboveHides, optionHides) => {
      const containers: (boolean | undefined)[] = [];
      function ObjectFieldTemplate(templateProps: ObjectFieldTemplateProps) {
        containers.push(templateProps.hasErrors);
        return null;
      }
      function ArrayFieldTemplate(templateProps: ArrayFieldTemplateProps) {
        containers.push(templateProps.hasErrors);
        return null;
      }
      const container: RJSFSchema =
        type === 'object' ? { type, properties: { a: { type: 'string' } } } : { type, items: { type: 'string' } };
      createFormComponent({
        schema: { anyOf: [container, { type: 'number' }] },
        uiSchema: { 'ui:hideError': aboveHides, anyOf: [{ 'ui:hideError': optionHides }, {}] },
        extraErrors: { __errors: ['wrong'] },
        templates: { ObjectFieldTemplate, ArrayFieldTemplate },
      });

      expect(containers.at(-1)).toBe(!optionHides);
    },
  );

  // No selector renders before an optional field has data, so the field's template label has no control to name
  describe("an optional anyOf field's option before the field has data", () => {
    const optional: UiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['array', 'object'] } };
    const arrays: RJSFSchema[] = [
      { type: 'array', items: { type: 'string' }, maxItems: 3 },
      { type: 'array', items: { type: 'string' }, minItems: 1 },
    ];
    const objects: RJSFSchema[] = [
      { type: 'object', properties: { bark: { type: 'string' } } },
      { type: 'object', properties: { meow: { type: 'string' } } },
    ];

    it.each([
      ['an array', arrays],
      ['an object', objects],
    ])("draws the field's title as the heading of %s with no title of its own", (_, anyOf) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { pets: { title: 'Pets', anyOf } } },
        uiSchema: optional,
      });

      expect(node.querySelector(`#${titleId('root_pets')}`)).toHaveTextContent(/^Pets$/);
    });

    it('keeps the title of an option that has its own', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { pets: { title: 'Pets', anyOf: [{ ...arrays[0], title: 'Short list' }, arrays[1]] } },
        },
        uiSchema: optional,
      });

      expect(node.querySelector(`#${titleId('root_pets')}`)).toHaveTextContent(/^Short list$/);
    });

    it.each([
      ['an array', arrays],
      ['an object', objects],
    ])("draws the field's description once, beneath the heading it hands %s", (_, anyOf) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { pets: { title: 'Pets', description: 'Some pets', anyOf } } },
        uiSchema: optional,
      });

      const descriptions = screen.getAllByText('Some pets');
      expect(descriptions).toHaveLength(1);
      const heading = node.querySelector(`#${titleId('root_pets')}`)!;
      expect(heading.compareDocumentPosition(descriptions[0])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it.each([
      ['an array', arrays],
      ['an object', objects],
    ])('hands %s its description where the field declares it draws its own label and description', (_, anyOf) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { pets: { title: 'Pets', description: 'Some pets', anyOf } } },
        uiSchema: optional,
        presentation: { fields: { AnyOfField: { label: 'self', description: 'self' } } },
      });

      const descriptions = screen.getAllByText('Some pets');
      expect(descriptions).toHaveLength(1);
      const heading = node.querySelector(`#${titleId('root_pets')}`)!;
      expect(heading.compareDocumentPosition(descriptions[0])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });

  describe('an untitled anyOf option beneath a field whose own component draws its label', () => {
    it.each([
      ['ui:title', {}, { pets: { 'ui:title': 'My Pets' } }, 'My Pets'],
      ['schema title', { title: 'Pets' }, {}, 'Pets'],
    ])("labels the option's control by the field's %s rather than its property name", (_, field, uiSchema, name) => {
      createFormComponent({
        schema: {
          type: 'object',
          properties: { pets: { ...field, anyOf: [{ type: 'string' }, { type: 'number' }] } },
        },
        uiSchema,
        presentation: { fields: { AnyOfField: { label: 'self' } } },
      });

      expect(screen.getByRole('textbox', { name })).toHaveAttribute('id', 'root_pets');
    });
  });

  describe('an object with properties beside its anyOf options', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      properties: { name: { type: 'string' } },
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };

    it("names their selector by the object's heading", () => {
      const { node } = createFormComponent({
        schema,
      });

      expect(node.querySelector('#root__anyof_select')).toHaveAttribute('aria-labelledby', titleId('root__XxxOf'));
      expect(node.querySelector('#root__anyof_select')).toHaveAccessibleName('Pet');
    });

    it.each([
      ['required marker', ['pet'], 'span.rjsf-required'],
      ['optional data control', [], 'button'],
    ])("names their selector by the heading's text alone, without its %s", (_, required, extra) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { pet: schema }, required },
        uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
        initialFormData: { pet: { name: 'Rex' } },
      });

      const title = node.querySelector('#root_pet__XxxOf__title');
      expect(title?.closest('legend')?.querySelector(extra)).toBeInTheDocument();
      expect(title?.querySelector(extra)).toBeNull();
      expect(node.querySelector('#root_pet__anyof_select')).toHaveAccessibleName('Pet');
    });

    it("marks their selector invalid while the object's errors show", () => {
      const { node } = createFormComponent({
        schema,
        extraErrors: { __errors: ['pick a pet'] },
      });

      expect(node.querySelector('#root__anyof_select')).toHaveAttribute('aria-invalid', 'true');
      expect(node.querySelector('#root__anyof_select')).toHaveAttribute('aria-describedby', errorId('root'));
    });

    // A layout grid renders no heading under the plan's label id, so pointing the selector at one would name nothing
    it('leaves their selector unnamed by a heading a layout grid rendered beside them does not draw', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['name'] }] } },
      });

      expect(node.querySelector('#root__anyof_select')).not.toHaveAttribute('aria-labelledby');
    });
  });

  it("gives a select's selected option description an id of its own beside the field's description", () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          color: {
            title: 'Color',
            description: 'Pick a color',
            oneOf: [
              { const: 'r', title: 'Red', description: 'Warm' },
              { const: 'b', title: 'Blue', description: 'Cool' },
            ],
          },
        },
      },
      initialFormData: { color: 'r' },
    });

    expect(node.querySelectorAll('#root_color__description')).toHaveLength(1);
    expect(node.querySelector('#root_color__description')).toHaveTextContent('Pick a color');
    expect(node.querySelector(`#${selectedOptionDescriptionId('root_color')}`)).toHaveTextContent('Warm');
    expect(node.querySelector('select#root_color')!.getAttribute('aria-describedby')!.split(' ')).toEqual(
      expect.arrayContaining(['root_color__description', selectedOptionDescriptionId('root_color')]),
    );
  });

  describe('a deprecated array whose option has its title', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          title: 'Tags',
          deprecated: true,
          items: { type: 'string' },
          anyOf: [
            { title: 'Tags', maxItems: 3 },
            { title: 'Long', minItems: 1 },
          ],
        },
      },
    };

    it('shows the Deprecated marker on its label, and no second heading for the option', () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector(`#${fieldLabelId('root_tags')}`)).toHaveTextContent('Tags (deprecated)');
      expect(node.querySelector('#root_tags__title')).not.toBeInTheDocument();
    });

    it('keeps the heading of an option titled differently, without the marker', () => {
      const tags = schema.properties!.tags as RJSFSchema;
      const { node } = createFormComponent({
        schema: { ...schema, properties: { tags: { ...tags, anyOf: [...tags.anyOf!].reverse() } } },
      });

      expect(node.querySelector(`#${fieldLabelId('root_tags')}`)).toHaveTextContent('Tags (deprecated)');
      expect(node.querySelector('#root_tags__title')).toHaveTextContent(/^Long$/);
    });
  });

  describe('a pure anyOf union object', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'Pet',
      anyOf: [
        { title: 'Dog', properties: { bark: { type: 'string' } } },
        { title: 'Cat', properties: { meow: { type: 'string' } } },
      ],
    };

    it('renders no object template beside its options, only the option, where the field draws its own label', () => {
      const titles = new Map<string, string>();
      // Draws its frame whatever it is handed, as every theme's template does
      function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
        titles.set(props.id, props.title);
        return <CoreObjectFieldTemplate {...props} />;
      }
      const { node } = createFormComponent({
        schema,
        templates: { ObjectFieldTemplate },
        presentation: { fields: { AnyOfField: { label: 'self' } } },
      });
      expect([...titles.keys()]).toEqual(['root']);
      expect(titles.get('root')).toBe('Dog');
      expect(node.querySelectorAll('fieldset')).toHaveLength(1);
    });

    it('keeps the heading of a custom field wrapping ObjectField', () => {
      const { ObjectField } = generateTheme().fields;
      const MyObject = (props: FieldProps) => <ObjectField {...props} />;
      const { node } = createFormComponent({
        schema: {
          type: 'object',
          properties: { o: { type: 'object', title: 'Thing', properties: { a: { type: 'string' } } } },
        },
        uiSchema: { o: { 'ui:field': MyObject } },
      });
      expect(node.querySelector('#root_o__title')).toHaveTextContent('Thing');
    });
  });

  describe('an anyOf field whose own component draws its label and description', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        opt: {
          type: 'array',
          title: 'Parent title',
          description: 'Parent description',
          items: { type: 'string' },
          anyOf: [
            { title: 'Short list', maxItems: 3 },
            { title: 'Long list', minItems: 1 },
          ],
        },
      },
    };

    it("has its option selector draw the field's label and description, as a theme whose template draws neither declares", () => {
      const selectorProps: WidgetProps[] = [];
      function SelectWidget(props: WidgetProps) {
        selectorProps.push(props);
        return <CoreSelectWidget {...props} />;
      }
      createFormComponent({
        schema,
        widgets: { SelectWidget },
        presentation: { fields: { AnyOfField: { label: 'self', description: 'self' } } },
      });

      const selector = selectorProps.find((props) => props.id === 'root_opt__anyof_select')!;
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
      expect(selector.hideLabel).toBe(false);
      expect(selector.label).toBe('Parent title');
      expect(selector.presentation?.description).toMatchObject({ by: 'self', text: 'Parent description' });
      expect(selector.presentation?.control?.id).toBe('root_opt__anyof_select');
    });
  });

  it("hands a theme's array template no heading for an option repeating nothing of its own", () => {
    const titles: string[] = [];
    function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
      titles.push(props.title);
      return <CoreArrayFieldTemplate {...props} />;
    }
    createFormComponent({
      schema: {
        type: 'object',
        properties: {
          opt: {
            type: 'array',
            title: 'Parent title',
            items: { type: 'object', properties: { a: { type: 'string' } } },
            anyOf: [{ maxItems: 3 }, { minItems: 1 }],
          },
        },
      },
      templates: { ArrayFieldTemplate },
    });

    expect(titles).toEqual(['']);
  });
});

describe('an anyOf/oneOf whose label follows the option it shows', () => {
  const pet: RJSFSchema = {
    title: 'Pet',
    oneOf: [
      { title: 'Dog', type: 'object', properties: { bark: { type: 'string' } } },
      { title: 'Cat', type: 'array', items: { type: 'string' } },
    ],
  };

  it('plans its label as naming its control through aria-labelledby, since a for would name no control', () => {
    const { outerTemplatePlans } = renderPlans({ type: 'object', properties: { pet } });

    expect(outerTemplatePlans.get('root_pet')?.control?.attributes['aria-labelledby']).toBe(fieldLabelId('root_pet'));
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Pet');
  });

  it("draws that label with no for in core's FieldTemplate", () => {
    const { node } = createFormComponent({ schema: { type: 'object', properties: { pet } } });

    expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).not.toHaveAttribute('for');
  });

  it('keeps the for while an option of another type renders a control under the field id', () => {
    const { outerTemplatePlans } = renderPlans(
      { type: 'object', properties: { pet: { ...pet, oneOf: [...pet.oneOf!, { title: 'Name', type: 'string' }] } } },
      { initialFormData: { pet: 'Rex' } },
    );

    expect(outerTemplatePlans.get('root_pet')?.control?.attributes['aria-labelledby']).toBeUndefined();
  });

  it('keeps a declared aria-labelledby while an option of another type renders a control under the field id', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: { pet: { ...pet, oneOf: [...pet.oneOf!, { title: 'Name', type: 'string' }] } },
      },
      initialFormData: { pet: 'Rex' },
      presentation: { fields: { OneOfField: { labelledBy: 'aria-labelledby' } } },
    });

    expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).not.toHaveAttribute('for');
    expect(node.querySelector('input#root_pet')).toHaveAttribute('aria-labelledby', fieldLabelId('root_pet'));
  });

  it.each<[string, RJSFSchema]>([
    ['an object field whose options name no properties beside them', { ...pet, type: 'object' }],
    [
      'an array field whose options take its type',
      { title: 'Pet', type: 'array', oneOf: [{ items: { type: 'string' } }, { items: { type: 'number' } }] },
    ],
    ['a field with an option rendering nothing', { ...pet, oneOf: [pet.oneOf![0], { title: 'None', type: 'null' }] }],
  ])('plans the label of %s as naming its control through aria-labelledby', (_, petSchema) => {
    const { outerTemplatePlans } = renderPlans({ type: 'object', properties: { pet: petSchema } });

    expect(outerTemplatePlans.get('root_pet')?.control?.attributes['aria-labelledby']).toBe(fieldLabelId('root_pet'));
  });

  it('names a multi-select array option by the for of the field label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          pet: {
            ...pet,
            oneOf: [
              { title: 'Breeds', type: 'array', uniqueItems: true, items: { enum: ['Lab', 'Pug'] } },
              pet.oneOf![0],
            ],
          },
        },
      },
    });

    const select = screen.getByRole('listbox');
    expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).toHaveAttribute('for', select.id);
    expect(select).not.toHaveAttribute('aria-labelledby');
    expect(select).toHaveAccessibleName('Pet');
  });

  it('names a file array option by the for of the field label', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          pet: {
            ...pet,
            oneOf: [{ title: 'Photos', type: 'array', items: { type: 'string', format: 'data-url' } }, pet.oneOf![0]],
          },
        },
      },
    });

    const input = node.querySelector('input[type="file"]')!;
    expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).toHaveAttribute('for', input.id);
    expect(input).not.toHaveAttribute('aria-labelledby');
    expect(input).toHaveAccessibleName('Pet');
  });

  it('keeps the for while an option given by a $ref renders a control under the field id', () => {
    const { outerTemplatePlans } = renderPlans(
      {
        type: 'object',
        definitions: { name: { type: 'string' } },
        properties: { pet: { ...pet, oneOf: [...pet.oneOf!, { $ref: '#/definitions/name' }] } },
      },
      { initialFormData: { pet: 'Rex' } },
    );

    expect(outerTemplatePlans.get('root_pet')?.control?.attributes['aria-labelledby']).toBeUndefined();
  });

  describe('an option rendering options of its own', () => {
    const nested = (inner: RJSFSchema[]): RJSFSchema => ({
      type: 'object',
      properties: {
        pet: {
          title: 'Pet',
          anyOf: [
            { title: 'Inner', anyOf: inner },
            { title: 'Other', type: 'object', properties: { b: { type: 'number' } } },
          ],
        },
      },
    });

    it("draws no for while its object option shows, since a for can't name the fieldset", () => {
      const { node } = createFormComponent({
        schema: nested([
          { type: 'object', properties: { a: { type: 'string' } } },
          { type: 'object', properties: { c: { type: 'string' } } },
        ]),
        initialFormData: { pet: { a: 'x' } },
      });

      expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).not.toHaveAttribute('for');
    });

    it('names a control its option shows through aria-labelledby', () => {
      const { node } = createFormComponent({
        schema: nested([{ type: 'string' }, { type: 'number' }]),
        initialFormData: { pet: 'x' },
      });

      const input = node.querySelector('input#root_pet');
      expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).not.toHaveAttribute('for');
      expect(input).toHaveAttribute('aria-labelledby', expect.stringContaining(fieldLabelId('root_pet')));
      expect(input).toHaveAccessibleName(expect.stringContaining('Pet'));
    });
  });

  it('keeps the for while an option that is a select of constants shows', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          pet: {
            title: 'Pet',
            anyOf: [{ type: 'string', oneOf: [{ const: 'a' }, { const: 'b' }] }, { type: 'number' }],
          },
        },
      },
      initialFormData: { pet: 'a' },
    });

    expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).toHaveAttribute('for', 'root_pet');
    expect(node.querySelector('select#root_pet')).toHaveAccessibleName('Pet');
  });
});

describe("an anyOf/oneOf field's label, by the field SchemaField renders the option shown with (#5709)", () => {
  /** Every `for` on the page names an element a `for` can label */
  function expectEveryForToNameAControl(node: Element) {
    for (const label of node.querySelectorAll('label[for]')) {
      const target = document.getElementById(label.getAttribute('for')!);
      expect(target?.matches('input, select, textarea, button, meter, output, progress')).toBe(true);
    }
  }

  it('draws no for where a type list option renders an alt-date', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: { when: { title: 'When', anyOf: [{ type: ['string', 'null'] }, { type: 'number' }] } },
      },
      uiSchema: { when: { anyOf: [{ 'ui:widget': 'alt-date' }, {}] } },
    });

    expect(node.querySelector(`#${fieldLabelId('root_when')}`)?.closest('label')).not.toHaveAttribute('for');
    expect(screen.getByRole('group', { name: 'When' })).toHaveAttribute('id', 'root_when');
  });

  it('names the select an option of array constants renders by the for', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: { pet: { title: 'Pet', anyOf: [{ type: 'array', enum: [[1], [2]] }, { type: 'string' }] } },
      },
      initialFormData: { pet: [1] },
    });

    const select = node.querySelector('select#root_pet')!;
    expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).toHaveAttribute('for', 'root_pet');
    expect(select).not.toHaveAttribute('aria-labelledby');
    expect(select).toHaveAccessibleName('Pet');
  });

  it('draws no for where an untyped option renders no control', () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { pet: { title: 'Pet', anyOf: [{}, { type: 'number' }] } } },
      initialFormData: { pet: 'x' },
    });

    expect(node.querySelector('#root_pet')).toBeNull();
    expectEveryForToNameAControl(node);
  });

  describe('an option that renders nothing, whatever would render it', () => {
    function NamedControl({ id }: FieldProps) {
      return <input id={id} />;
    }

    it.each<[string, RJSFSchema, NoValFormProps['uiSchema'], boolean]>([
      ['an empty option under the fallback UI', {}, undefined, true],
      ['an empty option a ui:field names', {}, { pet: { anyOf: [{ 'ui:field': NamedControl }, {}] } }, false],
      [
        'a null option a ui:field names',
        { type: 'null' },
        { pet: { anyOf: [{ 'ui:field': NamedControl }, {}] } },
        false,
      ],
    ])('draws no for for %s', (_name, option, uiSchema, useFallbackUiForUnsupportedType) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { pet: { title: 'Pet', anyOf: [option, { type: 'number' }] } } },
        uiSchema,
        initialFormData: { pet: option.type === 'null' ? null : 'x' },
        useFallbackUiForUnsupportedType,
      });

      expect(node.querySelector('#root_pet')).toBeNull();
      expectEveryForToNameAControl(node);
    });
  });

  it("names whatever the fallback UI renders for a multi-type option, through the for or the label's id", () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: { pet: { title: 'Pet', anyOf: [{ type: ['string', 'number'] }, { type: 'boolean' }] } },
      },
      initialFormData: { pet: 'x' },
      useFallbackUiForUnsupportedType: true,
    });

    expectEveryForToNameAControl(node);
  });

  it('draws no for where an option a $id names renders a field declared as named through aria-labelledby', () => {
    function GroupField({ id, presentation }: FieldProps) {
      return <div role='group' id={id} aria-labelledby={presentation?.control?.attributes['aria-labelledby']} />;
    }
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: { pet: { title: 'Pet', anyOf: [{ $id: 'GroupField', type: 'string' }, { type: 'number' }] } },
      },
      fields: { GroupField },
      presentation: { fields: { GroupField: { labelledBy: 'aria-labelledby' } } },
    });

    expect(node.querySelector(`#${fieldLabelId('root_pet')}`)?.closest('label')).not.toHaveAttribute('for');
    expect(screen.getByRole('group', { name: 'Pet' })).toHaveAttribute('id', 'root_pet');
  });
});

describe('a fallback field with no control for a label to name', () => {
  const val: RJSFSchema = { type: ['object', 'boolean'], title: 'Val', description: 'A value' };

  it.each([
    ['the template', undefined],
    ['the field itself', { fields: { FallbackField: { label: 'self' as const } } }],
  ])(
    "has the fallback UI's object value draw the heading and the description beneath it, where %s draws the label",
    (_, presentation) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val } },
        useFallbackUiForUnsupportedType: true,
        presentation,
      });

      const heading = node.querySelector(`#${titleId('root_val')}`);
      expect(heading).toHaveTextContent(/^Val$/);
      const descriptions = screen.getAllByText('A value');
      expect(descriptions).toHaveLength(1);
      const typeSelect = screen.getByRole('combobox');
      expect(typeSelect.compareDocumentPosition(heading!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(heading!.compareDocumentPosition(descriptions[0])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    },
  );

  it('draws the title and description of a field rendered through the unsupported-field template above it', () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { foo: { title: 'Foo', description: 'Desc foo' } } },
    });

    const title = node.querySelector(`#${titleId('root_foo')}`);
    expect(title).toHaveTextContent(/^Foo$/);
    const description = screen.getByText('Desc foo');
    const unsupported = node.querySelector('.rjsf-unsupported-field')!;
    expect(title!.compareDocumentPosition(description)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(description.compareDocumentPosition(unsupported)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(node.querySelector('label[for="root_foo"]')).toBeNull();
  });

  it('draws the title and description of an array with no items above the unsupported-field template', () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { arr: { type: 'array', title: 'Arr', description: 'Desc arr' } } },
    });

    const title = node.querySelector(`#${titleId('root_arr')}`);
    expect(title).toHaveTextContent(/^Arr$/);
    const description = screen.getByText('Desc arr');
    const unsupported = node.querySelector('.rjsf-unsupported-field')!;
    expect(title!.compareDocumentPosition(description)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(description.compareDocumentPosition(unsupported)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each([
    ['a field default', { fieldDefault: { label: 'template' as const, description: 'template' as const } }],
    ['the array field', { fields: { ArrayField: { label: 'template' as const, description: 'template' as const } } }],
  ])(
    'draws the title and description of an array with no items above the unsupported-field template where %s leaves them to the template',
    (_, presentation) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { arr: { type: 'array', title: 'Arr', description: 'Desc arr' } } },
        presentation,
      });

      const title = node.querySelector(`#${titleId('root_arr')}`);
      expect(title).toHaveTextContent(/^Arr$/);
      const description = screen.getByText('Desc arr');
      const unsupported = node.querySelector('.rjsf-unsupported-field')!;
      expect(title!.compareDocumentPosition(description)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(description.compareDocumentPosition(unsupported)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    },
  );
});

describe("the fallback UI's label, whatever its ui:field names (#5389)", () => {
  setupConsoleWarnSuppression();

  it.each<[string, UiSchema]>([
    ['no ui:field', {}],
    ['a ui:field naming FallbackField', { 'ui:field': 'FallbackField' }],
    ['a ui:field naming nothing', { 'ui:field': 'Nope' }],
  ])("is drawn once, by the field's template above the type selector, under %s", (_, valUiSchema) => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { val: { type: ['string', 'number'], title: 'Val' } } },
      uiSchema: { val: valUiSchema },
      useFallbackUiForUnsupportedType: true,
    });

    const labels = node.querySelectorAll('label[for="root_val"]');
    expect(labels).toHaveLength(1);
    const typeSelect = screen.getByRole('combobox', { name: 'Type' });
    expect(labels[0].compareDocumentPosition(typeSelect)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  // Without a plan, the caller is a custom field rather than this one, and that field draws no label of its own, so the
  // value field below the type selector draws it, however the form reached the custom field
  function OwnFallback(props: FieldProps) {
    const { FallbackField } = props.registry.fields;
    const { presentation: _presentation, ...rest } = props;
    return <FallbackField {...rest} />;
  }
  function StrippingFallback(props: FieldProps) {
    const { FallbackField } = props.registry.fields;
    const { presentation: _presentation, uiSchema, ...rest } = props;
    const { 'ui:field': _field, ...ownUiSchema } = uiSchema ?? {};
    return <FallbackField {...rest} uiSchema={ownUiSchema} />;
  }
  const val: RJSFSchema = { type: ['string', 'number'], title: 'Val' };

  it.each<[string, RJSFSchema, UiSchema]>([
    ['ui:field', val, { val: { 'ui:field': 'OwnFallback' } }],
    ["the schema's $id", { ...val, $id: 'OwnFallback' }, {}],
    ['a ui:field it then removes', val, { val: { 'ui:field': 'StrippingFallback' } }],
  ])(
    'is drawn once, by the value field, when a custom field reached through %s renders FallbackField without a plan',
    (_, valSchema, uiSchema) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { val: valSchema } },
        uiSchema,
        fields: { OwnFallback, StrippingFallback },
        useFallbackUiForUnsupportedType: true,
      });

      const typeSelect = screen.getByRole('combobox', { name: 'Type' });
      const value = screen.getByRole('textbox', { name: 'Val' });
      const labels = node.querySelectorAll('label[for="root_val"]');
      expect(labels).toHaveLength(1);
      expect(typeSelect.compareDocumentPosition(labels[0])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(typeSelect.compareDocumentPosition(value)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    },
  );
});

describe("the fallback UI's label of a boolean, however its widget is spelled (#5581)", () => {
  const namedCheckboxes: [string, UiSchema][] = [
    ["ui:widget: 'checkbox'", { 'ui:widget': 'checkbox' }],
    ["ui:widget: 'CheckboxWidget'", { 'ui:widget': 'CheckboxWidget' }],
  ];
  const spellings: [string, UiSchema][] = [
    ['no ui:widget', {}],
    ...namedCheckboxes,
    ["ui:options.widget: 'checkbox'", { 'ui:options': { widget: 'checkbox' } }],
    ['a key of its own', { 'ui:widget': 'OwnCheckbox' }],
  ];
  const renderVal = (val: RJSFSchema, valUiSchema: UiSchema, presentation?: NoValFormProps['presentation']) =>
    createFormComponent({
      schema: { type: 'object', properties: { val: { title: 'Val', ...val } } },
      uiSchema: { val: valUiSchema },
      widgets: { OwnCheckbox: CoreCheckboxWidget, OwnSwitch: CoreCheckboxWidget },
      presentation,
      useFallbackUiForUnsupportedType: true,
    });
  function expectLabelDrawnByCheckbox(node: Element) {
    screen.getByRole('checkbox', { name: 'Val' });
    expect(screen.getAllByText('Val')).toHaveLength(1);
    expect(node.querySelector('label[for="root_val"]')).not.toBeInTheDocument();
  }
  function expectLabelAboveTypeSelector(node: Element) {
    const label = node.querySelector('label[for="root_val"]');
    expect(label).toHaveTextContent('Val');
    expect(label!.compareDocumentPosition(screen.getByRole('combobox', { name: 'Type' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getAllByText('Val')).toHaveLength(1);
  }

  it.each<[string, UiSchema]>([
    ...spellings,
    // No boolean widget goes by these names, so the checkbox renders in their place
    ["ui:widget: 'updown'", { 'ui:widget': 'updown' }],
    ['a ui:widget naming nothing', { 'ui:widget': 'Nope' }],
  ])('is drawn by the checkbox below the type selector under %s', (_, valUiSchema) => {
    const { node } = renderVal({ type: ['boolean', 'string'] }, valUiSchema);

    expectLabelDrawnByCheckbox(node);
    expect(screen.getByRole('combobox', { name: 'Type' }).compareDocumentPosition(screen.getByRole('checkbox'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it.each(namedCheckboxes)(
    'starts on the boolean and is drawn by the checkbox whatever the order of the types under %s',
    (_, valUiSchema) => {
      const { node } = renderVal({ type: ['string', 'boolean'] }, valUiSchema);

      expectLabelDrawnByCheckbox(node);
    },
  );

  it.each(spellings)(
    'is drawn once by the template above the type selector, as declared, under %s',
    (_, valUiSchema) => {
      const { node } = renderVal({ type: ['boolean', 'string'] }, valUiSchema, {
        widgets: { CheckboxWidget: { label: 'template', description: 'template' } },
      });

      expectLabelAboveTypeSelector(node);
    },
  );

  it.each(spellings)('names the checkbox by the hidden label with ui:label false under %s', (_, valUiSchema) => {
    renderVal({ type: ['boolean', 'string'] }, { ...valUiSchema, 'ui:label': false });

    screen.getByRole('checkbox', { name: 'Val' });
    expect(screen.queryByText('Val')).not.toBeInTheDocument();
  });

  it.each<[string, UiSchema]>([
    ['radio', { 'ui:widget': 'radio' }],
    ['select', { 'ui:widget': 'select' }],
  ])('is drawn by the template above the type selector for a %s, which leaves its label to it', (_, valUiSchema) => {
    const { node } = renderVal({ type: ['boolean', 'string'] }, valUiSchema);

    expectLabelAboveTypeSelector(node);
  });

  // Under a `FallbackField` drawing its own label no template label is at stake, so where a widget's label sits decides
  // where its description goes, and `uncheckedIsFalse`, which is about `required`, has no say in it
  it.each<[string, Partial<WidgetPresentationDeclaration>, number]>([
    ["labelPlacement: 'beside', below", { labelPlacement: 'beside' }, Node.DOCUMENT_POSITION_PRECEDING],
    ['uncheckedIsFalse alone, above', { uncheckedIsFalse: true }, Node.DOCUMENT_POSITION_FOLLOWING],
  ])('places the description of a widget declaring %s the type selector', (_, declared, position) => {
    renderVal(
      { type: ['boolean', 'string'], description: 'Desc' },
      { 'ui:widget': 'OwnSwitch' },
      {
        fields: { FallbackField: { label: 'self' } },
        widgets: { OwnSwitch: { label: 'self', description: 'self', ...declared } },
      },
    );

    expect(screen.getByText('Desc').compareDocumentPosition(screen.getByRole('combobox', { name: 'Type' }))).toBe(
      position,
    );
  });

  // With one type there is no selector, so the value field renders alone, and a label from the template would sit above
  // a checkbox left with an empty label of its own
  it.each<[string, UiSchema]>([...spellings, ['the component', { 'ui:widget': CoreCheckboxWidget }]])(
    'is drawn by the checkbox for a lone boolean naming FallbackField under %s',
    (_, valUiSchema) => {
      const { node } = renderVal({ type: 'boolean' }, { ...valUiSchema, 'ui:field': 'FallbackField' });

      expectLabelDrawnByCheckbox(node);
    },
  );
});

describe('a ui:field wrapping SchemaField under its own id', () => {
  function Wrapper(props: FieldProps) {
    const { registry, uiSchema } = props;
    const { SchemaField } = registry.fields;
    const { 'ui:field': _field, ...ownUiSchema } = uiSchema ?? {};
    return (
      <div className='wrapper'>
        <SchemaField {...props} uiSchema={ownUiSchema} />
      </div>
    );
  }

  it('leaves its label and description to the field it wraps, and its help and errors drawn once', () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { x: { type: 'string', title: 'X', description: 'About x' } } },
      uiSchema: { x: { 'ui:field': Wrapper, 'ui:help': 'Help me' } },
      extraErrors: { x: { __errors: ['is wrong'] } },
    });
    const input = node.querySelector('#root_x')!;
    const describers = input.getAttribute('aria-describedby')!.split(' ');

    expect(screen.getAllByText('About x')).toHaveLength(1);
    expect(screen.getAllByText('Help me')).toHaveLength(1);
    expect(node.querySelectorAll(`#${errorId('root_x')}`)).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'X' })).toBe(input);
    describers.forEach((id) => expect(node.querySelector(`#${id}`)).not.toBeNull());
    expect(describers).toEqual(expect.arrayContaining([errorId('root_x'), helpId('root_x'), 'root_x__description']));
  });

  it("names the selector of a union it wraps by the field's label text, as no label names it", () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { x: { title: 'X', anyOf: [{ type: 'string' }, { type: 'number' }] } } },
      uiSchema: { x: { 'ui:field': Wrapper } },
      initialFormData: { x: 'a' },
    });

    expect(node.querySelector('#root_x__anyof_select')).toHaveAccessibleName('X');
  });

  it('keeps the heading of an ObjectField a ui:field names from repeating under an option titled as the field', () => {
    createFormComponent({
      schema: {
        type: 'object',
        title: 'Pet',
        description: 'About pet',
        properties: { name: { type: 'string' } },
        oneOf: [
          { title: 'Pet', description: 'About pet', properties: { a: { type: 'string' } } },
          { title: 'B', properties: { b: { type: 'string' } } },
        ],
      },
      uiSchema: { 'ui:field': 'ObjectField' },
    });

    expect(screen.getAllByText('About pet')).toHaveLength(1);
    // Once as the object's heading and once as the selector's first option
    expect(screen.getAllByText('Pet')).toHaveLength(2);
  });

  it('draws no for on the label of a union it wraps while the option shown is an object', () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: {
          x: {
            title: 'X',
            oneOf: [
              { type: 'object', title: 'A', properties: { a: { type: 'string' } } },
              { type: 'object', title: 'B', properties: { b: { type: 'string' } } },
            ],
          },
        },
      },
      uiSchema: { x: { 'ui:field': Wrapper } },
    });

    expect(screen.getByText('X').closest('label')).not.toHaveAttribute('for');
  });

  describe('a union it wraps', () => {
    function renderWrappedUnion(
      option: RJSFSchema,
      formData: unknown,
      optionUiSchema: UiSchema = {},
      field: RJSFSchema = {},
      fieldUiSchema: UiSchema = {},
    ) {
      return createFormComponent({
        schema: { type: 'object', properties: { x: { title: 'X', ...field, oneOf: [option, { type: 'number' }] } } },
        uiSchema: { x: { 'ui:field': Wrapper, ...fieldUiSchema, oneOf: [optionUiSchema, {}] } },
        initialFormData: { x: formData },
      }).node;
    }
    function wrapperHanding(hand: (props: FieldProps, ownUiSchema: UiSchema) => Partial<FieldProps>) {
      return function HandingWrapper(props: FieldProps) {
        const { SchemaField } = props.registry.fields;
        const { 'ui:field': _field, ...ownUiSchema } = props.uiSchema ?? {};
        return <SchemaField {...props} uiSchema={ownUiSchema} {...hand(props, ownUiSchema)} />;
      };
    }
    const belowWrapperLabel = '#root_x__XxxOf__label';
    const untitledOptions: [string, RJSFSchema, unknown][] = [
      ['a string', { type: 'string' }, 'a'],
      ['a boolean', { type: 'boolean' }, true],
      ['an object', { type: 'object', properties: { a: { type: 'string' } } }, { a: 'a' }],
      ['an array of items', { type: 'array', items: { type: 'string' } }, ['a']],
    ];

    it.each(untitledOptions)(
      'draws its label once where the option shown is %s with no title',
      (_name, option, formData) => {
        const node = renderWrappedUnion(option, formData);

        expect(screen.getAllByText('X')).toHaveLength(1);
        expect(node.querySelector(belowWrapperLabel)).toBeNull();
        expect(node.querySelector('[for="root_x__XxxOf"]')).toBeNull();
      },
    );

    it.each<[string, RJSFSchema]>([
      ['titled the same', { type: 'string', title: 'X' }],
      ['deprecated and titled the same', { type: 'string', title: 'X', deprecated: true }],
    ])('leaves its label to an option %s', (_name, option) => {
      const node = renderWrappedUnion(option, 'a');

      expect(node.querySelector(belowWrapperLabel)).toBeNull();
      expect(node.querySelector('label[for="root_x"]')).toHaveTextContent('X');
    });

    it('leaves its label to an option with no ui:label of its own under a ui:label its field gives over the form-wide one', () => {
      createFormComponent({
        schema: { type: 'object', properties: { x: { title: 'X', oneOf: [{ type: 'string' }, { type: 'number' }] } } },
        uiSchema: {
          'ui:globalOptions': { label: false },
          x: { 'ui:field': Wrapper, 'ui:label': true, oneOf: [{}, {}] },
        },
        initialFormData: { x: 'a' },
      });

      expect(screen.getAllByText('X')).toHaveLength(1);
    });

    it.each<[string, RJSFSchema, unknown, UiSchema?]>([
      ['titled differently', { type: 'string', title: 'S' }, 'a'],
      ['of type null', { type: 'null' }, null],
      ['hidden', { type: 'string' }, 'a', { 'ui:widget': 'hidden' }],
      ['with its label turned off', { type: 'string' }, 'a', { 'ui:label': false }],
    ])('keeps its label, with no for, where the option shown is %s', (_name, option, formData, optionUiSchema) => {
      const node = renderWrappedUnion(option, formData, optionUiSchema);

      expect(screen.getAllByText('X')).toHaveLength(1);
      expect(node.querySelector(belowWrapperLabel)?.closest('label')).not.toHaveAttribute('for');
    });

    it.each(untitledOptions)(
      "keeps the field's description, once, where the option shown is %s and draws the label",
      (_name, option, formData) => {
        renderWrappedUnion(option, formData, {}, { description: 'About x' });

        expect(screen.getAllByText('About x')).toHaveLength(1);
        expect(screen.getAllByText('X')).toHaveLength(1);
      },
    );

    it('keeps a ui:description where the option shown draws the label', () => {
      renderWrappedUnion({ type: 'string' }, 'a', {}, {}, { 'ui:description': 'About x' });

      expect(screen.getAllByText('About x')).toHaveLength(1);
    });

    it("keeps the field's description beside one of the option's own where the option draws the label", () => {
      renderWrappedUnion({ type: 'string', description: 'Own' }, 'a', {}, { description: 'About x' });

      expect(screen.getAllByText('About x')).toHaveLength(1);
      expect(screen.getAllByText('Own')).toHaveLength(1);
    });

    it("draws the field's description once where the option shown draws the label and repeats it", () => {
      renderWrappedUnion({ type: 'string', description: 'About x' }, 'a', {}, { description: 'About x' });

      expect(screen.getAllByText('About x')).toHaveLength(1);
    });

    it('hides the description under the ui:label: false of its field', () => {
      renderWrappedUnion({ type: 'string' }, 'a', {}, { description: 'About x' }, { 'ui:label': false });

      expect(screen.queryByText('About x')).toBeNull();
    });

    it('draws its ui:help once', () => {
      renderWrappedUnion({ type: 'string' }, 'a', {}, {}, { 'ui:help': 'Help me' });

      expect(screen.getAllByText('Help me')).toHaveLength(1);
    });

    it.each<[string, UiSchema, string[]]>([
      ['with none on its field', {}, ['Inner help']],
      ['beside the one on its field', { 'ui:help': 'Help me' }, ['Help me', 'Inner help']],
    ])('draws a ui:help the wrapper sets itself %s', (_name, fieldUiSchema, drawn) => {
      const helpingWrapper = wrapperHanding((_props, ownUiSchema) => ({
        uiSchema: { ...ownUiSchema, 'ui:help': 'Inner help' },
      }));
      renderWrappedUnion({ type: 'string' }, 'a', {}, {}, { 'ui:field': helpingWrapper, ...fieldUiSchema });

      for (const help of drawn) {
        expect(screen.getAllByText(help)).toHaveLength(1);
      }
    });

    it('keeps its ui:help where the wrapper declares it its own and draws it nowhere', () => {
      createFormComponent({
        schema: { type: 'object', properties: { x: { title: 'X', oneOf: [{ type: 'string' }, { type: 'number' }] } } },
        uiSchema: { x: { 'ui:field': 'Helpless', 'ui:help': 'Help me', oneOf: [{}, {}] } },
        fields: { Helpless: Wrapper },
        presentation: { fields: { Helpless: { help: 'self' } } },
        initialFormData: { x: 'a' },
      });

      expect(screen.getAllByText('Help me')).toHaveLength(1);
    });

    it.each<[string, RJSFSchema]>([
      ['no title', { type: 'string' }],
      ['a title', { type: 'string', title: 'S' }],
    ])(
      "draws the field's label once where an option with no title wraps options of its own, showing one with %s",
      (_name, shown) => {
        createFormComponent({
          schema: {
            type: 'object',
            properties: {
              x: {
                title: 'X',
                oneOf: [{ oneOf: [shown, { type: 'number' }] }, { type: 'boolean' }],
              },
            },
          },
          uiSchema: { x: { oneOf: [{ 'ui:field': Wrapper }, {}] } },
          initialFormData: { x: 'a' },
        });

        expect(screen.queryByText('x')).toBeNull();
      },
    );

    describe('a wrapper changing what it hands the field below', () => {
      it.each<[string, (props: FieldProps, ownUiSchema: UiSchema) => Partial<FieldProps>]>([
        ['ui:title', (_props, ownUiSchema) => ({ uiSchema: { ...ownUiSchema, 'ui:title': 'Inner' } })],
        ['schema title', ({ schema }) => ({ schema: { ...schema, title: 'Inner' } })],
      ])('draws the %s it sets itself beside the label an untitled option draws', (_name, hand) => {
        const node = renderWrappedUnion({ type: 'string' }, 'a', {}, {}, { 'ui:field': wrapperHanding(hand) });

        expect(node.querySelector(belowWrapperLabel)).toHaveTextContent('Inner');
        expect(node.querySelector(belowWrapperLabel)?.closest('label')).not.toHaveAttribute('for');
        expect(node.querySelector('label[for="root_x"]')).toHaveTextContent('X');
      });

      it('draws the ui:title it sets itself where the field that named it has no title', () => {
        createFormComponent({
          schema: { oneOf: [{ type: 'string' }, { type: 'number' }] },
          uiSchema: {
            'ui:field': wrapperHanding((_props, ownUiSchema) => ({
              uiSchema: { ...ownUiSchema, 'ui:title': 'Inner' },
            })),
          },
          initialFormData: 'a',
        });

        expect(screen.getAllByText('Inner')).toHaveLength(1);
      });

      it.each<
        [string, RJSFSchema, UiSchema, (props: FieldProps, ownUiSchema: UiSchema) => Partial<FieldProps>, string]
      >([
        ['the schema title', { title: 'X' }, {}, ({ schema: { title: _title, ...schema } }) => ({ schema }), 'X'],
        ['the ui:title', {}, { 'ui:title': 'T' }, (_props, { 'ui:title': _title, ...uiSchema }) => ({ uiSchema }), 'T'],
      ])("draws the field's label once where it leaves out %s", (_name, field, fieldUiSchema, hand, drawn) => {
        const { node } = createFormComponent({
          schema: {
            type: 'object',
            properties: { x: { ...field, oneOf: [{ type: 'string' }, { type: 'number' }] } },
          },
          uiSchema: { x: { 'ui:field': wrapperHanding(hand), ...fieldUiSchema, oneOf: [{}, {}] } },
          initialFormData: { x: 'a' },
        });

        expect(node.querySelector(belowWrapperLabel)).toBeNull();
        expect(node.querySelector('label[for="root_x"]')).toHaveTextContent(drawn);
      });

      it('draws the title it sets itself once where the option shown has the same title', () => {
        const node = renderWrappedUnion(
          { type: 'string', title: 'Inner' },
          'a',
          {},
          {},
          {
            'ui:field': wrapperHanding((_props, ownUiSchema) => ({
              uiSchema: { ...ownUiSchema, 'ui:title': 'Inner' },
            })),
          },
        );

        expect(node.querySelector(belowWrapperLabel)).toBeNull();
        expect(node.querySelector('label[for="root_x"]')).toHaveTextContent('Inner');
      });

      it.each<[string, UiSchema, string | null]>([
        ['titled by a ui:title', { 'ui:title': 'Opt' }, 'Opt'],
        ['with its label turned off', { 'ui:label': false }, null],
      ])('keeps its label where the option shown is %s in a uiSchema it leaves out', (_name, optionUiSchema, drawn) => {
        const node = renderWrappedUnion(
          { type: 'string' },
          'a',
          optionUiSchema,
          {},
          {
            'ui:field': wrapperHanding((_props, { oneOf: _oneOf, ...ownUiSchema }) => ({ uiSchema: ownUiSchema })),
          },
        );

        expect(node.querySelector(belowWrapperLabel)).toHaveTextContent('X');
        expect(node.querySelector('label[for="root_x"]')?.textContent ?? null).toBe(drawn);
      });
    });
  });
});

describe('a field a $id names that yields to its anyOf options', () => {
  // `FallbackField` is the field a name can pick that yields to the options; a custom field renders beside them (#5391)
  it("hands the selected option its field's plan, with the parts the selector draws drawn above it", () => {
    const { widgetPlans } = renderPlans(
      {
        type: 'object',
        properties: {
          foo: {
            $id: 'FallbackField',
            title: 'Foo',
            description: 'About foo',
            anyOf: [{ type: 'string' }, { type: 'number' }],
          },
        },
      },
      {
        formData: { foo: 'a' },
        presentation: {
          default: { label: 'self', description: 'self' },
          fields: { AnyOfField: { label: 'self', description: 'self' } },
        },
      },
    );
    const plan = widgetPlans.get('root_foo');

    expect(plan?.label.id).toBe('root_foo__optionLabel');
    expect(plan?.description).toMatchObject({ by: 'above', id: 'root_foo__description' });
    expect(plan?.describedBy).toContain('root_foo__description');
  });
});

describe('a widget rendering a group of controls', () => {
  it.each<[string, RJSFSchema]>([
    ['radio', { type: 'string', title: 'Foo', enum: ['a', 'b'] }],
    ['checkboxes', { type: 'array', title: 'Foo', items: { enum: ['a', 'b'] }, uniqueItems: true }],
  ])("draws a %s group's label with no for, which would name the group's wrapper", (widget, foo) => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { foo } },
      uiSchema: { foo: { 'ui:widget': widget } },
    });
    expect(node.querySelector(`#${fieldLabelId('root_foo')}`)?.closest('label')).not.toHaveAttribute('for');
    expect(node.querySelector('#root_foo')).toHaveAccessibleName('Foo');
  });

  it('names its radiogroup by the label and marks the radiogroup invalid rather than its radios', () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { foo: { type: 'string', title: 'Foo', enum: ['a', 'b'] } } },
      uiSchema: { foo: { 'ui:widget': 'radio' } },
      extraErrors: { foo: { __errors: ['is wrong'] } },
    });
    const group = node.querySelector('#root_foo')!;
    expect(group).toHaveAttribute('role', 'radiogroup');
    expect(group).toHaveAttribute('aria-labelledby', fieldLabelId('root_foo'));
    expect(group).toHaveAttribute('aria-invalid', 'true');
    const radios = node.querySelectorAll('input[type=radio]');
    expect(radios).toHaveLength(2);
    radios.forEach((radio) => {
      expect(radio).not.toHaveAttribute('aria-invalid');
      expect(radio.getAttribute('aria-describedby')!.split(' ')).toContain(errorId('root_foo'));
    });
  });

  it('names a rating radiogroup by the label and marks the radiogroup invalid rather than its stars', () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { foo: { type: 'integer', title: 'Foo', minimum: 1, maximum: 3 } } },
      uiSchema: { foo: { 'ui:widget': 'RatingWidget' } },
      extraErrors: { foo: { __errors: ['is wrong'] } },
    });
    const group = screen.getByRole('radiogroup', { name: 'Foo' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(node.querySelector(`#${fieldLabelId('root_foo')}`)?.closest('label')).not.toHaveAttribute('for');
    const stars = within(group).getAllByRole('radio');
    expect(stars).toHaveLength(3);
    stars.forEach((star) => {
      expect(star).not.toHaveAttribute('aria-invalid');
      expect(star.getAttribute('aria-describedby')!.split(' ')).toContain(errorId('root_foo'));
    });
  });

  it.each<[string, RJSFSchema, UiSchema, string]>([
    ['radio group', { type: 'string', enum: ['a', 'b'] }, { 'ui:widget': 'radio' }, 'radiogroup'],
    ['option selector', { anyOf: [{ type: 'string' }, { type: 'number' }] }, {}, 'combobox'],
  ])("names a required field's %s by its label's text, without the required marker", (_, foo, fooUi, role) => {
    createFormComponent({
      schema: { type: 'object', required: ['foo'], properties: { foo: { title: 'Foo', ...foo } } },
      uiSchema: { foo: fooUi },
    });
    expect(screen.getByRole(role, { name: 'Foo' })).toBeInTheDocument();
  });

  it('marks a required rating radiogroup aria-required, as its stars take no required of their own', () => {
    createFormComponent({
      schema: { type: 'object', required: ['foo'], properties: { foo: { type: 'integer', title: 'Foo' } } },
      uiSchema: { foo: { 'ui:widget': 'RatingWidget' } },
    });
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
  });

  it('names a rating radiogroup by the label text ui:label false hides', () => {
    createFormComponent({
      schema: { type: 'object', properties: { foo: { type: 'integer', title: 'Foo' } } },
      uiSchema: { foo: { 'ui:widget': 'RatingWidget', 'ui:label': false } },
    });
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Foo');
  });

  it.each<[string, number | undefined, string]>([
    ['its checked star', 3, '3 stars'],
    ['its first star where none is checked', undefined, '0 stars'],
    ['its first star where its value matches no star', 7, '0 stars'],
  ])('autofocuses %s under ui:autofocus', (_, value, name) => {
    createFormComponent({
      schema: { type: 'object', properties: { foo: { type: 'integer', title: 'Foo' } } },
      uiSchema: { foo: { 'ui:widget': 'RatingWidget', 'ui:autofocus': true } },
      initialFormData: value === undefined ? {} : { foo: value },
    });
    expect(screen.getByRole('radio', { name })).toHaveFocus();
  });

  it.each(['ui:readonly', 'ui:disabled'])(
    'takes no ui:autofocus under %s, as its stars are out of the tab order',
    (key) => {
      createFormComponent({
        schema: { type: 'object', properties: { foo: { type: 'integer', title: 'Foo' } } },
        uiSchema: { foo: { 'ui:widget': 'RatingWidget', 'ui:autofocus': true, [key]: true } },
        initialFormData: { foo: 3 },
      });
      expect(document.body).toHaveFocus();
    },
  );

  it('names its group by the label and marks each checkbox invalid rather than the group', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: { foo: { type: 'array', title: 'Foo', items: { enum: ['a', 'b'] }, uniqueItems: true } },
      },
      uiSchema: { foo: { 'ui:widget': 'checkboxes' } },
      extraErrors: { foo: { __errors: ['is wrong'] } },
    });
    const group = node.querySelector('#root_foo')!;
    expect(group).toHaveAttribute('role', 'group');
    expect(group).toHaveAttribute('aria-labelledby', fieldLabelId('root_foo'));
    expect(group).not.toHaveAttribute('aria-invalid');
    const checkboxes = node.querySelectorAll('input[type=checkbox]');
    expect(checkboxes).toHaveLength(2);
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute('aria-invalid', 'true');
      expect(checkbox.getAttribute('aria-describedby')!.split(' ')).toContain(errorId('root_foo'));
    });
  });
});

describe('an alt-date field', () => {
  it.each(['alt-date', 'alt-datetime'])(
    "names the %s parts' group by the template label, which draws no for",
    (widget) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { when: { type: 'string', title: 'When' } } },
        uiSchema: { when: { 'ui:widget': widget } },
      });

      expect(node.querySelector(`#${fieldLabelId('root_when')}`)?.closest('label')).not.toHaveAttribute('for');
      expect(screen.getByRole('group', { name: 'When' })).toHaveAttribute('id', 'root_when');
    },
  );

  it('keeps its parts the items of a list inside the group, rather than giving the list the role', () => {
    createFormComponent({
      schema: { type: 'object', properties: { when: { type: 'string', title: 'When' } } },
      uiSchema: { when: { 'ui:widget': 'alt-date' } },
    });

    const list = within(screen.getByRole('group', { name: 'When' })).getByRole('list');
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it("describes each part by the field's parts that render, and marks it invalid while its errors show", () => {
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { when: { type: 'string', title: 'When', description: 'The day' } } },
      uiSchema: { when: { 'ui:widget': 'alt-date' } },
      extraErrors: { when: { __errors: ['is wrong'] } },
    });
    const year = screen.getByRole('combobox', { name: 'When, year' });

    expect(year).toHaveAttribute('aria-describedby', `${errorId('root_when')} root_when__description`);
    expect(year).toHaveAttribute('aria-invalid', 'true');
    expect(year).not.toHaveAttribute('aria-labelledby');
    year
      .getAttribute('aria-describedby')!
      .split(' ')
      .forEach((id) => expect(node.querySelector(`#${id}`)).not.toBeNull());
  });

  it('describes each part by none of the ids that render nothing', () => {
    createFormComponent({
      schema: { type: 'object', properties: { when: { type: 'string', title: 'When' } } },
      uiSchema: { when: { 'ui:widget': 'alt-date' } },
    });

    expect(screen.getByRole('combobox', { name: 'When, year' })).not.toHaveAttribute('aria-describedby');
  });

  it.each<{ name: string; label: string; props: NoValFormProps }>([
    {
      name: 'an additional property, by its key rather than its schema title',
      label: 'start',
      props: {
        schema: { type: 'object', additionalProperties: { type: 'string', format: 'date', title: 'Date' } },
        uiSchema: { additionalProperties: { 'ui:widget': 'alt-date' } },
        initialFormData: { start: '2020-05-03' },
      },
    },
    {
      name: "a property titled '', by its name",
      label: 'start',
      props: {
        schema: { type: 'object', properties: { start: { type: 'string', title: '' } } },
        uiSchema: { start: { 'ui:widget': 'alt-date' } },
      },
    },
    {
      name: 'a deprecated property, with the marker',
      label: 'Old date (deprecated)',
      props: {
        schema: { type: 'object', properties: { start: { type: 'string', title: 'Old date', deprecated: true } } },
        uiSchema: { start: { 'ui:widget': 'alt-date' } },
      },
    },
  ])('names each part of $name as its template labels the field', ({ label, props }) => {
    const { node } = createFormComponent(props);

    expect(node.querySelector(`#${fieldLabelId('root_start')}`)?.textContent).toBe(label);
    expect(screen.getByRole('combobox', { name: `${label}, year` })).toBeInTheDocument();
  });

  describe('as the option an anyOf field shows (#5578)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { when: { title: 'When', anyOf: [{ type: 'string' }, { type: 'number' }] } },
    };

    it.each(['alt-date', 'alt-datetime'])(
      "names the %s parts' group by the field label, which draws no for",
      (widget) => {
        const { node } = createFormComponent({ schema, uiSchema: { when: { anyOf: [{ 'ui:widget': widget }, {}] } } });

        expect(node.querySelector(`#${fieldLabelId('root_when')}`)?.closest('label')).not.toHaveAttribute('for');
        expect(screen.getByRole('group', { name: 'When' })).toHaveAttribute('id', 'root_when');
      },
    );

    it('keeps the for while the option shown renders an input', () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { when: { anyOf: [{ 'ui:widget': 'alt-date' }, {}] } },
        initialFormData: { when: 5 },
      });

      expect(node.querySelector(`#${fieldLabelId('root_when')}`)?.closest('label')).toHaveAttribute('for', 'root_when');
      expect(node.querySelector('input#root_when')).toHaveAccessibleName('When');
    });
  });
});

describe('the label a field hands its widget', () => {
  function ArrayWidget({ id }: WidgetProps) {
    return <div id={id} />;
  }

  /** Renders `foo` with a `FieldTemplate` and the widget under `widgetKey` recording the label each is handed */
  function renderLabels(foo: RJSFSchema, widgetKey: string, InnerWidget: Widget, fooUi: UiSchema = {}) {
    const labels = new Map<'template' | 'widget', string>();
    function FieldTemplate(templateProps: FieldTemplateProps) {
      if (templateProps.id === 'root_foo') {
        labels.set('template', templateProps.label);
      }
      return <CoreFieldTemplate {...templateProps} />;
    }
    function RecordingWidget(widgetProps: WidgetProps) {
      labels.set('widget', widgetProps.label);
      return <InnerWidget {...widgetProps} />;
    }
    createFormComponent({
      schema: { type: 'object', properties: { foo } },
      uiSchema: { foo: fooUi },
      templates: { FieldTemplate },
      widgets: { [widgetKey]: RecordingWidget },
    });
    return Object.fromEntries(labels);
  }

  const widgetRows: [string, RJSFSchema, string, Widget, UiSchema?][] = [
    ['string', { type: 'string' }, 'TextWidget', CoreTextWidget],
    ['number', { type: 'number' }, 'TextWidget', CoreTextWidget],
    ['boolean', { type: 'boolean' }, 'CheckboxWidget', CoreCheckboxWidget],
    [
      'multi-select array',
      { type: 'array', items: { enum: ['a', 'b'] }, uniqueItems: true },
      'SelectWidget',
      CoreSelectWidget,
    ],
    ['files array', { type: 'array', items: { type: 'string', format: 'data-url' } }, 'FileWidget', CoreFileWidget],
    [
      'custom-widget array',
      { type: 'array', items: { type: 'string' } },
      'ArrayWidget',
      ArrayWidget,
      { 'ui:widget': 'ArrayWidget' },
    ],
  ];

  // An empty `title` falls through to the property name, so the template is handed a label. A widget is handed the
  // same label, whoever draws it
  it.each(widgetRows)(
    "hands a %s field's widget the property name its template is handed for an empty title",
    (_, foo, widgetKey, InnerWidget, fooUi) => {
      const labels = renderLabels({ ...foo, title: '' }, widgetKey, InnerWidget, fooUi);
      expect(labels).toEqual({ template: 'foo', widget: 'foo' });
    },
  );

  // An empty `ui:title` falls through to the schema's `title` as an empty `title` does, rather than hiding the label
  // the way `ui:label: false` does
  it.each(widgetRows)(
    "hands a %s field's widget the schema title its template is handed for an empty ui:title",
    (_, foo, widgetKey, InnerWidget, fooUi) => {
      const labels = renderLabels({ ...foo, title: 'Foo' }, widgetKey, InnerWidget, { ...fooUi, 'ui:title': '' });
      expect(labels).toEqual({ template: 'Foo', widget: 'Foo' });
    },
  );
});
