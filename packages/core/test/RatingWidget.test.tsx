import { screen } from '@testing-library/react';

import { createFormComponent } from './testUtils.tsx';

describe('RatingWidget', () => {
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
