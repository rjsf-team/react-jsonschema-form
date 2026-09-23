import type { ThemeProps } from '@rjsf/core';
import type { RegistryWidgetsType, TemplatesType } from '@rjsf/utils';

export interface ThemeGenerators {
  generateTemplates: () => Partial<TemplatesType>;
  generateWidgets: () => RegistryWidgetsType;
  generateTheme: () => ThemeProps;
}

/** Callers may mutate what a generator returns, so every call must build new maps, down to the nested
 * `ButtonTemplates`, rather than hand back the shared default `Templates`/`Widgets`/`Theme` exports.
 */
export function themeTests({ generateTemplates, generateWidgets, generateTheme }: ThemeGenerators) {
  describe('theme generators', () => {
    test('generateTemplates() returns fresh maps on every call', () => {
      expect(generateTemplates()).not.toBe(generateTemplates());
      expect(generateTemplates().ButtonTemplates).not.toBe(generateTemplates().ButtonTemplates);
    });
    test('generateWidgets() returns a fresh map on every call', () => {
      expect(generateWidgets()).not.toBe(generateWidgets());
    });
    test('generateTheme() returns fresh maps on every call', () => {
      const first = generateTheme();
      const second = generateTheme();
      expect(first).not.toBe(second);
      expect(first.templates).not.toBe(second.templates);
      expect(first.templates?.ButtonTemplates).not.toBe(second.templates?.ButtonTemplates);
      expect(first.widgets).not.toBe(second.widgets);
    });
  });
}
