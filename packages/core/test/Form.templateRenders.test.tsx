import type { RJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createFormComponent } from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    a: { type: 'string', title: 'A' },
  },
};

describe('Form template renders', () => {
  it('does not render the submit button template again for a keystroke', async () => {
    const SubmitButton = vi.fn((_props: SubmitButtonProps) => <button type='submit'>Submit</button>);
    createFormComponent({ schema, templates: { ButtonTemplates: { SubmitButton } } });
    expect(SubmitButton).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText('A'), 'abc');

    expect(screen.getByLabelText('A')).toHaveValue('abc');
    expect(SubmitButton).toHaveBeenCalledTimes(1);
  });
});
