import type { WidgetProps } from '@rjsf/utils';

import { cleanupOptions } from '../src/utils.tsx';

describe('cleanupOptions()', () => {
  it('removes autocapitalize from Mantine theme props', () => {
    expect(cleanupOptions({ autocapitalize: 'words', radius: 'md' })).toEqual({ radius: 'md' });
  });

  it('removes the itemLabel array option', () => {
    expect(cleanupOptions({ itemLabel: 'name', radius: 'md' })).toEqual({ radius: 'md' });
  });

  it.each(['initialValue', 'placeholder', 'required', 'rows', 'enumOptions'])('removes the %s option', (name) => {
    expect(cleanupOptions({ [name]: 'value', radius: 'md' })).toEqual({ radius: 'md' });
  });

  it.each(['MarkdownTemplate', 'GridTemplate', 'FieldTemplate', 'ButtonTemplates'])(
    'removes a per-field %s override',
    (name) => {
      expect(cleanupOptions({ [name]: () => null, radius: 'md' })).toEqual({ radius: 'md' });
    },
  );

  it.each(['definitions', 'fieldReplacesAnyOrOneOf', 'globalOptions'])(
    'removes %s, which the ui: key of the same name gives a field',
    (name) => {
      expect(cleanupOptions({ [name]: {}, radius: 'md' })).toEqual({ radius: 'md' });
    },
  );

  it.each(['accept', 'expandable', 'format', 'hideClearButton', 'hideNowButton', 'shape', 'stars', 'yearsRange'])(
    'removes %s, an option rjsf reads that no type declares',
    (name) => {
      expect(cleanupOptions({ [name]: 'value', radius: 'md' })).toEqual({ radius: 'md' });
    },
  );

  it.each([
    ['a set', new Set(['min'])],
    ['an array', ['min']],
  ])('also removes the extra keys it is given as %s', (_, extraKeys) => {
    expect(cleanupOptions({ min: 1, radius: 'md' }, extraKeys)).toEqual({ radius: 'md' });
  });

  it("types the result without the options it strips, even with the index signature of a widget's options", () => {
    const options: WidgetProps['options'] = { rows: 4 };
    expectTypeOf(cleanupOptions(options)).not.toHaveProperty('rows');
    expectTypeOf(cleanupOptions({ rows: 4, radius: 'md' as const })).toEqualTypeOf<{ radius: 'md' }>();
  });
});
