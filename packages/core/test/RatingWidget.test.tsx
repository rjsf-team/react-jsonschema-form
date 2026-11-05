import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createFormComponent } from './testUtils.tsx';

const user = userEvent.setup();

function renderRating(schema: RJSFSchema, uiSchema: UiSchema = {}, initialFormData?: number | null) {
  return createFormComponent({
    schema: { type: 'integer', ...schema },
    uiSchema: { 'ui:widget': 'RatingWidget', ...uiSchema },
    initialFormData,
  });
}

const star = (value: number) => screen.getByRole('radio', { name: `${value} star${value === 1 ? '' : 's'}` });

/** Presses `keys` and tells whether the widget prevented the browser's default for the last key pressed */
async function pressPrevented(keys: string) {
  let prevented: boolean | undefined;
  const listener = (event: KeyboardEvent) => {
    prevented = event.defaultPrevented;
  };
  document.addEventListener('keydown', listener);
  await user.keyboard(keys);
  document.removeEventListener('keydown', listener);
  return prevented;
}

describe('RatingWidget', () => {
  describe('star values', () => {
    it.each<[string, RJSFSchema, UiSchema, number[]]>([
      ['no bounds', {}, {}, [0, 1, 2, 3, 4]],
      ['a minimum alone', { minimum: 3 }, {}, [3, 4, 5, 6, 7]],
      ['a maximum alone, as a bound rather than a count', { maximum: 3 }, {}, [0, 1, 2, 3]],
      ['both bounds, stopping at the maximum', { minimum: 3, maximum: 5 }, {}, [3, 4, 5]],
      ['a range wider than five stars', { minimum: 1, maximum: 10 }, {}, [1, 2, 3, 4, 5]],
      ['a maximum of 0', { maximum: 0 }, {}, [0]],
      ['a maximum below the first star', { maximum: -1 }, {}, [0]],
      ['a maximum below the minimum', { minimum: 3, maximum: 1 }, {}, [3]],
      ['a fractional maximum', { type: 'number', maximum: 2.5 }, {}, [0, 1, 2]],
      ['fractional bounds a whole step apart', { type: 'number', minimum: 1.3, maximum: 2.3 }, {}, [1.3, 2.3]],
      ['a fractional minimum', { type: 'number', minimum: 0.57, maximum: 2.57 }, {}, [0.57, 1.57, 2.57]],
      ['a stars option beside the bounds', { minimum: 1, maximum: 5 }, { 'ui:options': { stars: 3 } }, [1, 2, 3]],
      ['a stars option above five', {}, { 'ui:options': { stars: 9 } }, [0, 1, 2, 3, 4]],
      ['a stars option below one', {}, { 'ui:options': { stars: 0 } }, [0]],
      ['a fractional stars option', {}, { 'ui:options': { stars: 2.5 } }, [0, 1]],
    ])('draws the right stars for %s', (_, schema, uiSchema, values) => {
      renderRating(schema, uiSchema);

      expect(screen.getAllByRole('radio').map((radio) => Number(radio.dataset.value))).toEqual(values);
    });
  });

  describe('filled stars', () => {
    it('fills no star for a null value', () => {
      renderRating({ type: ['integer', 'null'], minimum: 0, maximum: 2 }, {}, null);

      expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['☆', '☆', '☆']);
    });
  });

  describe('native submit', () => {
    it('posts a rating of 0 as 0', () => {
      const { node } = renderRating({ minimum: 0, maximum: 5 }, {}, 0);

      expect(new FormData(node as HTMLFormElement).get('root')).toBe('0');
    });

    it('posts an empty value for no rating', () => {
      const { node } = renderRating({ minimum: 0, maximum: 5 });

      expect(new FormData(node as HTMLFormElement).get('root')).toBe('');
    });
  });

  describe('tab order', () => {
    it.each<[string, number | undefined, number]>([
      ['its checked star', 2, 2],
      ['its first star where none is checked', undefined, 1],
      ['its first star where its value matches no star', 9, 1],
    ])('is one tab stop, on %s', async (_, value, stop) => {
      renderRating({ minimum: 1, maximum: 5 }, {}, value);

      await user.tab();
      expect(star(stop)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
    });

    it.each(['ui:readonly', 'ui:disabled'])('has no tab stop under %s', (key) => {
      renderRating({ minimum: 1, maximum: 5 }, { [key]: true }, 2);

      screen.getAllByRole('radio').forEach((radio) => expect(radio).toHaveAttribute('tabindex', '-1'));
    });

    it.each([
      ['ui:readonly', 'aria-readonly'],
      ['ui:disabled', 'aria-disabled'],
    ])('tells assistive technology of %s through %s', (key, attribute) => {
      renderRating({ minimum: 1, maximum: 5 }, { [key]: true }, 2);

      expect(screen.getByRole('radiogroup')).toHaveAttribute(attribute, 'true');
    });
  });

  describe('keyboard', () => {
    it.each<[string, number, number]>([
      ['{ArrowRight}', 2, 3],
      ['{ArrowDown}', 2, 3],
      ['{ArrowLeft}', 2, 1],
      ['{ArrowUp}', 2, 1],
      ['{ArrowRight}', 5, 1],
      ['{ArrowDown}', 5, 1],
      ['{ArrowLeft}', 1, 5],
      ['{ArrowUp}', 1, 5],
    ])('%s on star %i moves to and checks star %i', async (key, from, to) => {
      renderRating({ minimum: 1, maximum: 5 }, {}, from);

      await user.tab();
      await user.keyboard(key);

      expect(star(to)).toHaveFocus();
      expect(star(to)).toHaveAttribute('aria-checked', 'true');
      expect(star(to)).toHaveAttribute('tabindex', '0');
      expect(star(from)).toHaveAttribute('aria-checked', 'false');
      expect(star(from)).toHaveAttribute('tabindex', '-1');
    });

    it('wraps to the first star under a fractional maximum', async () => {
      renderRating({ type: 'number', maximum: 2.5 }, {}, 2);

      await user.tab();
      await user.keyboard('{ArrowRight}');

      expect(star(0)).toHaveFocus();
      expect(star(0)).toHaveAttribute('aria-checked', 'true');
    });

    it('moves to the next star from the first where none is checked', async () => {
      renderRating({ minimum: 1, maximum: 5 });

      await user.tab();
      await user.keyboard('{ArrowRight}');

      expect(star(2)).toHaveFocus();
      expect(star(2)).toHaveAttribute('aria-checked', 'true');
    });

    it.each(['{Enter}', ' '])('%j checks the focused star', async (key) => {
      renderRating({ minimum: 1, maximum: 5 });

      await user.tab();
      await user.keyboard(key);

      expect(star(1)).toHaveFocus();
      expect(star(1)).toHaveAttribute('aria-checked', 'true');
    });

    it.each<[string, string]>([
      ['ui:readonly', '{ArrowRight}'],
      ['ui:disabled', '{ArrowLeft}'],
      ['ui:readonly', ' '],
      ['ui:disabled', '{Enter}'],
    ])('under %s, %s changes nothing and leaves the key to the browser', async (uiKey, key) => {
      renderRating({ minimum: 1, maximum: 5 }, { [uiKey]: true }, 2);

      await user.click(star(3));
      expect(star(3)).toHaveFocus();
      const prevented = await pressPrevented(key);

      expect(star(3)).toHaveFocus();
      expect(star(2)).toHaveAttribute('aria-checked', 'true');
      expect(star(3)).toHaveAttribute('aria-checked', 'false');
      expect(prevented).toBe(false);
    });

    it.each(['{ArrowRight}', '{ArrowDown}', '{ArrowLeft}', '{ArrowUp}', ' '])(
      'stops %j scrolling the page',
      async (key) => {
        renderRating({ minimum: 1, maximum: 5 }, {}, 2);

        await user.tab();

        expect(await pressPrevented(key)).toBe(true);
      },
    );

    it.each(['{Alt>}{ArrowLeft}{/Alt}', '{Control>}{ArrowLeft}{/Control}', '{Meta>}{ArrowLeft}{/Meta}', 'a'])(
      'leaves %s to the browser',
      async (keys) => {
        renderRating({ minimum: 1, maximum: 5 }, {}, 2);

        await user.tab();
        const prevented = await pressPrevented(keys);

        expect(star(2)).toHaveFocus();
        expect(star(2)).toHaveAttribute('aria-checked', 'true');
        expect(prevented).toBe(false);
      },
    );
  });
});

describe('RatingWidget numeric strings', () => {
  it.each([
    { caseName: 'a numeric string', formData: '3' },
    { caseName: 'nothing yet', formData: undefined },
  ])('writes a string to a string field holding $caseName', async ({ formData }) => {
    const { getFormData } = createFormComponent({
      schema: { type: 'string' },
      uiSchema: { 'ui:widget': 'RatingWidget' },
      initialFormData: formData,
    });

    await user.click(screen.getAllByRole('radio')[4]);

    expect(getFormData()).toBe('4');
  });

  it('writes a number to a field whose type allows a string too', async () => {
    const { getFormData } = createFormComponent({
      schema: { type: ['integer', 'string'] },
      uiSchema: { 'ui:widget': 'RatingWidget' },
      initialFormData: 3,
    });

    await user.click(screen.getAllByRole('radio')[4]);

    expect(getFormData()).toBe(4);
  });

  it.each([
    { caseName: 'an integer field holding a numeric string', schema: { type: 'integer' }, formData: '3', expected: 4 },
    {
      caseName: 'a string or null field holding null',
      schema: { type: ['string', 'null'] },
      formData: null,
      expected: '4',
    },
    {
      caseName: 'a field with no type holding a numeric string',
      schema: { enum: ['0', '1', '2', '3', '4'] },
      formData: '3',
      expected: '4',
    },
    {
      caseName: 'a field with no type holding a number',
      schema: { enum: [0, 1, 2, 3, 4] },
      formData: 3,
      expected: 4,
    },
  ] satisfies { caseName: string; schema: RJSFSchema; formData: unknown; expected: unknown }[])(
    'writes what the schema holds for $caseName',
    async ({ schema, formData, expected }) => {
      const { getFormData } = createFormComponent({
        schema,
        uiSchema: { 'ui:widget': 'RatingWidget' },
        initialFormData: formData,
      });

      await user.click(screen.getAllByRole('radio')[4]);

      expect(getFormData()).toBe(expected);
    },
  );

  it('fills and checks the stars of a rating stored as a numeric string, as it does a number', () => {
    createFormComponent({
      schema: { type: 'string' },
      uiSchema: { 'ui:widget': 'RatingWidget' },
      initialFormData: '3',
    });

    // The stars start at the schema's `minimum`, 0 here, so a rating of 3 fills the first four
    expect(screen.getAllByRole('radio').map((star) => star.textContent)).toEqual(['★', '★', '★', '★', '☆']);
    expect(screen.getByRole('radio', { name: '3 stars' })).toBeChecked();
  });
});
