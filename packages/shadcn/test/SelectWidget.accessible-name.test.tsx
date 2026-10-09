import { render, screen } from '@testing-library/react';

import validator from '../../validator-ajv8/src/index.ts';
import Form from '../src/index.ts';

const schema = {
  type: 'object' as const,
  properties: {
    colors: {
      type: 'array' as const,
      title: 'Colors',
      uniqueItems: true,
      items: { type: 'string' as const, enum: ['red', 'blue'] },
    },
  },
};

describe('multiple SelectWidget accessible name', () => {
  test('uses the field title', () => {
    render(<Form schema={schema} validator={validator} />);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Colors');
  });

  test('uses an overridden ui:title', () => {
    render(<Form schema={schema} uiSchema={{ colors: { 'ui:title': 'Favorite colors' } }} validator={validator} />);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Favorite colors');
  });
});
