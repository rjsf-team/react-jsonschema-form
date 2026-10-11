import { mergeThemePresentation } from '../src/index.ts';

const STANDARD = ['CheckboxWidget', 'RadioWidget', 'TextWidget'];

describe('mergeThemePresentation()', () => {
  it('returns empty declarations when there is nothing to merge', () => {
    expect(mergeThemePresentation(STANDARD)).toEqual({ widgets: {}, fields: {} });
    expect(mergeThemePresentation(STANDARD, undefined, {})).toEqual({ widgets: {}, fields: {} });
  });

  it('merges each declaration part by part, later layers winning', () => {
    const core = {
      widgets: {
        CheckboxWidget: { label: 'self', description: 'self' },
        RadioWidget: { labelledBy: 'aria-labelledby' },
      },
      fields: { ObjectField: { label: 'self', description: 'self' } },
    } as const;
    const theme = {
      widgets: { CheckboxWidget: { errors: 'self', description: 'template' } },
      fields: { ObjectField: { errors: 'self' } },
    } as const;
    expect(mergeThemePresentation(STANDARD, core, undefined, theme)).toEqual({
      widgets: {
        CheckboxWidget: { label: 'self', description: 'template', errors: 'self' },
        RadioWidget: { labelledBy: 'aria-labelledby' },
      },
      fields: { ObjectField: { label: 'self', description: 'self', errors: 'self' } },
    });
  });

  it("expands a layer's standardWidgets into every standard key, beneath that layer's own entry", () => {
    const theme = {
      standardWidgets: { label: 'self', errors: 'self' },
      widgets: { CheckboxWidget: { errors: 'template' }, MyWidget: { help: 'self' } },
    } as const;
    expect(mergeThemePresentation(STANDARD, theme).widgets).toEqual({
      CheckboxWidget: { label: 'self', errors: 'template' },
      RadioWidget: { label: 'self', errors: 'self' },
      TextWidget: { label: 'self', errors: 'self' },
      MyWidget: { help: 'self' },
    });
  });

  it("overrides the parts it declares under a key a lower layer declares, keeping the lower layer's other parts", () => {
    const core = {
      widgets: {
        CheckboxWidget: { label: 'self', description: 'self' },
        RadioWidget: { labelledBy: 'aria-labelledby' },
      },
    } as const;
    const props = { standardWidgets: { description: 'template' } } as const;
    expect(mergeThemePresentation(STANDARD, core, props).widgets).toEqual({
      CheckboxWidget: { label: 'self', description: 'template' },
      RadioWidget: { description: 'template', labelledBy: 'aria-labelledby' },
      TextWidget: { description: 'template' },
    });
  });

  it('leaves a part declared undefined to the layers beneath it', () => {
    const merged = mergeThemePresentation(
      STANDARD,
      { widgets: { TextWidget: { label: 'self' } } },
      { standardWidgets: { label: undefined } },
    );
    expect(merged.widgets.TextWidget).toEqual({ label: 'self' });
  });
});
