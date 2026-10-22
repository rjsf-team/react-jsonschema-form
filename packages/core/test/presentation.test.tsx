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
  WidgetProps,
} from '@rjsf/utils';
import {
  errorId,
  fieldLabelId,
  hasTemplateErrors,
  helpId,
  optionHelpId,
  selectedOptionDescriptionId,
  titleId,
} from '@rjsf/utils';
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

  describe('a field named by its key, however ui:field is spelled', () => {
    setupConsoleWarnSuppression();

    it.each<[string, UiSchema]>([
      ['its key in ui:field', { 'ui:field': 'StringField' }],
      ['its key in ui:options.field', { 'ui:options': { field: 'StringField' } }],
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
        expect(describers).not.toContain('root_foo_XxxOf__description');
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
  // `rawErrors` its template is handed do, while its plan, which `hasTemplateErrors()` reads, takes the errors as the
  // field above shows them
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
      expect(hasTemplateErrors(option)).toBe(!aboveHides);
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

      expect(node.querySelector('#root__anyof_select')).toHaveAttribute('aria-labelledby', titleId('root_XxxOf'));
      expect(node.querySelector('#root__anyof_select')).toHaveAccessibleName('Pet');
    });

    it.each([
      ['required marker', ['pet'], 'span.required'],
      ['optional data control', [], 'button'],
    ])("names their selector by the heading's text alone, without its %s", (_, required, extra) => {
      const { node } = createFormComponent({
        schema: { type: 'object', properties: { pet: schema }, required },
        uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
        initialFormData: { pet: { name: 'Rex' } },
      });

      const title = node.querySelector('#root_pet_XxxOf__title');
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

    it('draws no heading beside its options where the field draws its own label', () => {
      const titles = new Map<string, string>();
      function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
        titles.set(props.id, props.title);
        return <CoreObjectFieldTemplate {...props} />;
      }
      createFormComponent({
        schema,
        templates: { ObjectFieldTemplate },
        presentation: { fields: { AnyOfField: { label: 'self' } } },
      });
      expect(titles.get('root_XxxOf')).toBe('');
      expect(titles.get('root')).toBe('Dog');
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

describe('an anyOf/oneOf whose options are all objects, arrays or nulls', () => {
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

  it('keeps the for where an option of another type renders a control under the field id', () => {
    const { outerTemplatePlans } = renderPlans({
      type: 'object',
      properties: { pet: { ...pet, oneOf: [...pet.oneOf!, { title: 'Name', type: 'string' }] } },
    });

    expect(outerTemplatePlans.get('root_pet')?.control?.attributes['aria-labelledby']).toBeUndefined();
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

  it('names a multi-select array option by the field label through aria-labelledby', () => {
    createFormComponent({
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
    expect(select).toHaveAttribute('aria-labelledby', fieldLabelId('root_pet'));
    expect(select).toHaveAccessibleName('Pet');
  });

  it('names a file array option by the field label through aria-labelledby', () => {
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

    const input = node.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('aria-labelledby', fieldLabelId('root_pet'));
    expect(input).toHaveAccessibleName('Pet');
  });

  it('keeps the for where an option is a $ref it does not resolve', () => {
    const { outerTemplatePlans } = renderPlans({
      type: 'object',
      definitions: { name: { type: 'string' } },
      properties: { pet: { ...pet, oneOf: [...pet.oneOf!, { $ref: '#/definitions/name' }] } },
    });

    expect(outerTemplatePlans.get('root_pet')?.control?.attributes['aria-labelledby']).toBeUndefined();
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
    const unsupported = node.querySelector('.unsupported-field')!;
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
    const unsupported = node.querySelector('.unsupported-field')!;
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
      const unsupported = node.querySelector('.unsupported-field')!;
      expect(title!.compareDocumentPosition(description)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(description.compareDocumentPosition(unsupported)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    },
  );
});

describe("the fallback UI's label, however its ui:field is spelled (#5389)", () => {
  setupConsoleWarnSuppression();

  it.each<[string, UiSchema]>([
    ['no ui:field', {}],
    ['a ui:field naming FallbackField', { 'ui:field': 'FallbackField' }],
    ['a ui:field naming nothing', { 'ui:field': 'Nope' }],
    ['a ui:options.field naming nothing', { 'ui:options': { field: 'Nope' } }],
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
    ['ui:options.field', val, { val: { 'ui:options': { field: 'OwnFallback' } } }],
    ['ui:globalOptions.field', val, { 'ui:globalOptions': { field: 'OwnFallback' } }],
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
      schema: { type: 'object', properties: { foo: { type: 'integer', title: 'Foo', maximum: 3 } } },
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
