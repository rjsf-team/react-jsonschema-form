import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { englishStringTranslator, TranslatableString } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

const schema: RJSFSchema = {
  type: 'object',
  properties: { when: { type: 'string', title: 'When', format: 'date' } },
};
const uiSchema: UiSchema = { when: { 'ui:widget': 'alt-date', 'ui:options': { yearsRange: [2020, 2024] } } };

/** The control each theme names is a `combobox`, except where it is a `button` opening a listbox. The field's title
 * and the part are joined by a comma in the name, other than in `@rjsf/mantine`, whose parts reference the title
 * element alongside their own `aria-label`
 */
function getPart(fieldLabel: string, part: string) {
  const name = new RegExp(`^${fieldLabel},? ${part}$`);
  return screen.queryByRole('combobox', { name }) ?? screen.getByRole('button', { name });
}

/** Pins the accessible name of each select an `AltDateWidget` renders, which no theme's `SelectWidget` receives as a
 * label, in every theme.
 *
 * These live in their own file rather than alongside `formTests()` because every render advances React's `useId`
 * counter for the rest of the module, so running them there would renumber the ids in that suite's snapshots across
 * all nine themes.
 *
 * @param Form - The theme's `Form` component
 */
export function altDateTests(Form: ComponentType<FormProps>) {
  describe('alt-date widget names', () => {
    test('names each part by the field title and the part', () => {
      render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      ['year', 'month', 'day'].forEach((part) => expect(getPart('When', part)).toBeInstanceOf(HTMLElement));
    });

    test('names each part through translateString', () => {
      const FRENCH: Partial<Record<TranslatableString, string>> = {
        [TranslatableString.YearLabel]: 'année',
        [TranslatableString.MonthLabel]: 'mois',
        [TranslatableString.DayLabel]: 'jour',
      };
      const translateString = (key: TranslatableString, params?: string[]) =>
        FRENCH[key] ?? englishStringTranslator(key, params);
      render(<Form schema={schema} uiSchema={uiSchema} validator={validator} translateString={translateString} />);
      Object.values(FRENCH).forEach((part) => expect(getPart('When', part)).toBeInstanceOf(HTMLElement));
    });
  });
}
