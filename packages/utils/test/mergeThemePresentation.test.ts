import { mergeThemePresentation } from '../src/index.ts';

describe('mergeThemePresentation()', () => {
  it('returns empty declarations when there is nothing to merge', () => {
    expect(mergeThemePresentation()).toEqual({ standardWidgets: {}, widgets: {}, fields: {} });
    expect(mergeThemePresentation(undefined, {})).toEqual({ standardWidgets: {}, widgets: {}, fields: {} });
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
      standardWidgets: { label: 'self' },
      widgets: { CheckboxWidget: { errors: 'self', description: 'template' } },
      fields: { ObjectField: { errors: 'self' } },
    } as const;
    expect(mergeThemePresentation(core, undefined, theme)).toEqual({
      standardWidgets: { label: 'self' },
      widgets: {
        CheckboxWidget: { label: 'self', description: 'template', errors: 'self' },
        RadioWidget: { labelledBy: 'aria-labelledby' },
      },
      fields: { ObjectField: { label: 'self', description: 'self', errors: 'self' } },
    });
  });

  it('leaves a part declared undefined to the layers beneath it', () => {
    expect(
      mergeThemePresentation({ standardWidgets: { label: 'self' } }, { standardWidgets: { label: undefined } }),
    ).toEqual({ standardWidgets: { label: 'self' }, widgets: {}, fields: {} });
  });
});
