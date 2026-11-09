import type { FieldProps, FieldTemplateProps, GenericObjectType, RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG } from '@rjsf/utils';
import { act, cleanup, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import FieldTemplate from '../src/components/templates/FieldTemplate/index.ts';
import RadioWidget from '../src/components/widgets/RadioWidget.tsx';
import { SIMPLE_ONEOF, SIMPLE_ONEOF_SCHEMAS, withTypelessSelector } from './testData/layoutData.ts';
import { createFormComponent, createFormRef, handleOf, setupConsoleWarnSuppression, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    note: { type: 'string', title: 'Note' },
    pick: SIMPLE_ONEOF,
  },
};

const UNION_ENTRY: RJSFSchema = { anyOf: [{ type: 'string' }, { type: 'number' }] };

function schemaWithPick(pick: RJSFSchema): RJSFSchema {
  return { ...schema, properties: { ...schema.properties, pick } };
}

const refSchema: RJSFSchema = {
  ...schema,
  definitions: { Pick: SIMPLE_ONEOF },
  properties: { pick: { $ref: '#/definitions/Pick' } },
};

function refGridUiSchema(definition: UiSchema): UiSchema {
  return {
    'ui:definitions': { '#/definitions/Pick': definition },
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['pick'] }] },
  };
}

function CustomField(_props: FieldProps) {
  return <div data-testid='custom-field' />;
}

function gridUiSchema(cellUiSchemas: UiSchema = {}): UiSchema {
  return {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['note', 'pick'] }] },
    ...cellUiSchemas,
  };
}

function extraUiSchema(cell: UiSchema = {}): UiSchema {
  return {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['extra'] }] },
    extra: cell,
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

describe('a cell of a layout grid', () => {
  it('is labelled by its property name, not its dotted path, when the grid names it inside an object', () => {
    const { templateProps } = renderGrid(
      { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['person.note'] }] } },
      { type: 'object', properties: { person: { type: 'object', properties: { note: { type: 'string' } } } } },
    );

    expect(templateProps.get('root_person_note')?.label).toBe('note');
  });

  it('is labelled by its array and indexes when the grid names an array item, as ArrayField names the item', () => {
    const { templateProps } = renderGrid(
      { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['list.0', 'matrix.0.1'] }] } },
      {
        type: 'object',
        properties: {
          list: { type: 'array', items: { type: 'string' } },
          matrix: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
        },
      },
    );

    expect(templateProps.get('root_list_0')?.label).toBe('list-0');
    expect(templateProps.get('root_matrix_0_1')?.label).toBe('matrix-0-1');
  });

  it('is labelled by its array and index when the grid over an array names an item by its index alone', () => {
    const { templateProps } = renderGrid(
      { things: { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['0'] }] } } },
      { type: 'object', properties: { things: { type: 'array', items: { type: 'string' } } } },
    );

    expect(templateProps.get('root_things_0')?.label).toBe('things-0');
  });

  it("is labelled by its property name when the grid names an object's numeric key, not as an array item", () => {
    const { templateProps } = renderGrid(
      { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['codes.0'] }] } },
      { type: 'object', properties: { codes: { type: 'object', properties: { 0: { type: 'string' } } } } },
    );

    expect(templateProps.get('root_codes_0')?.label).toBe('0');
  });

  it('hands a field the cell names its property name as name and its full path as fieldPath', () => {
    const fieldProps = vi.fn<(props: FieldProps) => void>();
    function NamedField(props: FieldProps) {
      fieldProps(props);
      return null;
    }
    createFormComponent({
      schema: { type: 'object', properties: { person: { type: 'object', properties: { pick: { type: 'string' } } } } },
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['person.pick'] }] },
        person: { pick: { 'ui:field': 'NamedField' } },
      },
      fields: { NamedField },
    });

    expect(fieldProps).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'pick', fieldPath: 'person.pick' }));
  });
});

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
    const { node } = renderGrid(gridUiSchema(), schemaWithPick(pick));

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'root_pick__label');
    expect(node.querySelector('label[for="root_pick"]')).toBeNull();
  });

  // An empty oneOf offers no choice, so the cell renders the object it is, enabled, rather than a selector (#5365)
  it('renders a union with no options as its object, with no selector', () => {
    const { node, templateProps } = renderGrid(gridUiSchema(), schemaWithPick({ ...SIMPLE_ONEOF, oneOf: [] }));

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(node.querySelector('fieldset#root_pick')).toBeInTheDocument();
    expect(templateProps.get('root_pick')?.disabled).toBe(false);
  });

  // The selector takes its options' type, which needs no option selected, so the widget never depends on the data
  it.each([
    ['options that declare theirs', SIMPLE_ONEOF_SCHEMAS],
    ['options that only imply theirs', SIMPLE_ONEOF_SCHEMAS.map(({ type: _type, ...option }) => option)],
  ])('renders a radio group for a selector property with no type, when no option is selected, in %s', (_, oneOf) => {
    createFormComponent({
      schema: schemaWithPick({ ...SIMPLE_ONEOF, oneOf: withTypelessSelector(oneOf) }),
      uiSchema: gridUiSchema(),
      initialFormData: { pick: { answer: 'matches no option' } },
    });

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'root_pick__label');
    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeChecked());
  });

  // `getWidget()` maps an alias only through a type, which a selector property with none takes from the first option,
  // or else from the object every discriminated option is
  it.each([
    ['options that declare theirs', SIMPLE_ONEOF_SCHEMAS],
    ['options that only imply theirs', SIMPLE_ONEOF_SCHEMAS.map(({ type: _type, ...option }) => option)],
  ])('renders the select it names by alias, for a selector property with no type, in %s', (_, oneOf) => {
    createFormComponent({
      schema: schemaWithPick({ ...SIMPLE_ONEOF, oneOf: withTypelessSelector(oneOf) }),
      uiSchema: gridUiSchema({ pick: { 'ui:widget': 'select' } }),
      initialFormData: { pick: { answer: 'matches no option' } },
    });

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  // An option hands its properties out as written, so the selector is typed by the schema its `$ref` names, which
  // `getWidget()` maps the alias through
  it.each<[string, string, RJSFSchema, string]>([
    ['text', 'a string', { type: 'string', const: '1' }, 'textbox'],
    ['updown', 'an integer', { type: 'integer', const: 1 }, 'spinbutton'],
  ])('renders the %s widget it names for a selector property written as a $ref to %s', (widget, _, answer, role) => {
    createFormComponent({
      schema: {
        ...schemaWithPick({
          ...SIMPLE_ONEOF,
          oneOf: [{ type: 'object', properties: { answer: { $ref: '#/definitions/Answer' } } }],
        }),
        definitions: { Answer: answer },
      },
      uiSchema: gridUiSchema({ pick: { 'ui:widget': widget } }),
    });

    expect(screen.getByRole(role, { name: 'Simple' })).toBeInTheDocument();
  });

  // A boolean option holds no selector property to type the selector by, so the selector is typed by the first option
  // that isn't one
  it('renders a radio group for a union whose first option is a boolean schema', () => {
    renderGrid(gridUiSchema(), schemaWithPick({ ...SIMPLE_ONEOF, oneOf: [false, ...SIMPLE_ONEOF_SCHEMAS] }));

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'root_pick__label');
  });

  it('renders the text widget it names for a union whose first option is a boolean schema', () => {
    renderGrid(
      gridUiSchema({ pick: { 'ui:widget': 'text' } }),
      schemaWithPick({ ...SIMPLE_ONEOF, oneOf: [false, ...SIMPLE_ONEOF_SCHEMAS] }),
    );

    expect(screen.getByRole('textbox', { name: 'Simple' })).toBeInTheDocument();
  });

  it('renders a widget registered under the radio alias as its default selector', () => {
    function AliasRadio(_props: WidgetProps) {
      return <div data-testid='alias-radio' />;
    }
    createFormComponent({ schema, uiSchema: gridUiSchema(), widgets: { radio: AliasRadio } });

    expect(screen.getByTestId('alias-radio')).toBeInTheDocument();
  });

  it.each([
    [
      'the options, over a ui:fieldReplacesAnyOrOneOf of false',
      { 'ui:options': {}, 'ui:fieldReplacesAnyOrOneOf': false },
    ],
    ['a ui:field', { 'ui:field': CustomField }],
  ])('renders its selector in place of %s of its own', (_, pickUiSchema) => {
    renderGrid(gridUiSchema({ pick: pickUiSchema }));

    expect(screen.queryByTestId('custom-field')).not.toBeInTheDocument();
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

  it("is labelled by its property name in an array item when it has no title, as a plain cell is, not by the item's", () => {
    const { templateProps } = renderGrid(
      { things: { items: gridUiSchema() } },
      {
        type: 'object',
        properties: {
          things: {
            type: 'array',
            title: 'Things',
            minItems: 1,
            items: { ...schema, properties: { note: { type: 'string' }, pick: { ...SIMPLE_ONEOF, title: undefined } } },
          },
        },
      },
    );

    expect(templateProps.get('root_things_0_note')?.label).toBe('note');
    expect(templateProps.get('root_things_0_pick')?.label).toBe('pick');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('pick');
  });

  it('is labelled by its property name, not its dotted path, when the grid names it inside an object', () => {
    const { templateProps } = renderGrid(
      { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['person.pick'] }] } },
      {
        type: 'object',
        properties: { person: { type: 'object', properties: { pick: { ...SIMPLE_ONEOF, title: undefined } } } },
      },
    );

    expect(templateProps.get('root_person_pick')?.label).toBe('pick');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleName('pick');
  });

  it('is labelled by its array and index when the grid names an array item, as ArrayField names the item', () => {
    const { templateProps } = renderGrid(
      { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['person.picks.0'] }] } },
      {
        type: 'object',
        properties: {
          person: {
            type: 'object',
            properties: { picks: { type: 'array', items: { ...SIMPLE_ONEOF, title: undefined } } },
          },
        },
      },
    );

    expect(templateProps.get('root_person_picks_0')?.label).toBe('picks-0');
  });

  it("keeps its title, as a plain cell does, once the key of the additionalProperties entry it's in is renamed", async () => {
    const { templateProps } = renderGrid(
      { additionalProperties: gridUiSchema() },
      { type: 'object', additionalProperties: schema },
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const keyInput = screen.getByDisplayValue('newKey');
    await user.clear(keyInput);
    await user.type(keyInput, 'renamed');
    await user.tab();

    expect(templateProps.get('root_renamed_note')?.label).toBe('Note');
    expect(templateProps.get('root_renamed_pick')?.label).toBe('Simple');
  });

  it("hands neither its template nor a plain cell's the key editing of the additionalProperties entry they're in", () => {
    const { templateProps } = renderGrid(
      { additionalProperties: gridUiSchema() },
      {
        type: 'object',
        propertyNames: { enum: ['first', 'second'] },
        additionalProperties: schema,
        default: { first: {} },
      },
    );

    const entry = templateProps.get('root_first');
    expect(entry?.onKeyRename).toBeDefined();
    expect(entry?.propertyNamesEnum).toBeDefined();
    ['root_first_note', 'root_first_pick'].forEach((id) => {
      const cell = templateProps.get(id);
      expect(cell).toBeDefined();
      expect(cell?.onKeyRename).toBeUndefined();
      expect(cell?.onKeyRenameBlur).toBeUndefined();
      expect(cell?.onRemoveProperty).toBeUndefined();
      expect(cell?.propertyNamesEnum).toBeUndefined();
    });
  });

  it('draws no key input or remove button for a cell the layout names by an additionalProperties key', () => {
    const { templateProps } = renderGrid(
      { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['extra'] }] } },
      { type: 'object', additionalProperties: { type: 'string', title: 'Extra' }, default: { extra: 'x' } },
    );

    expect(ADDITIONAL_PROPERTY_FLAG in templateProps.get('root_extra')!.schema).toBe(false);
    expect(screen.getByRole('textbox', { name: 'Extra' })).toHaveValue('x');
    expect(screen.queryByRole('textbox', { name: /Key/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it.each<[string, RJSFSchema, UiSchema, unknown]>([
    ['an anyOf', { title: 'Extra', ...UNION_ENTRY }, {}, 'x'],
    ['a discriminated oneOf', { ...SIMPLE_ONEOF, title: 'Extra' }, { 'ui:widget': 'select' }, { answer: '2' }],
  ])('labels a cell of %s by its title and draws no key input or remove button', (_title, entry, cell, held) => {
    const { templateProps } = renderGrid(extraUiSchema(cell), {
      type: 'object',
      additionalProperties: entry,
      default: { extra: held },
    } as RJSFSchema);

    expect(ADDITIONAL_PROPERTY_FLAG in templateProps.get('root_extra')!.schema).toBe(false);
    expect(templateProps.get('root_extra')!.label).toBe('Extra');
    expect(screen.queryByRole('textbox', { name: /Key/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  describe('a cleared cell the layout names by an additionalProperties key', () => {
    const stringEntries: RJSFSchema = { type: 'object', additionalProperties: { type: 'string', title: 'Extra' } };

    it('is stored as an object stores it, so its key and the cell outlive a round trip through JSON', async () => {
      const { onChange } = createFormComponent({
        schema: stringEntries,
        initialFormData: { extra: 'x' },
        uiSchema: extraUiSchema(),
      });

      await user.clear(screen.getByRole('textbox', { name: 'Extra' }));

      const { formData } = onChange.mock.lastCall![0];
      expect(formData).toStrictEqual({ extra: '' });
      cleanup();
      createFormComponent({
        schema: stringEntries,
        initialFormData: JSON.parse(JSON.stringify(formData)),
        uiSchema: extraUiSchema(),
      });
      expect(screen.getByRole('textbox', { name: 'Extra' })).toHaveValue('');
    });

    it.each<[string, RJSFSchema, string | undefined]>([
      ['a plain cell', stringEntries, 'Extra'],
      ['an anyOf cell', { type: 'object', additionalProperties: UNION_ENTRY }, undefined],
    ])('is stored as its ui:emptyValue, for %s', async (_title, entries, name) => {
      const { onChange } = createFormComponent({
        schema: entries,
        initialFormData: { extra: 'x' },
        uiSchema: extraUiSchema({ 'ui:emptyValue': 'none' }),
      });

      await user.clear(screen.getByRole('textbox', { name }));

      expect(onChange.mock.lastCall![0].formData).toStrictEqual({ extra: 'none' });
    });

    it.each<[string, RJSFSchema]>([
      ['options', SIMPLE_ONEOF],
      [
        'constant options',
        {
          ...SIMPLE_ONEOF,
          oneOf: SIMPLE_ONEOF_SCHEMAS.map((option, index) => ({ ...option, const: { answer: String(index + 1) } })),
        },
      ],
    ])(
      'is stored as an object stores it when discriminated with %s, so its key and the cell outlive a round trip through JSON',
      async (_title, entry) => {
        const discriminatedEntries: RJSFSchema = { type: 'object', additionalProperties: entry };
        const uiSchema = extraUiSchema({ 'ui:widget': 'select' });
        const { onChange } = createFormComponent({
          schema: discriminatedEntries,
          initialFormData: { extra: { answer: '2' } },
          uiSchema,
        });
        const select = screen.getByRole('combobox');

        await user.selectOptions(select, within(select).getByRole('option', { name: '' }));

        const { formData } = onChange.mock.lastCall![0];
        expect(formData).toStrictEqual({ extra: '' });
        cleanup();
        createFormComponent({
          schema: discriminatedEntries,
          initialFormData: JSON.parse(JSON.stringify(formData)),
          uiSchema,
        });
        expect(screen.getByRole('combobox')).toHaveDisplayValue('');
      },
    );

    it('holds the submit back until an option is picked when discriminated, since no option takes the empty string', async () => {
      // Each option holds its own `const`, since `SIMPLE_ONEOF`'s answer matches both options once it is picked
      const options = SIMPLE_ONEOF_SCHEMAS.map((option) => ({
        ...option,
        properties: { answer: { type: 'string' as const, const: (option.properties!.answer as RJSFSchema).default } },
      }));
      const { node, onSubmit, onError } = createFormComponent({
        schema: { type: 'object', additionalProperties: { ...SIMPLE_ONEOF, oneOf: options } },
        initialFormData: { extra: { answer: '2' } },
        uiSchema: extraUiSchema({ 'ui:widget': 'select' }),
      });
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, within(select).getByRole('option', { name: '' }));

      await submitForm(node, user);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);

      await user.selectOptions(screen.getByRole('combobox'), 'Choice 1');
      await submitForm(node, user);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.lastCall![0].formData).toStrictEqual({ extra: { answer: '1' } });
    });

    it.each<[string, RJSFSchema, string, (value: string) => GenericObjectType]>([
      ['the grid', { type: 'object', additionalProperties: UNION_ENTRY }, 'extra', (value) => ({ extra: value })],
      [
        'an object within the grid',
        { type: 'object', properties: { group: { type: 'object', additionalProperties: UNION_ENTRY } } },
        'group.extra',
        (value) => ({ group: { extra: value } }),
      ],
    ])(
      'is stored as an object stores it when its anyOf option clears it, in an entry of %s',
      async (_title, entries, path, held) => {
        const uiSchema: UiSchema = {
          'ui:field': 'LayoutGridField',
          'ui:layoutGrid': { 'ui:row': [{ 'ui:col': [path] }] },
        };
        const { onChange } = createFormComponent({ schema: entries, initialFormData: held('abc'), uiSchema });

        await user.clear(screen.getByRole('textbox'));

        const { formData } = onChange.mock.lastCall![0];
        expect(formData).toStrictEqual(held(''));
        cleanup();
        createFormComponent({ schema: entries, initialFormData: JSON.parse(JSON.stringify(formData)), uiSchema });
        expect(screen.getByRole('textbox')).toHaveValue('');
      },
    );

    it('stays on the option an option within its anyOf option switches to, when the switch holds nothing', async () => {
      const { onChange } = createFormComponent({
        schema: {
          type: 'object',
          additionalProperties: {
            anyOf: [
              {
                title: 'Scalar',
                anyOf: [
                  { title: 'Text', type: 'string' },
                  { title: 'Count', type: 'number' },
                ],
              },
              { title: 'Flag', type: 'boolean' },
            ],
          },
        },
        initialFormData: { extra: 'abc' },
        uiSchema: extraUiSchema(),
      });
      const inner = screen.getAllByRole('combobox')[1];

      await user.selectOptions(inner, 'Count');

      expect(onChange.mock.lastCall![0].formData).toStrictEqual({ extra: '' });
      expect(screen.getAllByRole('combobox')[1]).toHaveDisplayValue('Count');
    });

    it('keeps the deprecated marker in the heading of an object it renders', () => {
      createFormComponent({
        schema: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            title: 'Old',
            deprecated: true,
            properties: { a: { type: 'string' } },
          },
        },
        initialFormData: { extra: { a: 'x' } },
        uiSchema: extraUiSchema(),
      });

      expect(screen.getByText('Old (deprecated)')).toBeInTheDocument();
    });

    it('is stored as an object stores it when a named field in place of its options clears it', async () => {
      function ClearingField({ onChange, fieldPath }: FieldProps) {
        return (
          <button type='button' onClick={() => onChange(undefined, fieldPath)}>
            Clear
          </button>
        );
      }
      const { onChange } = createFormComponent({
        schema: { type: 'object', additionalProperties: { oneOf: [{ type: 'string' }, { type: 'number' }] } },
        initialFormData: { extra: 'abc' },
        fields: { ClearingField },
        uiSchema: extraUiSchema({ 'ui:field': 'ClearingField', 'ui:fieldReplacesAnyOrOneOf': true }),
      });

      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(onChange.mock.lastCall![0].formData).toStrictEqual({ extra: '' });
    });

    it('reaches every type of the fallback UI once cleared', async () => {
      createFormComponent({
        schema: { type: 'object', additionalProperties: true },
        useFallbackUiForUnsupportedType: true,
        initialFormData: { extra: 'text' },
        uiSchema: extraUiSchema(),
      });

      await user.clear(screen.getByRole('textbox'));
      await user.selectOptions(screen.getByRole('combobox'), 'boolean');

      expect(screen.getByRole('combobox')).toHaveDisplayValue('boolean');
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('keeps the option an anyOf cell switches to, as its option switch sends it', async () => {
      createFormComponent({
        schema: {
          type: 'object',
          additionalProperties: {
            title: 'Extra',
            anyOf: [
              { type: 'string', title: 'Text' },
              { type: 'number', title: 'Num' },
            ],
          },
        },
        initialFormData: { extra: 'abc' },
        uiSchema: extraUiSchema(),
      });
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'Num');

      expect(screen.getByRole('combobox')).toHaveDisplayValue('Num');
    });

    it("fills in the entry's own default when switched back from a null option", async () => {
      const { onChange } = createFormComponent({
        schema: {
          type: 'object',
          additionalProperties: {
            default: { shared: 'x' },
            anyOf: [
              {
                title: 'Obj',
                type: 'object',
                properties: { a: { type: 'string', default: 'A' }, shared: { type: 'string' } },
              },
              { title: 'Nil', type: 'null' },
            ],
          },
        },
        initialFormData: { extra: { a: 'k' } },
        uiSchema: extraUiSchema(),
      });

      await user.selectOptions(screen.getByRole('combobox'), 'Nil');
      expect(onChange.mock.lastCall![0].formData).toStrictEqual({ extra: null });

      await user.selectOptions(screen.getByRole('combobox'), 'Obj');
      expect(onChange.mock.lastCall![0].formData).toStrictEqual({ extra: { a: 'A', shared: 'x' } });
    });

    it('is stored as an object stores it when its oneOf of constants renders as a select', async () => {
      const { onChange } = createFormComponent({
        schema: { type: 'object', additionalProperties: { title: 'Extra', oneOf: [{ const: 'a' }, { const: 'b' }] } },
        initialFormData: { extra: 'a' },
        uiSchema: extraUiSchema(),
      });
      const select = screen.getByRole('combobox', { name: 'Extra' });

      await user.selectOptions(select, within(select).getByRole('option', { name: '' }));

      expect(onChange.mock.lastCall![0].formData).toStrictEqual({ extra: '' });
    });
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

  // `LayoutMultiSchemaField`'s selector is the only control for the discriminator it writes into the form data, so it's
  // the cell's required control, where `MultiSchemaField`'s picks an option index and the option renders the
  // discriminator as a control of its own (#5527)
  it("requires its selector when the cell is required, marking only the cell's label", () => {
    const { node } = renderGrid(gridUiSchema(), { ...schema, required: ['pick'] });

    screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeRequired());
    expect(node.querySelectorAll('span.rjsf-required')).toHaveLength(1);
    expect(node.querySelector('#root_pick__label + span.rjsf-required')).toBeInTheDocument();
  });

  it('leaves its selector unrequired when the cell is optional', () => {
    const { node } = renderGrid(gridUiSchema());

    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toBeRequired());
    expect(node.querySelector('span.rjsf-required')).not.toBeInTheDocument();
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

  describe('over a field or directive the author names for it', () => {
    // The grid warns about each `ui:field` it overrides, which would otherwise never render without a sign why
    const warnings = setupConsoleWarnSuppression();
    const ignoredFieldWarning =
      'ui:field for cell \'pick\' in "root" is ignored, since a cell with discriminated oneOf/anyOf options renders ' +
      'only its option selector.';

    // `SchemaField` merges the `ui:definitions` entry for the cell's `$ref` beneath the cell's `uiSchema`
    it.each([
      ['a ui:field', { 'ui:field': 'CustomField' }, [[ignoredFieldWarning]]],
      ['a ui:fieldReplacesAnyOrOneOf of false', { 'ui:fieldReplacesAnyOrOneOf': false }, []],
    ])(
      'renders its selector in place of the options, over %s its ui:definitions entry names',
      (_, definition, expectedWarnings) => {
        createFormComponent({ schema: refSchema, uiSchema: refGridUiSchema(definition), fields: { CustomField } });

        expect(screen.queryByTestId('custom-field')).not.toBeInTheDocument();
        expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
        expect(warnings.consoleSpy.mock.calls).toEqual(expectedWarnings);
      },
    );

    it.each([
      ['a ui:field', { 'ui:field': 'CustomField' }, [[ignoredFieldWarning]]],
      ['a ui:field given as a component', { 'ui:field': CustomField }, [[ignoredFieldWarning]]],
      ['a ui:fieldReplacesAnyOrOneOf of false', { 'ui:fieldReplacesAnyOrOneOf': false }, []],
    ])('renders its selector in place of the options, over %s of its own', (_, pickUiSchema, expectedWarnings) => {
      createFormComponent({ schema, uiSchema: gridUiSchema({ pick: pickUiSchema }), fields: { CustomField } });

      expect(screen.queryByTestId('custom-field')).not.toBeInTheDocument();
      expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
      expect(warnings.consoleSpy.mock.calls).toEqual(expectedWarnings);
    });

    // `SchemaField` reads a `ui:field` naming itself as naming none, so a cell naming it, like one naming none, asks for
    // the default rendering, which for a discriminated cell is the selector the grid renders
    it.each([
      ['LayoutMultiSchemaField', { 'ui:field': 'LayoutMultiSchemaField' }],
      ['SchemaField', { 'ui:field': 'SchemaField' }],
      ['no field', { 'ui:field': false }],
    ])('warns about neither a ui:field naming %s nor a plain cell rendering its own', (_, pickUiSchema) => {
      createFormComponent({
        schema,
        uiSchema: gridUiSchema({ note: { 'ui:field': 'CustomField' }, pick: pickUiSchema }),
        fields: { CustomField },
      });

      expect(screen.getByTestId('custom-field')).toBeInTheDocument();
      expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
    });
  });

  it('takes the ui:definitions entry for its $ref', () => {
    createFormComponent({
      schema: refSchema,
      uiSchema: refGridUiSchema({ 'ui:widget': 'select', 'ui:title': 'From definitions' }),
    });

    expect(screen.getByRole('combobox', { name: 'From definitions' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('focuses its selector for its own ui:autofocus', () => {
    renderGrid(gridUiSchema({ pick: { 'ui:autofocus': true } }));

    expect(screen.getAllByRole('radio')[0]).toHaveFocus();
  });

  it("autofocuses no cell for the grid's own ui:autofocus", () => {
    renderGrid({ ...gridUiSchema(), 'ui:autofocus': true });

    expect(screen.getByRole('textbox')).not.toHaveFocus();
    screen.getAllByRole('radio').forEach((radio) => expect(radio).not.toHaveFocus());
  });
  it('keeps the option the discriminator names after transformChange refuses a switch, and switches after it', async () => {
    let refuses = true;
    createFormComponent({
      schema: {
        type: 'object',
        properties: {
          thing: {
            type: 'object',
            discriminator: { propertyName: 'kind' },
            oneOf: [
              {
                title: 'Option A',
                properties: { kind: { type: 'string', const: 'a' }, a: { type: 'string', title: 'A' } },
              },
              {
                title: 'Option B',
                properties: { kind: { type: 'string', const: 'b' }, b: { type: 'string', title: 'B' } },
              },
            ],
          },
        },
      },
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['thing', 'thing.a', 'thing.b'] }] },
      },
      initialFormData: { thing: { kind: 'a', a: 'v' } },
      transformChange: (next, previous) => (refuses ? previous : next),
    });
    await user.click(screen.getByRole('radio', { name: 'Option B' }));
    refuses = false;

    await user.type(screen.getByLabelText('A'), 'x');

    expect(screen.getByLabelText('A')).toHaveValue('vx');
    expect(screen.queryByLabelText('B')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Option B' }));

    expect(screen.getByLabelText('B')).toBeInTheDocument();
    expect(screen.queryByLabelText('A')).not.toBeInTheDocument();
  });
});

describe('a cell in options with no discriminator', () => {
  const optionsSchema: RJSFSchema = {
    type: 'object',
    properties: {
      thing: {
        type: 'object',
        anyOf: [
          { type: 'object', properties: { a: { type: 'string', title: 'A', default: 'x' } } },
          { type: 'object', properties: { a: { type: 'string', title: 'A', default: 'y' } } },
        ],
      },
    },
  };

  it('stays on screen as a user clears and edits a property every option only gives a default', async () => {
    createFormComponent({
      schema: optionsSchema,
      uiSchema: { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['thing.a'] }] } },
    });

    await user.clear(screen.getByLabelText('A'));
    expect(screen.getByLabelText('A')).toHaveValue('');

    await user.type(screen.getByLabelText('A'), 'typed');
    expect(screen.getByLabelText('A')).toHaveValue('typed');
  });

  it('keeps the option shown, and the focus, as a user clears a property only that option declares', async () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: {
          thing: {
            type: 'object',
            anyOf: [
              { type: 'object', properties: { a: { type: 'string', title: 'A' } } },
              { type: 'object', properties: { b: { type: 'string', title: 'B' } } },
            ],
          },
        },
      },
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['thing.a', 'thing.b'] }] },
      },
      initialFormData: { thing: { b: 'x' } },
    });
    const input = screen.getByLabelText('B');

    await user.clear(input);

    expect(screen.getByLabelText('B')).toBe(input);
    expect(input).toHaveFocus();
    expect(screen.queryByLabelText('A')).not.toBeInTheDocument();
  });

  it("keeps the option shown as a user types a value only another option's constraints accept", async () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: {
          thing: {
            type: 'object',
            anyOf: [
              { type: 'object', properties: { s: { type: 'string', title: 'Short', maxLength: 3 } } },
              { type: 'object', properties: { s: { type: 'string', title: 'Long', minLength: 4 } } },
            ],
          },
        },
      },
      uiSchema: { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['thing.s'] }] } },
      initialFormData: { thing: { s: 'ab' } },
    });

    await user.type(screen.getByLabelText('Short'), 'cd');

    expect(screen.getByLabelText('Short')).toHaveValue('abcd');
    expect(screen.queryByLabelText('Long')).not.toBeInTheDocument();
  });

  it('matches the data again as a user edits a property of the object the options disagree about', async () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: {
          thing: {
            type: 'object',
            properties: { x: { type: 'string', title: 'X' } },
            anyOf: [
              { properties: { x: { const: 'one' }, a: { type: 'string', title: 'A' } } },
              { properties: { x: { const: 'two' }, b: { type: 'string', title: 'B' } } },
            ],
          },
        },
      },
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['thing.x', 'thing.a', 'thing.b'] }] },
      },
      initialFormData: { thing: { x: 'one' } },
    });
    await user.type(screen.getByLabelText('A'), 'q');

    await user.clear(screen.getByLabelText('X'));
    await user.type(screen.getByLabelText('X'), 'two');

    expect(screen.getByLabelText('B')).toBeInTheDocument();
    expect(screen.queryByLabelText('A')).not.toBeInTheDocument();
  });

  it('keeps the option shown as a user edits a property of the object the options agree about', async () => {
    const ref = createFormRef();
    createFormComponent({
      ref,
      schema: {
        type: 'object',
        properties: {
          thing: {
            type: 'object',
            properties: { y: { type: 'string', title: 'Y' } },
            anyOf: [
              { properties: { s: { type: 'string', title: 'Short', maxLength: 3 } } },
              { properties: { s: { type: 'string', title: 'Long', minLength: 4 } } },
            ],
          },
        },
      },
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['thing.y', 'thing.s'] }] },
      },
      initialFormData: { thing: { s: 'abcd' } },
    });
    await user.type(screen.getByLabelText('Y'), 'z');

    // Data from outside that both options fit as well is matched again with the kept option preferred
    act(() => handleOf(ref).setFieldValue('thing', { y: 'z' }));

    expect(screen.getByLabelText('Long')).toBeInTheDocument();
    expect(screen.queryByLabelText('Short')).not.toBeInTheDocument();
  });

  it('keeps the option shown at each level of options a cell is read through', async () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: {
          thing: {
            type: 'object',
            anyOf: [
              {
                properties: {
                  inner: {
                    type: 'object',
                    anyOf: [
                      { properties: { a: { type: 'string', title: 'A' } } },
                      { properties: { b: { type: 'string', title: 'B' } } },
                    ],
                  },
                },
              },
              { properties: { other: { type: 'string', title: 'Other' } } },
            ],
          },
        },
      },
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['thing.inner.a', 'thing.inner.b', 'thing.other'] }] },
      },
      initialFormData: { thing: { inner: { b: 'x' } } },
    });
    const input = screen.getByLabelText('B');

    await user.clear(input);

    expect(screen.getByLabelText('B')).toBe(input);
    expect(screen.queryByLabelText('A')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Other')).not.toBeInTheDocument();
  });

  it('keeps the option shown as a user clears a cell in the options of the schema the grid is on', async () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: { x: { type: 'string', title: 'X' } },
        anyOf: [
          { properties: { a: { type: 'string', title: 'A' } } },
          { properties: { b: { type: 'string', title: 'B' } } },
        ],
      },
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:fieldReplacesAnyOrOneOf': true,
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['x', 'a', 'b'] }] },
      },
      initialFormData: { b: 'x' },
    });
    const input = screen.getByLabelText('B');

    await user.clear(input);

    expect(screen.getByLabelText('B')).toBe(input);
    expect(screen.queryByLabelText('A')).not.toBeInTheDocument();
  });

  const selectorSchema: RJSFSchema = {
    type: 'object',
    properties: {
      thing: {
        type: 'object',
        anyOf: [
          {
            title: 'Option A',
            properties: { kind: { type: 'string', const: 'a' }, a: { type: 'string', title: 'A' } },
          },
          {
            title: 'Option B',
            properties: { kind: { type: 'string', const: 'b' }, b: { type: 'string', title: 'B' } },
          },
        ],
      },
    },
  };
  const selectorCellUiSchema: UiSchema = {
    'ui:field': 'LayoutMultiSchemaField',
    'ui:fieldReplacesAnyOrOneOf': true,
    'ui:options': { optionsSchemaSelector: 'kind' },
  };
  const selectorUiSchema: UiSchema = {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['thing', 'thing.a', 'thing.b'] }] },
    thing: selectorCellUiSchema,
  };

  it('shows the option a selector cell switches to after a cell edit kept another', async () => {
    createFormComponent({
      schema: selectorSchema,
      uiSchema: selectorUiSchema,
      initialFormData: { thing: { kind: 'a' } },
    });
    await user.type(screen.getByLabelText('A'), 'q');

    await user.selectOptions(screen.getByRole('combobox'), 'Option B');

    expect(screen.getByLabelText('B')).toBeInTheDocument();
    expect(screen.queryByLabelText('A')).not.toBeInTheDocument();
  });

  it('keeps the option shown through a cell edit after transformChange refuses a switch from data naming no option', async () => {
    let refuses = true;
    createFormComponent({
      schema: selectorSchema,
      uiSchema: selectorUiSchema,
      initialFormData: { thing: { kind: 'z', a: 'v' } },
      transformChange: (next, previous) => (refuses ? previous : next),
    });
    await user.selectOptions(screen.getByRole('combobox'), 'Option B');
    refuses = false;

    await user.type(screen.getByLabelText('A'), 'x');

    expect(screen.getByLabelText('A')).toHaveValue('vx');
    expect(screen.queryByLabelText('B')).not.toBeInTheDocument();
  });

  it("shows none of the options' cells once a user clears the selector cell", async () => {
    createFormComponent({
      schema: selectorSchema,
      uiSchema: { ...selectorUiSchema, thing: { ...selectorCellUiSchema, 'ui:placeholder': 'None' } },
      initialFormData: { thing: { kind: 'a' } },
    });
    await user.type(screen.getByLabelText('A'), 'q');

    await user.selectOptions(screen.getByRole('combobox'), 'None');

    expect(screen.queryByLabelText('A')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('B')).not.toBeInTheDocument();
  });

  it('renders the field a named render cell finds, rather than the render', () => {
    createFormComponent({
      schema: optionsSchema,
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': [{ name: 'thing.a', render: CustomField }] }] },
      },
    });

    expect(screen.getByLabelText('A')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-field')).not.toBeInTheDocument();
  });

  it('shows a render with no name in place of the field its name would find', () => {
    createFormComponent({
      schema: optionsSchema,
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': [{ name: '', render: CustomField }] }] },
      },
    });

    expect(screen.getByTestId('custom-field')).toBeInTheDocument();
  });
});

describe('a cell in options of the schema the grid is on, whose options render beside the grid', () => {
  const besideSchema: RJSFSchema = {
    type: 'object',
    properties: { x: { type: 'string' } },
    anyOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'number' } } }],
  };
  const discriminatedSchema: RJSFSchema = {
    type: 'object',
    discriminator: { propertyName: 'kind' },
    properties: { x: { type: 'string' } },
    oneOf: [
      { properties: { kind: { const: 'a' }, a: { type: 'string' } } },
      { properties: { kind: { const: 'b' }, b: { type: 'number' } } },
    ],
  };
  const besideUiSchema: UiSchema = {
    'ui:field': 'LayoutGridField',
    'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['x', 'a'] }] },
  };

  it.each<[string, RJSFSchema, GenericObjectType]>([
    ['with no discriminator', besideSchema, { a: 'q' }],
    ['with a discriminator', discriminatedSchema, { kind: 'a', a: 'q' }],
  ])("leaves the option's property to the option, so its input renders once, %s", (_, schema, initialFormData) => {
    const { node } = createFormComponent({ schema, uiSchema: besideUiSchema, initialFormData });

    expect(node.querySelector('#root_x')).toBeInTheDocument();
    expect(node.querySelectorAll('#root_a')).toHaveLength(1);
  });

  it('leaves an extra key to the option whose own options render it, so its input renders once', () => {
    const { node } = createFormComponent({
      schema: {
        type: 'object',
        additionalProperties: { type: 'string' },
        properties: { x: { type: 'string' } },
        anyOf: [
          {
            properties: { a: { type: 'string' } },
            anyOf: [{ properties: { c: { type: 'string' } } }, { properties: { d: { type: 'number' } } }],
          },
          { properties: { b: { type: 'number' } } },
        ],
      },
      uiSchema: { ...besideUiSchema, 'ui:layoutGrid': { 'ui:row': [{ 'ui:col': ['x', 'c'] }] } },
      initialFormData: { a: 'q', c: 'z' },
    });

    expect(node.querySelectorAll('#root_c')).toHaveLength(1);
  });

  it('shows only the option the selector switches to', async () => {
    const { node } = createFormComponent({
      schema: besideSchema,
      uiSchema: besideUiSchema,
      initialFormData: { a: 'q' },
    });

    await user.selectOptions(screen.getByRole('combobox'), 'Option 2');

    expect(node.querySelectorAll('#root_b')).toHaveLength(1);
    expect(node.querySelector('#root_a')).not.toBeInTheDocument();
  });

  it("shows a named render cell's render in place of the option's property", () => {
    createFormComponent({
      schema: discriminatedSchema,
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': [{ 'ui:col': [{ name: 'a', render: CustomField }] }] },
      },
      initialFormData: { kind: 'a', a: 'q' },
    });

    expect(screen.getByTestId('custom-field')).toBeInTheDocument();
  });
});
