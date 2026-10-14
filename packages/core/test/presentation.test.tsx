import type {
  ArrayFieldTemplateProps,
  FieldPresentation,
  FieldTemplateProps,
  RJSFSchema,
  UiSchema,
  WidgetProps,
} from '@rjsf/utils';
import { fieldLabelId } from '@rjsf/utils';

import { generateTemplates, generateWidgets } from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

const { FieldTemplate: CoreFieldTemplate } = generateTemplates();
const { TextWidget: CoreTextWidget, SelectWidget: CoreSelectWidget } = generateWidgets();
const { ArrayFieldTemplate: CoreArrayFieldTemplate } = generateTemplates();

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
    expect(plan?.label).toEqual({ text: 'Foo', by: 'template', id: fieldLabelId('root_foo') });
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

  it('plans a field named by its key in ui:field as one its type picked', () => {
    const { templatePlans } = renderPlans(
      { type: 'object', properties: { foo: { type: 'string', title: 'Foo' } } },
      { uiSchema: { foo: { 'ui:field': 'StringField' } } },
    );
    expect(templatePlans.get('root_foo')?.label.by).toBe('template');
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
    expect(plan?.inherited?.label).toEqual({ text: 'Foo', by: 'template', id: fieldLabelId('root_foo') });
    expect(plan?.label).toEqual({ text: 'Foo', by: 'above', id: fieldLabelId('root_foo') });
  });

  it("keeps the option's name for its own label, under an option id, where the selector draws the field's", () => {
    const { widgetPlans } = renderPlans(
      { type: 'object', properties: { foo: { title: 'Foo', anyOf: [{ type: 'string' }, { type: 'number' }] } } },
      {
        formData: { foo: 'a' },
        presentation: { default: { label: 'self' }, fields: { AnyOfField: { label: 'self' } } },
      },
    );
    expect(widgetPlans.get('root_foo')?.label).toEqual({ text: 'foo', by: 'self', id: 'root_foo__optionLabel' });
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
    expect(plan?.label).toEqual({ text: 'Foo', by: 'above', id: fieldLabelId('root_foo') });
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
      expect(selector.hideLabel).toBe(false);
      expect(selector.label).toBe('Parent title');
      expect(selector.options.description).toBe('Parent description');
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
