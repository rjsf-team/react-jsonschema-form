import type { ThemeProps } from '@rjsf/core';
import type { RegistryWidgetsType, TemplatesType } from '@rjsf/utils';

export interface ThemeGenerators {
  generateTemplates: () => Partial<TemplatesType>;
  generateWidgets: () => RegistryWidgetsType;
  generateTheme: () => ThemeProps;
}

/** Recurses into every nested map, so a theme that adds one beside `ButtonTemplates`, or inside it, is covered without
 * this suite having to list it. Components, whether functions or `memo()`/`forwardRef()` objects marked by `$$typeof`,
 * have to be the same instance on every call, or every form using them would remount.
 */
function expectFreshMaps(first: object, second: object, key = 'result') {
  expect(first, key).not.toBe(second);
  for (const [childKey, value] of Object.entries(first)) {
    if (value !== null && typeof value === 'object') {
      const other = (second as Record<string, object>)[childKey];
      if ('$$typeof' in value) {
        expect(value, childKey).toBe(other);
      } else {
        expectFreshMaps(value, other, childKey);
      }
    } else if (typeof value === 'function') {
      expect(value, childKey).toBe((second as Record<string, unknown>)[childKey]);
    }
  }
}

/** Callers may mutate what a generator returns, so every call must build new maps, down to the nested ones,
 * rather than hand back the shared default `Templates`/`Widgets`/`Theme` exports.
 */
export function themeTests({ generateTemplates, generateWidgets, generateTheme }: ThemeGenerators) {
  describe('theme generators', () => {
    test('generateTemplates() returns fresh maps on every call', () => {
      expectFreshMaps(generateTemplates(), generateTemplates());
    });
    test('generateWidgets() returns a fresh map on every call', () => {
      expectFreshMaps(generateWidgets(), generateWidgets());
    });
    test('generateTheme() returns fresh maps on every call', () => {
      expectFreshMaps(generateTheme(), generateTheme());
    });
    // Freshness alone passes for a generator that returns `{}`. A theme may add aliases (daisyui's `boolean`), so its
    // maps only have to contain every generated key
    test('generateTemplates() and generateWidgets() return what generateTheme() is built from', () => {
      const templateKeys = Object.keys(generateTemplates());
      const widgetKeys = Object.keys(generateWidgets());
      const { templates = {}, widgets = {} } = generateTheme();
      expect(templateKeys).not.toHaveLength(0);
      expect(widgetKeys).not.toHaveLength(0);
      expect(Object.keys(templates)).toEqual(expect.arrayContaining(templateKeys));
      expect(Object.keys(widgets)).toEqual(expect.arrayContaining(widgetKeys));
    });
  });
}
