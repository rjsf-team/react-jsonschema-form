import type { RJSFSchema } from '@rjsf/utils';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createFormComponent } from './testUtils.tsx';

const user = userEvent.setup();

describe('RatingWidget', () => {
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
