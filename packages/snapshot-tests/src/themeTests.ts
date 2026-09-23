import type { ThemeProps } from '@rjsf/core';
import type { RegistryWidgetsType, TemplatesType } from '@rjsf/utils';

export interface ThemeGenerators {
  generateTemplates: () => Partial<TemplatesType>;
  generateWidgets: () => RegistryWidgetsType;
  generateTheme: () => ThemeProps;
}

/** Checks every nested map structurally, so a theme that adds another nested map beside `ButtonTemplates` is covered
 * without this suite having to list it. `memo()`/`forwardRef()` components are objects too, marked by `$$typeof`.
 */
function expectFreshMaps(first: object | undefined, second: object | undefined) {
  if (first === undefined && second === undefined) {
    return;
  }
  expect(first).not.toBe(second);
  for (const [key, value] of Object.entries(first ?? {})) {
    if (value !== null && typeof value === 'object' && !('$$typeof' in value)) {
      expect(value, key).not.toBe((second as Record<string, unknown>)[key]);
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
      const first = generateTheme();
      const second = generateTheme();
      expectFreshMaps(first, second);
      expectFreshMaps(first.templates, second.templates);
      expectFreshMaps(first.widgets, second.widgets);
      expectFreshMaps(first.fields, second.fields);
    });
  });
}
