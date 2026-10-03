import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { ErrorSchema, RJSFSchema, UiSchema } from '@rjsf/utils';
import { englishStringTranslator, TranslatableString } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

const DATE_PARTS = ['year', 'month', 'day'];
const TIME_PARTS = ['hour', 'minute', 'second'];

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    when: { type: 'string', title: 'When', format: 'date', description: 'The day it starts' },
    at: { type: 'string', title: 'At', format: 'date-time' },
  },
};
const uiSchema: UiSchema = {
  when: { 'ui:widget': 'alt-date', 'ui:options': { yearsRange: [2020, 2024] } },
  at: { 'ui:widget': 'alt-datetime', 'ui:options': { yearsRange: [2020, 2024] } },
};

/** The control each theme names is a `combobox`, except where it is a `button` opening a listbox. The name is matched
 * exactly, so a translation containing characters a pattern would treat specially is compared as written
 */
function getPart(name: string) {
  return screen.queryByRole('combobox', { name }) ?? screen.getByRole('button', { name });
}

/** Pins the accessible name and description of each select an `AltDateWidget` renders, which no theme's `SelectWidget`
 * receives as a label, in every theme.
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
      DATE_PARTS.forEach((part) => expect(getPart(`When, ${part}`)).toBeInstanceOf(HTMLElement));
      [...DATE_PARTS, ...TIME_PARTS].forEach((part) => expect(getPart(`At, ${part}`)).toBeInstanceOf(HTMLElement));
    });

    test('keeps the field title in the name when the label is hidden', () => {
      const hidden: UiSchema = {
        when: { ...uiSchema.when, 'ui:label': false },
        at: { ...uiSchema.at, 'ui:label': false },
      };
      render(<Form schema={schema} uiSchema={hidden} validator={validator} />);
      DATE_PARTS.forEach((part) => {
        expect(getPart(`When, ${part}`)).toBeInstanceOf(HTMLElement);
        expect(getPart(`At, ${part}`)).toBeInstanceOf(HTMLElement);
      });
    });

    test('names each part through translateString, separator included', () => {
      const FRENCH: Partial<Record<TranslatableString, string>> = {
        [TranslatableString.YearLabel]: 'année (a)',
        [TranslatableString.MonthLabel]: 'mois',
        [TranslatableString.DayLabel]: 'jour',
        [TranslatableString.HourLabel]: 'heure',
        [TranslatableString.MinuteLabel]: 'minute',
        [TranslatableString.SecondLabel]: 'seconde',
        [TranslatableString.DateElementAriaLabel]: '%2 de %1',
      };
      const translateString = (key: TranslatableString, params?: string[]) =>
        englishStringTranslator((FRENCH[key] ?? key) as TranslatableString, params);
      render(<Form schema={schema} uiSchema={uiSchema} validator={validator} translateString={translateString} />);
      ['année (a)', 'mois', 'jour'].forEach((part) => expect(getPart(`${part} de When`)).toBeInstanceOf(HTMLElement));
      ['heure', 'minute', 'seconde'].forEach((part) => expect(getPart(`${part} de At`)).toBeInstanceOf(HTMLElement));
    });

    test("describes each part by the field's description and errors", () => {
      const extraErrors = { when: { __errors: ['Too early'] } } as ErrorSchema;
      render(<Form schema={schema} uiSchema={uiSchema} validator={validator} extraErrors={extraErrors} />);
      DATE_PARTS.forEach((part) => {
        const description = getPart(`When, ${part}`).getAttribute('aria-describedby') ?? '';
        const text = description
          .split(' ')
          .map((id) => document.getElementById(id)?.textContent ?? '')
          .join(' ');
        expect(text).toContain('The day it starts');
        expect(text).toContain('Too early');
      });
    });
  });
}
