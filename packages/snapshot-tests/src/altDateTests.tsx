import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { ErrorSchema, RJSFSchema, UiSchema } from '@rjsf/utils';
import { englishStringTranslator, errorId, TranslatableString } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

const DATE_PARTS = ['year', 'month', 'day'];
const TIME_PARTS = ['hour', 'minute', 'second'];

const when: RJSFSchema = { type: 'string', title: 'When', format: 'date' };
const at: RJSFSchema = { type: 'string', title: 'At', format: 'date-time' };
const bareSchema: RJSFSchema = { type: 'object', properties: { when, at } };
const bareUiSchema: UiSchema = {
  when: { 'ui:widget': 'alt-date', 'ui:options': { yearsRange: [2020, 2024] } },
  at: { 'ui:widget': 'alt-datetime', 'ui:options': { yearsRange: [2020, 2024] } },
};
const schema: RJSFSchema = {
  type: 'object',
  properties: {
    when: { ...when, description: 'The day it starts' },
    at: { ...at, description: 'The moment it ends' },
  },
};
const uiSchema: UiSchema = {
  when: { ...bareUiSchema.when, 'ui:help': 'Any day will do' },
  at: { ...bareUiSchema.at, 'ui:help': 'Any time will do' },
};
const extraErrors = { when: { __errors: ['Too early'] }, at: { __errors: ['Too late'] } } as ErrorSchema;

/** The control each theme names is a `combobox`, except where it is a `button` opening a listbox. The name is matched
 * exactly, so a translation containing characters a pattern would treat specially is compared as written
 */
function getPart(name: string) {
  return screen.queryByRole('combobox', { name }) ?? screen.getByRole('button', { name });
}

/** Pins the accessible name and description of each select an `AltDateWidget` renders, which no theme's `SelectWidget`
 * receives as a label, and that its Now and Clear buttons are disabled while the form is disabled or read-only and
 * hidden by `hideNowButton` and `hideClearButton`, in every theme.
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
      DATE_PARTS.forEach((part) => expect(getPart(`When, ${part}`)).toBeInstanceOf(HTMLElement));
      [...DATE_PARTS, ...TIME_PARTS].forEach((part) => expect(getPart(`At, ${part}`)).toBeInstanceOf(HTMLElement));
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

    describe("describes each part by its field's description, help and errors", () => {
      const fields: [string, string[], string[]][] = [
        ['When', DATE_PARTS, ['The day it starts', 'Any day will do', 'Too early']],
        ['At', [...DATE_PARTS, ...TIME_PARTS], ['The moment it ends', 'Any time will do', 'Too late']],
      ];
      const cases = fields.flatMap(([label, parts, texts]) =>
        parts.flatMap((part) => texts.map((text) => [`${label}, ${part}`, text])),
      );

      // The announced description is asserted, rather than the text of the elements `aria-describedby` lists, which
      // one hidden from a screen reader would still supply
      test.each(cases)('%s is described by "%s"', (name, text) => {
        render(<Form schema={schema} uiSchema={uiSchema} validator={validator} extraErrors={extraErrors} />);
        expect(getPart(name)).toHaveAccessibleDescription(expect.stringContaining(text));
      });

      test('a part is described by no id that names no element, which another field could come to claim', () => {
        render(<Form schema={schema} uiSchema={uiSchema} validator={validator} extraErrors={extraErrors} />);
        const ids = (getPart('When, year').getAttribute('aria-describedby') ?? '').split(' ');
        expect(ids.filter((id) => !document.getElementById(id))).toEqual([]);
      });
    });

    // With no description or help, a part described by `ariaDescribedByIds()` rather than its field's plan still
    // announces the error, so only the exact ids and `aria-invalid` tell the plan's describers from that fallback's
    describe('with no description or help', () => {
      const fields: [string, string, string[], string][] = [
        ['When', 'root_when', DATE_PARTS, 'Too early'],
        ['At', 'root_at', [...DATE_PARTS, ...TIME_PARTS], 'Too late'],
      ];

      // The `for` check is scoped to the fields' ids, since a theme's own components may draw a hidden label of their
      // own whose `for` isn't the form's to keep
      test("draws no label whose for names the field's id, which no date part carries", () => {
        const { container } = render(<Form schema={bareSchema} uiSchema={bareUiSchema} validator={validator} />);
        fields.forEach(([label, id]) => {
          const drawn = screen.getByText(label).closest('label');
          expect(drawn).toBeInstanceOf(HTMLLabelElement);
          expect(drawn).not.toHaveAttribute('for');
          expect(document.querySelector(`label[for="${id}"]`)).toBeNull();
        });
        const labelledBy = [...container.querySelectorAll('[aria-labelledby]')].flatMap((element) =>
          (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean),
        );
        expect(labelledBy.filter((id) => !document.getElementById(id))).toEqual([]);
      });

      test('describes each part by the error alone and marks it invalid while errors show', () => {
        render(<Form schema={bareSchema} uiSchema={bareUiSchema} validator={validator} extraErrors={extraErrors} />);
        fields.forEach(([label, id, parts, error]) =>
          parts.forEach((part) => {
            const element = getPart(`${label}, ${part}`);
            expect(element).toHaveAttribute('aria-describedby', errorId(id));
            expect(element).toHaveAccessibleDescription(error);
            expect(element).toHaveAttribute('aria-invalid', 'true');
          }),
        );
      });

      // chakra-ui marks a valid control `aria-invalid="false"`, which is as good as none
      test('describes no part and marks none invalid with nothing to show', () => {
        render(<Form schema={bareSchema} uiSchema={bareUiSchema} validator={validator} />);
        fields.forEach(([label, , parts]) =>
          parts.forEach((part) => {
            const element = getPart(`${label}, ${part}`);
            expect(element).not.toHaveAttribute('aria-describedby');
            expect(element).not.toHaveAttribute('aria-invalid', 'true');
          }),
        );
      });
    });
  });

  describe('alt-date Now and Clear buttons', () => {
    test('are enabled by default', () => {
      render(<Form schema={bareSchema} uiSchema={bareUiSchema} validator={validator} />);
      ['Now', 'Clear'].forEach((name) => {
        const buttons = screen.getAllByRole('button', { name });
        expect(buttons).toHaveLength(2);
        buttons.forEach((button) => expect(button).toBeEnabled());
      });
    });

    test.each(['disabled', 'readonly'])('are disabled when the form is %s', (flag) => {
      render(<Form schema={bareSchema} uiSchema={bareUiSchema} validator={validator} {...{ [flag]: true }} />);
      ['Now', 'Clear'].forEach((name) => {
        const buttons = screen.getAllByRole('button', { name });
        expect(buttons).toHaveLength(2);
        buttons.forEach((button) => expect(button).toBeDisabled());
      });
    });

    test.each([
      ['hideNowButton', 'Now', 'Clear'],
      ['hideClearButton', 'Clear', 'Now'],
    ])('%s hides the %s button where it is true, and not where it is false', (option, hidden, shown) => {
      const hiding: UiSchema = {
        when: { ...bareUiSchema.when, 'ui:options': { ...bareUiSchema.when['ui:options'], [option]: true } },
        at: { ...bareUiSchema.at, 'ui:options': { ...bareUiSchema.at['ui:options'], [option]: false } },
      };
      render(<Form schema={bareSchema} uiSchema={hiding} validator={validator} />);
      expect(screen.getAllByRole('button', { name: hidden })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: shown })).toHaveLength(2);
    });
  });
}
