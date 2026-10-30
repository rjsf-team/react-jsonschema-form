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

  it('shows the default 5 stars for a `stars` option that is not a number, as a JSON uiSchema can hold', () => {
    createFormComponent({
      schema: { type: 'number' },
      // @ts-expect-error `stars` is a number, which the type can only ask of a uiSchema written in TypeScript
      uiSchema: { 'ui:widget': 'RatingWidget', 'ui:options': { stars: 'five' } },
    });

    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it.each([
    ['a `stars` option', { type: 'number' }, { stars: 2.5 }],
    ['a schema `maximum`', { type: 'number', maximum: 2.5 }, {}],
  ] as const)('rounds down %s that is not a whole number, rather than crashing the form', (_, schema, options) => {
    createFormComponent({ schema, uiSchema: { 'ui:widget': 'RatingWidget', 'ui:options': options } });

    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });
});
