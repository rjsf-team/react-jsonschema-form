import type { Field, MergedThemePresentation, PresentationSource, RJSFSchema, Widget } from '../src/index.ts';
import { getPresentationDeclaration, WIDGET_FIELD_PRESENTATION } from '../src/index.ts';

const TEMPLATE = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};
const FIELD_DEFAULT = { ...TEMPLATE, label: 'self', description: 'self' };

const StringField: Field = () => null;
const ArrayField: Field = () => null;
const ObjectField: Field = () => null;
const TextWidget: Widget = () => null;
const CheckboxWidget: Widget = () => null;
const RadioWidget: Widget = () => null;

const presentation: Partial<MergedThemePresentation> = {
  widgets: {
    CheckboxWidget: { label: 'self', description: 'self' },
    RadioWidget: { labelledBy: 'aria-labelledby' },
  },
  fields: {
    StringField: WIDGET_FIELD_PRESENTATION,
    BooleanField: WIDGET_FIELD_PRESENTATION,
    ArrayField: WIDGET_FIELD_PRESENTATION,
  },
};

const source: PresentationSource = { widgets: { TextWidget, CheckboxWidget, RadioWidget }, presentation };

describe('getPresentationDeclaration()', () => {
  it('has a field draw its own label and description when nothing declares otherwise', () => {
    expect(getPresentationDeclaration({ widgets: {} }, { schema: { type: 'object' }, field: ObjectField })).toEqual(
      FIELD_DEFAULT,
    );
    expect(
      getPresentationDeclaration(source, {
        schema: { type: 'string' },
        field: () => null,
        fieldKey: 'MyField',
        widget: 'text',
      }),
    ).toEqual(FIELD_DEFAULT);
  });

  it('leaves the parts of a field declared by its key to its widget', () => {
    expect(
      getPresentationDeclaration(source, {
        schema: { type: 'string' },
        field: StringField,
        fieldKey: 'StringField',
        widget: 'text',
      }),
    ).toEqual(TEMPLATE);
  });

  it('leaves the parts of a field given as a component declaring itself to its widget', () => {
    const Declared: Field = Object.assign(() => null, { presentation: WIDGET_FIELD_PRESENTATION });
    expect(getPresentationDeclaration(source, { schema: { type: 'string' }, field: Declared, widget: 'text' })).toEqual(
      TEMPLATE,
    );
  });

  it("reads the declaration of a field's widget by the key its alias stands for", () => {
    expect(
      getPresentationDeclaration(source, {
        schema: { type: 'boolean' },
        field: StringField,
        fieldKey: 'BooleanField',
        widget: 'checkbox',
      }),
    ).toEqual(FIELD_DEFAULT);
  });

  it('falls back to the field default for a part left to a widget when it renders none', () => {
    const array: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true };
    expect(getPresentationDeclaration(source, { schema: array, field: ArrayField, fieldKey: 'ArrayField' })).toEqual(
      FIELD_DEFAULT,
    );
    expect(
      getPresentationDeclaration(source, {
        schema: array,
        field: ArrayField,
        fieldKey: 'ArrayField',
        widget: 'checkboxes',
      }),
    ).toEqual(TEMPLATE);
  });

  it("takes the widget's labelledBy, which is how the template's label reaches its control", () => {
    expect(
      getPresentationDeclaration(source, {
        schema: { type: 'string' },
        field: StringField,
        fieldKey: 'StringField',
        widget: 'RadioWidget',
      }),
    ).toEqual({ ...TEMPLATE, labelledBy: 'aria-labelledby' });
  });

  it("layers the component's declaration over the theme's for its key", () => {
    const MyCheckbox: Widget = Object.assign(() => null, { presentation: { errors: 'self' } as const });
    const theme: PresentationSource = { widgets: { CheckboxWidget: MyCheckbox, TextWidget }, presentation };
    expect(
      getPresentationDeclaration(theme, {
        schema: { type: 'boolean' },
        field: StringField,
        fieldKey: 'BooleanField',
        widget: 'CheckboxWidget',
      }),
    ).toEqual({ ...TEMPLATE, label: 'self', description: 'self', errors: 'self' });
  });

  it('reads a widget given as a component by its own declaration alone', () => {
    const Inline: Widget = Object.assign(() => null, { presentation: { label: 'self' } as const });
    const subject = { schema: { type: 'string' }, field: StringField, fieldKey: 'StringField' } as const;
    expect(getPresentationDeclaration(source, { ...subject, widget: Inline })).toEqual({ ...TEMPLATE, label: 'self' });
    expect(getPresentationDeclaration(source, { ...subject, widget: TextWidget })).toEqual(TEMPLATE);
  });

  // A duplicate label is recoverable; a control left unnamed because its widget was guessed to name it is not
  it('leaves every part to the template for a widget that is neither registered nor an alias', () => {
    expect(
      getPresentationDeclaration(
        { ...source, presentation: { ...presentation, widgets: { Unregistered: { label: 'self' } } } },
        { schema: { type: 'string' }, field: StringField, fieldKey: 'StringField', widget: 'Unregistered' },
      ),
    ).toEqual(TEMPLATE);
  });

  it('reads a widget key that is declared but not registered', () => {
    expect(
      getPresentationDeclaration(
        { widgets: {}, presentation },
        { schema: { type: 'boolean' }, field: StringField, fieldKey: 'BooleanField', widget: 'checkbox' },
      ),
    ).toEqual(FIELD_DEFAULT);
  });

  describe('a field that draws its own parts', () => {
    const MyField: Field = () => null;

    it('ignores the widget unless it leaves a part to it', () => {
      expect(
        getPresentationDeclaration(source, { schema: { type: 'boolean' }, field: MyField, widget: 'RadioWidget' }),
      ).toEqual(FIELD_DEFAULT);
    });

    it('can opt into the template label through the theme or its own declaration', () => {
      const theme: PresentationSource = { widgets: {}, presentation: { fields: { MyField: { label: 'template' } } } };
      expect(
        getPresentationDeclaration(theme, { schema: { type: 'string' }, field: MyField, fieldKey: 'MyField' }),
      ).toEqual({ ...TEMPLATE, description: 'self' });
      const Declared: Field = Object.assign(() => null, { presentation: { description: 'template' } as const });
      expect(
        getPresentationDeclaration(theme, { schema: { type: 'string' }, field: Declared, fieldKey: 'MyField' }),
      ).toEqual(TEMPLATE);
    });

    it('leaves a part it declares to its widget to whoever that widget says draws it', () => {
      const GridCell: Field = Object.assign(() => null, { presentation: { label: 'widget' } as const });
      expect(
        getPresentationDeclaration(source, { schema: { type: 'string' }, field: GridCell, widget: 'RadioWidget' }),
      ).toEqual({ ...TEMPLATE, description: 'self', labelledBy: 'aria-labelledby' });
      expect(
        getPresentationDeclaration(
          { widgets: {}, presentation: { widgets: { SelectWidget: { label: 'self' } } } },
          { schema: { type: 'string' }, field: GridCell, widget: 'select' },
        ),
      ).toEqual(FIELD_DEFAULT);
    });
  });

  it("reads a field's own labelledBy when it keeps its label", () => {
    const Group: Field = Object.assign(() => null, {
      presentation: { label: 'template', labelledBy: 'aria-labelledby' } as const,
    });
    expect(getPresentationDeclaration(source, { schema: { type: 'array' }, field: Group })).toEqual({
      ...FIELD_DEFAULT,
      label: 'template',
      labelledBy: 'aria-labelledby',
    });
  });

  it("falls back to a field's own labelledBy when the widget it leaves its label to declares none", () => {
    const Group: Field = Object.assign(() => null, {
      presentation: { ...WIDGET_FIELD_PRESENTATION, labelledBy: 'aria-labelledby' } as const,
    });
    expect(getPresentationDeclaration(source, { schema: { type: 'string' }, field: Group, widget: 'text' })).toEqual({
      ...TEMPLATE,
      labelledBy: 'aria-labelledby',
    });
  });

  it('looks a field key up as an own property', () => {
    expect(
      getPresentationDeclaration(source, {
        schema: { type: 'string' },
        field: StringField,
        fieldKey: 'constructor',
        widget: 'text',
      }),
    ).toEqual(FIELD_DEFAULT);
  });
});
