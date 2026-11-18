import { getTestRegistry } from '@rjsf/core/testing';
import { render, screen } from '@testing-library/react';

import FieldErrorTemplate from '../src/FieldErrorTemplate/index.ts';

describe('FieldErrorTemplate', () => {
  it('drops an empty message, as core does', () => {
    render(<FieldErrorTemplate errors={['too short', '']} id='root' schema={{}} registry={getTestRegistry({})} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
