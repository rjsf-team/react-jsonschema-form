import { mergeThemePresentation } from '../src/index.ts';

const EMPTY = { default: {}, widgets: {}, fields: {}, fieldDefault: {} };

const core = {
  widgets: {
    CheckboxWidget: { label: 'self', description: 'self' },
    RadioWidget: { labelledBy: 'aria-labelledby' },
  },
} as const;

describe('mergeThemePresentation()', () => {
  it('returns empty declarations when there is nothing to merge', () => {
    expect(mergeThemePresentation()).toStrictEqual(EMPTY);
    expect(mergeThemePresentation(undefined, {})).toStrictEqual(EMPTY);
  });

  it('merges each declaration part by part, later layers winning', () => {
    const fieldsCore = { ...core, fields: { ObjectField: { label: 'self', description: 'self' } } } as const;
    const theme = {
      widgets: { CheckboxWidget: { errors: 'self', description: 'template' } },
      fields: { ObjectField: { errors: 'self' } },
    } as const;
    expect(mergeThemePresentation(fieldsCore, undefined, theme)).toStrictEqual({
      default: {},
      widgets: {
        CheckboxWidget: { label: 'self', description: 'template', errors: 'self' },
        RadioWidget: { labelledBy: 'aria-labelledby' },
      },
      fields: { ObjectField: { label: 'self', description: 'self', errors: 'self' } },
      fieldDefault: {},
    });
  });

  it("layers a layer's default beneath its own entry for every key any layer declares", () => {
    const theme = {
      default: { label: 'self', errors: 'self' },
      widgets: { CheckboxWidget: { errors: 'template' }, MyWidget: { help: 'self' } },
    } as const;
    expect(mergeThemePresentation(core, theme)).toStrictEqual({
      default: { label: 'self', errors: 'self' },
      widgets: {
        CheckboxWidget: { label: 'self', description: 'self', errors: 'template' },
        RadioWidget: { label: 'self', errors: 'self', labelledBy: 'aria-labelledby' },
        MyWidget: { label: 'self', errors: 'self', help: 'self' },
      },
      fields: {},
      fieldDefault: {},
    });
  });

  it("overrides the parts it declares under a key a lower layer declares, keeping the lower layer's other parts", () => {
    const props = { default: { description: 'template' } } as const;
    expect(mergeThemePresentation(core, props)).toStrictEqual({
      default: { description: 'template' },
      widgets: {
        CheckboxWidget: { label: 'self', description: 'template' },
        RadioWidget: { description: 'template', labelledBy: 'aria-labelledby' },
      },
      fields: {},
      fieldDefault: {},
    });
  });

  it("keeps a lower layer's default beneath a key only a higher layer declares", () => {
    const theme = { default: { label: 'self' } } as const;
    const props = { widgets: { MyWidget: { errors: 'self' } } } as const;
    expect(mergeThemePresentation(theme, props).widgets).toStrictEqual({ MyWidget: { label: 'self', errors: 'self' } });
  });

  it('layers each fieldDefault over the ones beneath it, leaving the field entries as they are', () => {
    const core = {
      fields: { StringField: { label: 'widget' } },
      fieldDefault: { errors: 'self', help: 'self' },
    } as const;
    const theme = { fieldDefault: { description: 'template', help: undefined } } as const;
    const merged = mergeThemePresentation(core, theme, { fieldDefault: { errors: 'template' } });
    expect(merged.fieldDefault).toStrictEqual({ description: 'template', errors: 'template', help: 'self' });
    expect(merged.fields).toStrictEqual({ StringField: { label: 'widget' } });
  });

  it('leaves a part declared undefined to the layers beneath it', () => {
    const merged = mergeThemePresentation(
      { default: { errors: 'self' }, widgets: { TextWidget: { label: 'self' } } },
      { default: { label: undefined, errors: undefined } },
    );
    expect(merged.default).toStrictEqual({ errors: 'self' });
    expect(merged.widgets.TextWidget).toStrictEqual({ label: 'self', errors: 'self' });
  });
});
