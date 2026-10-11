import type { Field, PresentationSource, ThemePresentation, Widget } from '../src/index.ts';
import { getPresentationDeclaration } from '../src/index.ts';

const TEMPLATE = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

const StringField: Field = () => null;
const ObjectField: Field = () => null;
const TextWidget: Widget = () => null;
const CheckboxWidget: Widget = () => null;
const RadioWidget: Widget = () => null;

const presentation: ThemePresentation = {
  widgets: {
    CheckboxWidget: { label: 'self', description: 'self' },
    RadioWidget: { labelledBy: 'aria-labelledby' },
  },
  fields: { ObjectField: { label: 'self', description: 'self' } },
};

const source: PresentationSource = { widgets: { TextWidget, CheckboxWidget, RadioWidget }, presentation };

describe('getPresentationDeclaration()', () => {
  it('leaves every part to the template when nothing declares one', () => {
    expect(getPresentationDeclaration({ widgets: {} }, { schema: { type: 'object' }, field: ObjectField })).toEqual(
      TEMPLATE,
    );
  });

  it('reads the declaration of a field rendering no single widget from its key', () => {
    expect(
      getPresentationDeclaration(source, { schema: { type: 'object' }, field: ObjectField, fieldKey: 'ObjectField' }),
    ).toEqual({ ...TEMPLATE, label: 'self', description: 'self' });
  });

  it("reads the declaration of a field's widget by the key its alias stands for", () => {
    expect(
      getPresentationDeclaration(source, {
        schema: { type: 'boolean' },
        field: StringField,
        fieldKey: 'BooleanField',
        widget: 'checkbox',
      }),
    ).toEqual({ ...TEMPLATE, label: 'self', description: 'self' });
  });

  it("takes the widget's labelledBy, which is how the template's label reaches its control", () => {
    expect(
      getPresentationDeclaration(source, { schema: { type: 'string' }, field: StringField, widget: 'RadioWidget' }),
    ).toEqual({ ...TEMPLATE, labelledBy: 'aria-labelledby' });
  });

  it("layers the component's declaration over the theme's for its key", () => {
    const MyCheckbox: Widget = Object.assign(() => null, { presentation: { errors: 'self' } as const });
    const theme: PresentationSource = { widgets: { CheckboxWidget: MyCheckbox, TextWidget }, presentation };
    expect(
      getPresentationDeclaration(theme, { schema: { type: 'boolean' }, field: StringField, widget: 'CheckboxWidget' }),
    ).toEqual({ ...TEMPLATE, label: 'self', description: 'self', errors: 'self' });
  });

  it('reads a widget given as a component by its own declaration alone', () => {
    const Inline: Widget = Object.assign(() => null, { presentation: { label: 'self' } as const });
    expect(
      getPresentationDeclaration(source, { schema: { type: 'string' }, field: StringField, widget: Inline }),
    ).toEqual({ ...TEMPLATE, label: 'self' });
    expect(
      getPresentationDeclaration(source, { schema: { type: 'string' }, field: StringField, widget: TextWidget }),
    ).toEqual(TEMPLATE);
  });

  // A duplicate label is recoverable; a control left unnamed because its widget was guessed to name it is not
  it('leaves every part to the template for a widget that is neither registered nor an alias', () => {
    expect(
      getPresentationDeclaration(
        { ...source, presentation: { widgets: { Unregistered: { label: 'self' } } } },
        { schema: { type: 'string' }, field: StringField, widget: 'Unregistered' },
      ),
    ).toEqual(TEMPLATE);
  });

  it('reads a widget key that is declared but not registered', () => {
    expect(
      getPresentationDeclaration(
        { widgets: {}, presentation },
        { schema: { type: 'boolean' }, field: StringField, widget: 'checkbox' },
      ),
    ).toEqual({ ...TEMPLATE, label: 'self', description: 'self' });
  });

  describe('a field named by a ui:field or a $id', () => {
    const MyField: Field = () => null;

    it('draws its own label and description by default', () => {
      expect(
        getPresentationDeclaration(source, { schema: { type: 'string' }, field: MyField, isNamedField: true }),
      ).toEqual({ ...TEMPLATE, label: 'self', description: 'self' });
    });

    it('ignores the widget unless it leaves a part to it', () => {
      expect(
        getPresentationDeclaration(source, {
          schema: { type: 'boolean' },
          field: MyField,
          isNamedField: true,
          widget: 'checkbox',
        }),
      ).toEqual({ ...TEMPLATE, label: 'self', description: 'self' });
    });

    it('can opt into the template label through the theme or its own declaration', () => {
      const theme: PresentationSource = { widgets: {}, presentation: { fields: { MyField: { label: 'template' } } } };
      expect(
        getPresentationDeclaration(theme, {
          schema: { type: 'string' },
          field: MyField,
          fieldKey: 'MyField',
          isNamedField: true,
        }),
      ).toEqual({ ...TEMPLATE, description: 'self' });
      const Declared: Field = Object.assign(() => null, { presentation: { description: 'template' } as const });
      expect(
        getPresentationDeclaration(theme, {
          schema: { type: 'string' },
          field: Declared,
          fieldKey: 'MyField',
          isNamedField: true,
        }),
      ).toEqual(TEMPLATE);
    });

    it('leaves a part it declares to its widget to whoever that widget says draws it', () => {
      const GridCell: Field = Object.assign(() => null, { presentation: { label: 'widget' } as const });
      expect(
        getPresentationDeclaration(source, {
          schema: { type: 'string' },
          field: GridCell,
          isNamedField: true,
          widget: 'RadioWidget',
        }),
      ).toEqual({ ...TEMPLATE, description: 'self', labelledBy: 'aria-labelledby' });
      expect(
        getPresentationDeclaration(
          { widgets: {}, presentation: { widgets: { SelectWidget: { label: 'self' } } } },
          { schema: { type: 'string' }, field: GridCell, isNamedField: true, widget: 'select' },
        ),
      ).toEqual({ ...TEMPLATE, label: 'self', description: 'self' });
    });

    it('leaves a part it declares to its widget to the template when there is no widget', () => {
      const GridCell: Field = Object.assign(() => null, { presentation: { label: 'widget' } as const });
      expect(
        getPresentationDeclaration(source, { schema: { type: 'string' }, field: GridCell, isNamedField: true }),
      ).toEqual({ ...TEMPLATE, description: 'self' });
    });
  });

  it("reads a field's own labelledBy when it keeps its label", () => {
    const Group: Field = Object.assign(() => null, { presentation: { labelledBy: 'aria-labelledby' } as const });
    expect(getPresentationDeclaration(source, { schema: { type: 'array' }, field: Group })).toEqual({
      ...TEMPLATE,
      labelledBy: 'aria-labelledby',
    });
  });

  it("falls back to a field's own labelledBy when the widget it leaves its label to declares none", () => {
    const Group: Field = Object.assign(() => null, { presentation: { labelledBy: 'aria-labelledby' } as const });
    expect(getPresentationDeclaration(source, { schema: { type: 'string' }, field: Group, widget: 'text' })).toEqual({
      ...TEMPLATE,
      labelledBy: 'aria-labelledby',
    });
  });

  it('looks a field key up as an own property', () => {
    expect(
      getPresentationDeclaration(source, { schema: { type: 'object' }, field: ObjectField, fieldKey: 'constructor' }),
    ).toEqual(TEMPLATE);
  });
});
