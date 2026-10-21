import type { FieldProps, FieldTemplateProps, GenericObjectType, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { screen } from '@testing-library/react';

import FieldTemplate from '../src/components/templates/FieldTemplate/index.ts';
import RadioWidget from '../src/components/widgets/RadioWidget.tsx';
import { SIMPLE_ONEOF, SIMPLE_ONEOF_SCHEMAS } from './testData/layoutData.ts';
import { createFormComponent, setupConsoleWarnSuppression } from './testUtils.tsx';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    note: { type: 'string', title: 'Note' },
    pick: SIMPLE_ONEOF,
  },
};

function gridUiSchema(cellUiSchemas: UiSchema = {}): UiSchema {
  return {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['note', 'pick'] }] },
    ...cellUiSchemas,
  };
}

/** Renders the grid with a `FieldTemplate` that records the props each field's template is handed, by the field's id */
function renderGrid(uiSchema: UiSchema, formSchema: RJSFSchema = schema) {
  const templateProps = new Map<string, FieldTemplateProps>();
  function RecordingFieldTemplate(props: FieldTemplateProps) {
    templateProps.set(props.id, props);
    return <FieldTemplate {...props} />;
  }
  const result = createFormComponent({
    schema: formSchema,
    uiSchema,
    templates: { FieldTemplate: RecordingFieldTemplate },
  });
  return { ...result, templateProps };
}

/** A `RadioWidget` that records the props it is handed, with the props of its last render */
function recordRadioWidget() {
  const recordWidgetProps = vi.fn<(props: WidgetProps) => void>();
  function RecordingRadioWidget(props: WidgetProps) {
    recordWidgetProps(props);
    return <RadioWidget {...props} />;
  }
  return { widgets: { RadioWidget: RecordingRadioWidget }, lastWidgetProps: () => recordWidgetProps.mock.lastCall![0] };
}

// A discriminated cell renders the selector alone, through `SchemaField` like every other cell, so its template is
// handed whatever `SchemaField` hands any field (#5419)
describe('a discriminated cell of a layout grid', () => {
  it('hands its FieldTemplate every prop a plain cell is handed', () => {
    const { templateProps } = renderGrid(gridUiSchema());

    const plainCell = templateProps.get('root_note');
    const discriminatedCell = templateProps.get('root_pick');
    expect(plainCell).toBeDefined();
    expect(discriminatedCell).toBeDefined();
    expect(Object.keys(discriminatedCell!).sort()).toEqual(Object.keys(plainCell!).sort());
  });

  // A `for` can't name a radio group's wrapper, so the theme's `RadioWidget` declaration has the label name it through
  // `aria-labelledby`, which the plan only knows to do from the widget the selector renders
  it.each([
    ['an object', SIMPLE_ONEOF],
    ['a schema with no type', { ...SIMPLE_ONEOF, type: undefined }],
  ])("names its radio group by the template's label, for %s", (_, pick) => {
    const { node } = renderGrid(gridUiSchema(), { ...schema, properties: { ...schema.properties, pick } });

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'root_pick__label');
    expect(node.querySelector('label[for="root_pick"]')).toBeNull();
  });

  // The default widget is named as it is registered, which needs no type, so a union with no options to type the
  // selector by still renders one, with nothing to select
  it('renders a radio group with nothing to select for a union with no options', () => {
    const pick: RJSFSchema = { ...SIMPLE_ONEOF, oneOf: [] };
    renderGrid(gridUiSchema(), { ...schema, properties: { ...schema.properties, pick } });

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'root_pick__label');
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  // Its FieldTemplate draws the label and wrapper of a disabled field, as its selector is
  it.each([
    ['no ui:disabled', {}],
    ['a ui:disabled of false', { 'ui:disabled': false }],
  ])('is disabled, template and all, for a union with no options, with %s', (_, pickUiSchema) => {
    const pick: RJSFSchema = { ...SIMPLE_ONEOF, oneOf: [] };
    const { templateProps } = renderGrid(gridUiSchema({ pick: pickUiSchema }), {
      ...schema,
      properties: { ...schema.properties, pick },
    });

    expect(templateProps.get('root_pick')?.disabled).toBe(true);
    expect(templateProps.get('root_note')?.disabled).toBe(false);
  });

  // The selector takes its options' type, which needs no option selected, so the widget never depends on the data
  it('renders a radio group for a selector property with no type, when no option is selected', () => {
    const options = SIMPLE_ONEOF_SCHEMAS.map((option) => ({
      ...option,
      properties: { answer: { default: (option.properties!.answer as RJSFSchema).default } },
    }));
    const pick: RJSFSchema = { ...SIMPLE_ONEOF, oneOf: options };
    createFormComponent({
      schema: { ...schema, properties: { ...schema.properties, pick } },
      uiSchema: gridUiSchema(),
      initialFormData: { pick: { answer: 'matches no option' } },
    });

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'root_pick__label');
    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
  });

  it('renders a radio group for a selector property with no type, in options that only imply theirs', () => {
    const options = SIMPLE_ONEOF_SCHEMAS.map(({ type: _type, ...option }) => ({
      ...option,
      properties: { answer: { default: (option.properties!.answer as RJSFSchema).default } },
    }));
    const pick: RJSFSchema = { ...SIMPLE_ONEOF, oneOf: options };
    renderGrid(gridUiSchema(), { ...schema, properties: { ...schema.properties, pick } });

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'root_pick__label');
  });

  // `getWidget()` maps an alias only through a type, which a selector property with none takes from the first option,
  // or else from the object every discriminated option is
  it.each([
    ['options that declare theirs', SIMPLE_ONEOF_SCHEMAS],
    ['options that only imply theirs', SIMPLE_ONEOF_SCHEMAS.map(({ type: _type, ...option }) => option)],
    ['no options', []],
  ])('renders the select it names by alias, for a selector property with no type, in %s', (_, oneOf) => {
    const options = oneOf.map((option) => ({
      ...option,
      properties: { answer: { default: (option.properties!.answer as RJSFSchema).default } },
    }));
    const pick: RJSFSchema = { ...SIMPLE_ONEOF, oneOf: options };
    createFormComponent({
      schema: { ...schema, properties: { ...schema.properties, pick } },
      uiSchema: gridUiSchema({ pick: { 'ui:widget': 'select' } }),
      formData: { pick: { answer: 'matches no option' } },
    });

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders a widget registered under the radio alias as its default selector', () => {
    function AliasRadio(_props: WidgetProps) {
      return <div data-testid='alias-radio' />;
    }
    createFormComponent({ schema, uiSchema: gridUiSchema(), widgets: { radio: AliasRadio } });

    expect(screen.getByTestId('alias-radio')).toBeInTheDocument();
  });

  it('renders its selector in place of the options, over a ui:fieldReplacesAnyOrOneOf of false of its own', () => {
    renderGrid(gridUiSchema({ pick: { 'ui:options': {}, 'ui:fieldReplacesAnyOrOneOf': false } }));

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('is labelled by its property name when it has no title, as a plain cell is', () => {
    const { templateProps } = renderGrid(gridUiSchema(), {
      ...schema,
      properties: { note: { type: 'string' }, pick: { ...SIMPLE_ONEOF, title: undefined } },
    });

    expect(templateProps.get('root_note')?.label).toBe('note');
    expect(templateProps.get('root_pick')?.label).toBe('pick');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('pick');
  });

  it('resolves its own ui:required, ui:readonly and ui:disabled', () => {
    const { templateProps } = renderGrid(
      gridUiSchema({ pick: { 'ui:required': true, 'ui:readonly': true, 'ui:disabled': true } }),
    );

    const cell = templateProps.get('root_pick');
    expect(cell?.required).toBe(true);
    expect(cell?.readonly).toBe(true);
    expect(cell?.disabled).toBe(true);
    screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeDisabled());
  });

  describe('a ui:required read from JSON', () => {
    // `SchemaField` warns about a `ui:required` that turns a schema-required field optional with nothing to fill it
    setupConsoleWarnSuppression();

    it.each([0, null])('reads a ui:required of %s on a required cell as false', (uiRequired) => {
      const uiRequiredFromJson: GenericObjectType = { 'ui:required': uiRequired };
      const { templateProps } = renderGrid(gridUiSchema({ pick: uiRequiredFromJson }), {
        ...schema,
        required: ['pick'],
      });

      expect(templateProps.get('root_pick')?.required).toBe(false);
    });
  });

  it("keeps the cell's class names and style, which its FieldTemplate applies, out of its selector's options", () => {
    const { widgets, lastWidgetProps } = recordRadioWidget();
    createFormComponent({
      schema,
      uiSchema: gridUiSchema({ pick: { 'ui:classNames': 'own-class', 'ui:style': { color: 'red' } } }),
      widgets,
    });

    const { options } = lastWidgetProps();
    expect(options.classNames).toBeUndefined();
    expect(options.style).toBeUndefined();
  });

  it("doesn't scatter a ui:options read from JSON that isn't an object into its selector's options", () => {
    const { widgets, lastWidgetProps } = recordRadioWidget();
    const uiOptionsFromJson: GenericObjectType = { 'ui:options': 'ab' };
    createFormComponent({
      schema,
      uiSchema: gridUiSchema({ pick: uiOptionsFromJson }),
      widgets,
    });

    const { options } = lastWidgetProps();
    expect(options).not.toHaveProperty('0');
    expect(options).not.toHaveProperty('1');
  });

  it("keeps the field and fieldReplacesAnyOrOneOf the grid names it with out of its selector's uiSchema", () => {
    const { widgets, lastWidgetProps } = recordRadioWidget();
    createFormComponent({
      schema,
      uiSchema: gridUiSchema({ pick: { 'ui:options': { inline: true } } }),
      widgets,
    });

    const { uiSchema } = lastWidgetProps();
    expect(uiSchema?.['ui:options']).toEqual({ inline: true });
    expect(uiSchema).not.toHaveProperty('ui:field');
    expect(uiSchema).not.toHaveProperty('ui:fieldReplacesAnyOrOneOf');
  });

  // `SchemaField` merges the `ui:definitions` entry for the cell's `$ref` beneath the cell's `uiSchema`, so the entry's
  // own spelling of either directive comes wherever the entry orders it
  it.each([
    ['a ui:field', { 'ui:options': { inline: true }, 'ui:field': 'CustomField' }],
    ['a ui:fieldReplacesAnyOrOneOf of false', { 'ui:options': { inline: true }, 'ui:fieldReplacesAnyOrOneOf': false }],
  ])('renders its selector in place of the options, over %s its ui:definitions entry names', (_, definition) => {
    function CustomField(_props: FieldProps) {
      return <div data-testid='custom-field' />;
    }
    createFormComponent({
      schema: { ...schema, definitions: { Pick: SIMPLE_ONEOF }, properties: { pick: { $ref: '#/definitions/Pick' } } },
      uiSchema: {
        'ui:definitions': { '#/definitions/Pick': definition },
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['pick'] }] },
      },
      fields: { CustomField },
    });

    expect(screen.queryByTestId('custom-field')).not.toBeInTheDocument();
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders its selector in place of a ui:field of its own', () => {
    function CustomField(_: FieldProps) {
      return <div data-testid='custom-field' />;
    }
    renderGrid(gridUiSchema({ pick: { 'ui:field': CustomField } }));

    expect(screen.queryByTestId('custom-field')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  // `getUiOptions()` reads both spellings in key order, so its own `ui:options` coming after its top-level spelling
  // would win were the grid's directive not in both
  it.each([
    ['a ui:field', { 'ui:field': 'CustomField', 'ui:options': { field: 'CustomField' } }],
    [
      'a ui:fieldReplacesAnyOrOneOf of false',
      { 'ui:fieldReplacesAnyOrOneOf': false, 'ui:options': { fieldReplacesAnyOrOneOf: false } },
    ],
  ])('renders its selector in place of the options, over %s of its own in both spellings', (_, pickUiSchema) => {
    function CustomField(_props: FieldProps) {
      return <div data-testid='custom-field' />;
    }
    createFormComponent({ schema, uiSchema: gridUiSchema({ pick: pickUiSchema }), fields: { CustomField } });

    expect(screen.queryByTestId('custom-field')).not.toBeInTheDocument();
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
  });

  it('takes the ui:definitions entry for its $ref', () => {
    createFormComponent({
      schema: { ...schema, definitions: { Pick: SIMPLE_ONEOF }, properties: { pick: { $ref: '#/definitions/Pick' } } },
      uiSchema: {
        'ui:definitions': { '#/definitions/Pick': { 'ui:widget': 'select', 'ui:title': 'From definitions' } },
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['pick'] }] },
      },
    });

    expect(screen.getByRole('combobox', { name: 'From definitions' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('focuses its selector for its own ui:autofocus', () => {
    renderGrid(gridUiSchema({ pick: { 'ui:autofocus': true } }));

    expect(screen.getAllByRole('radio')[0]).toHaveFocus();
  });
});
