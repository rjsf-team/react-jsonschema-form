import { memo } from 'react';

import type {
  Field,
  MergedThemePresentation,
  PartOwner,
  PresentationSource,
  RJSFSchema,
  ThemePresentation,
  Widget,
} from '../src/index.ts';
import { getPresentationDeclaration, mergeThemePresentation, WIDGET_FIELD_PRESENTATION } from '../src/index.ts';

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

const source: PresentationSource = {
  fields: { StringField, ArrayField, ObjectField },
  widgets: { TextWidget, CheckboxWidget, RadioWidget },
  presentation,
};

describe('getPresentationDeclaration()', () => {
  it('has a field draw its own label and description when nothing declares otherwise', () => {
    expect(
      getPresentationDeclaration({ fields: {}, widgets: {} }, { schema: { type: 'object' }, field: ObjectField }),
    ).toEqual(FIELD_DEFAULT);
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

  it('reads a field no key named by the key it is registered under', () => {
    expect(
      getPresentationDeclaration(source, { schema: { type: 'string' }, field: StringField, widget: 'text' }),
    ).toEqual(TEMPLATE);
  });

  it('reads a field by the key that named it when that key declares it, otherwise by its registered key', () => {
    const subject = { schema: { type: 'string' }, field: StringField, fieldKey: 'MyField', widget: 'text' } as const;
    const fields = { ...presentation.fields, MyField: { label: 'template' } } as const;
    expect(getPresentationDeclaration({ ...source, presentation: { ...presentation, fields } }, subject)).toEqual({
      ...FIELD_DEFAULT,
      label: 'template',
    });
    expect(getPresentationDeclaration(source, subject)).toEqual(TEMPLATE);
  });

  it('reads a component registered under several keys by the first of them that declares it', () => {
    const MultiSchemaField: Field = () => null;
    const MyInput: Widget = () => null;
    const theme: PresentationSource = {
      fields: { AnyOfField: MultiSchemaField, OneOfField: MultiSchemaField },
      widgets: { TextWidget: MyInput, MyInput },
      presentation: {
        fields: { OneOfField: { label: 'template' }, StringField: WIDGET_FIELD_PRESENTATION },
        widgets: { MyInput: { label: 'self' } },
      },
    };
    const expected = { ...FIELD_DEFAULT, label: 'template' };
    expect(getPresentationDeclaration(theme, { schema: {}, field: MultiSchemaField })).toEqual(expected);
    expect(getPresentationDeclaration(theme, { schema: {}, field: MultiSchemaField, fieldKey: 'AnyOfField' })).toEqual(
      expected,
    );
    const subject = { schema: { type: 'string' }, field: StringField, fieldKey: 'StringField' } as const;
    expect(getPresentationDeclaration(theme, { ...subject, widget: 'MyInput' })).toEqual({
      ...TEMPLATE,
      label: 'self',
    });
    expect(getPresentationDeclaration(theme, { ...subject, widget: MyInput })).toEqual({ ...TEMPLATE, label: 'self' });
    expect(getPresentationDeclaration(theme, { ...subject, widget: 'text' })).toEqual({ ...TEMPLATE, label: 'self' });
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

  describe("the theme's fieldDefault", () => {
    const fieldDefault = { description: 'template', errors: 'self' } as const;
    const theme: PresentationSource = { ...source, presentation: { ...presentation, fieldDefault } };
    const array: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true };

    it('is what a field draws for a part nothing declares for it, custom fields included', () => {
      const MyField: Field = () => null;
      const expected = { ...FIELD_DEFAULT, ...fieldDefault };
      expect(getPresentationDeclaration(theme, { schema: { type: 'string' }, field: MyField })).toEqual(expected);
      expect(getPresentationDeclaration(theme, { schema: { type: 'object' }, field: ObjectField })).toEqual(expected);
    });

    it('is what a part left to a widget falls back to when the field renders none', () => {
      expect(getPresentationDeclaration(theme, { schema: array, field: ArrayField, fieldKey: 'ArrayField' })).toEqual({
        ...FIELD_DEFAULT,
        ...fieldDefault,
      });
    });

    it("doesn't override a part a field's entry declares, such as one left to its widget", () => {
      expect(
        getPresentationDeclaration(theme, {
          schema: array,
          field: ArrayField,
          fieldKey: 'ArrayField',
          widget: 'select',
        }),
      ).toEqual(TEMPLATE);
      const fields = { ...presentation.fields, ObjectField: { description: 'self' } } as const;
      expect(
        getPresentationDeclaration(
          { ...source, presentation: { ...presentation, fields, fieldDefault } },
          { schema: { type: 'object' }, field: ObjectField },
        ),
      ).toEqual({ ...FIELD_DEFAULT, errors: 'self' });
    });

    it('gives its labelledBy only to fields that keep their label, not to one leaving it to a widget', () => {
      const labelled: PresentationSource = {
        ...source,
        presentation: { ...presentation, fieldDefault: { label: 'template', labelledBy: 'aria-labelledby' } },
      };
      const MyField: Field = () => null;
      expect(getPresentationDeclaration(labelled, { schema: { type: 'string' }, field: MyField })).toEqual({
        ...FIELD_DEFAULT,
        label: 'template',
        labelledBy: 'aria-labelledby',
      });
      expect(
        getPresentationDeclaration(labelled, {
          schema: { type: 'string' },
          field: StringField,
          fieldKey: 'StringField',
          widget: 'text',
        }),
      ).toEqual(TEMPLATE);
    });

    it("puts a field's own labelledBy over its fieldDefault's when it renders no widget to leave its label to", () => {
      const fields = {
        ...presentation.fields,
        ArrayField: { ...WIDGET_FIELD_PRESENTATION, labelledBy: 'for' },
      } as const;
      const labelled: PresentationSource = {
        ...source,
        presentation: { ...presentation, fields, fieldDefault: { label: 'template', labelledBy: 'aria-labelledby' } },
      };
      expect(
        getPresentationDeclaration(labelled, { schema: array, field: ArrayField, fieldKey: 'ArrayField' }),
      ).toEqual({ ...FIELD_DEFAULT, label: 'template', labelledBy: 'for' });
    });

    it('gives an unmerged layer the same answer as a merged one', () => {
      const layer: ThemePresentation = { fields: { ObjectField: { label: 'template' } }, fieldDefault };
      const subject = { schema: { type: 'object' }, field: ObjectField } as const;
      const expected = { ...FIELD_DEFAULT, ...fieldDefault, label: 'template' };
      expect(getPresentationDeclaration({ ...source, presentation: layer }, subject)).toEqual(expected);
      expect(getPresentationDeclaration({ ...source, presentation: mergeThemePresentation(layer) }, subject)).toEqual(
        expected,
      );
    });
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

  it('reads a widget given as a component by the key it is registered under, however a replacement wraps it', () => {
    const MyCheckbox: Widget = memo(() => null);
    const theme: PresentationSource = { ...source, widgets: { CheckboxWidget: MyCheckbox, TextWidget } };
    expect(
      getPresentationDeclaration(theme, {
        schema: { type: 'boolean' },
        field: StringField,
        fieldKey: 'BooleanField',
        widget: MyCheckbox,
      }),
    ).toEqual({ ...TEMPLATE, label: 'self', description: 'self' });
  });

  it('gives a widget no layer declares the default, registered or given as an unregistered component', () => {
    const theme: PresentationSource = { ...source, presentation: { ...presentation, default: { label: 'self' } } };
    const subject = { schema: { type: 'string' }, field: StringField, fieldKey: 'StringField' } as const;
    const Inline: Widget = () => null;
    expect(getPresentationDeclaration(theme, { ...subject, widget: 'text' })).toEqual({ ...TEMPLATE, label: 'self' });
    expect(getPresentationDeclaration(theme, { ...subject, widget: TextWidget })).toEqual({
      ...TEMPLATE,
      label: 'self',
    });
    expect(getPresentationDeclaration(theme, { ...subject, widget: Inline })).toEqual({ ...TEMPLATE, label: 'self' });
    expect(getPresentationDeclaration(source, { ...subject, widget: Inline })).toEqual(TEMPLATE);
  });

  it("reads an unmerged layer's default beneath its own entry, as mergeThemePresentation() would", () => {
    const layer: ThemePresentation = {
      default: { label: 'self' },
      widgets: { TextWidget: { errors: 'self' } },
      fields: { StringField: WIDGET_FIELD_PRESENTATION },
    };
    const subject = {
      schema: { type: 'string' },
      field: StringField,
      fieldKey: 'StringField',
      widget: 'text',
    } as const;
    const expected = { ...TEMPLATE, label: 'self', errors: 'self' };
    expect(getPresentationDeclaration({ ...source, presentation: layer }, subject)).toEqual(expected);
    expect(getPresentationDeclaration({ ...source, presentation: mergeThemePresentation(layer) }, subject)).toEqual(
      expected,
    );
  });

  it("types a widget's declarations without the widget owner, which has no widget beneath it", () => {
    type WidgetOwner = Exclude<PartOwner, 'widget'> | undefined;
    expectTypeOf<NonNullable<ThemePresentation['default']>['errors']>().toEqualTypeOf<WidgetOwner>();
    expectTypeOf<NonNullable<ThemePresentation['fieldDefault']>['label']>().toEqualTypeOf<WidgetOwner>();
    expectTypeOf<NonNullable<ThemePresentation['widgets']>[string]['help']>().toEqualTypeOf<WidgetOwner>();
    expectTypeOf<NonNullable<ThemePresentation['fields']>[string]['label']>().toEqualTypeOf<PartOwner | undefined>();
  });

  it('reads no declaration off a component, which a wrapper would not carry', () => {
    expectTypeOf<Field>().not.toHaveProperty('presentation');
    expectTypeOf<Widget>().not.toHaveProperty('presentation');
  });

  // `getWidget()` throws on each of these, with an error naming the schema, so none of them renders
  it('gives a widget getWidget() rejects whatever is declared for it, without throwing', () => {
    const { 'ui:widget': nullWidget, widgets } = JSON.parse('{ "ui:widget": null, "widgets": { "TextWidget": null } }');
    const subject = { schema: { type: 'string' }, field: StringField, fieldKey: 'StringField' } as const;
    const declared = {
      ...presentation,
      default: { label: 'self' },
      widgets: { TextWidget: { errors: 'self' }, Unregistered: { help: 'self' } },
    } as const;
    const theme: PresentationSource = { fields: {}, widgets, presentation: declared };
    const byDefault = { ...TEMPLATE, label: 'self' };
    expect(getPresentationDeclaration(theme, { ...subject, widget: 'Unregistered' })).toEqual({
      ...byDefault,
      help: 'self',
    });
    expect(getPresentationDeclaration(theme, { ...subject, widget: 'nope' })).toEqual(byDefault);
    expect(getPresentationDeclaration(theme, { ...subject, widget: 'text' })).toEqual({ ...byDefault, errors: 'self' });
    expect(getPresentationDeclaration(theme, { ...subject, widget: 'TextWidget' })).toEqual({
      ...byDefault,
      errors: 'self',
    });
    expect(getPresentationDeclaration(theme, { ...subject, widget: nullWidget })).toEqual(byDefault);
  });

  it('reads a widget key that is declared but not registered', () => {
    expect(
      getPresentationDeclaration(
        { fields: {}, widgets: {}, presentation },
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

    it('can opt into the template label under its key, however it was named', () => {
      const theme: PresentationSource = {
        fields: { MyField },
        widgets: {},
        presentation: { fields: { MyField: { label: 'template' } } },
      };
      const expected = { ...TEMPLATE, description: 'self' };
      expect(
        getPresentationDeclaration(theme, { schema: { type: 'string' }, field: MyField, fieldKey: 'MyField' }),
      ).toEqual(expected);
      expect(getPresentationDeclaration(theme, { schema: { type: 'string' }, field: MyField })).toEqual(expected);
    });

    it('leaves a part it declares to its widget to whoever that widget says draws it', () => {
      const subject = { schema: { type: 'string' }, field: MyField, fieldKey: 'GridCell' } as const;
      const cell = { GridCell: { label: 'widget' } } as const;
      expect(
        getPresentationDeclaration(
          { ...source, presentation: { ...presentation, fields: cell } },
          { ...subject, widget: 'RadioWidget' },
        ),
      ).toEqual({ ...TEMPLATE, description: 'self', labelledBy: 'aria-labelledby' });
      expect(
        getPresentationDeclaration(
          { fields: {}, widgets: {}, presentation: { fields: cell, widgets: { SelectWidget: { label: 'self' } } } },
          { ...subject, widget: 'select' },
        ),
      ).toEqual(FIELD_DEFAULT);
    });
  });

  it("reads a field's own labelledBy when it keeps its label", () => {
    const fields = { Group: { label: 'template', labelledBy: 'aria-labelledby' } } as const;
    expect(
      getPresentationDeclaration(
        { ...source, presentation: { ...presentation, fields } },
        { schema: { type: 'array' }, field: ObjectField, fieldKey: 'Group' },
      ),
    ).toEqual({
      ...FIELD_DEFAULT,
      label: 'template',
      labelledBy: 'aria-labelledby',
    });
  });

  it("falls back to a field's own labelledBy when the widget it leaves its label to declares none", () => {
    const fields = { Group: { ...WIDGET_FIELD_PRESENTATION, labelledBy: 'aria-labelledby' } } as const;
    expect(
      getPresentationDeclaration(
        { ...source, presentation: { ...presentation, fields } },
        { schema: { type: 'string' }, field: ObjectField, fieldKey: 'Group', widget: 'text' },
      ),
    ).toEqual({
      ...TEMPLATE,
      labelledBy: 'aria-labelledby',
    });
  });

  it('looks a field key up as an own property', () => {
    expect(
      getPresentationDeclaration(source, {
        schema: { type: 'string' },
        field: () => null,
        fieldKey: 'constructor',
        widget: 'text',
      }),
    ).toEqual(FIELD_DEFAULT);
  });
});
