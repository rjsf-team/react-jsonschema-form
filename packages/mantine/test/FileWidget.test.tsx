import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from './WrappedForm.tsx';

const user = userEvent.setup();

const FILE_STR = 'data:text/plain;name=file1.txt;base64,';
const uiSchema: UiSchema = { 'ui:options': { clearable: true, clearButtonProps: { 'aria-label': 'Clear' } } };

describe('FileWidget', () => {
  test('an empty single file input shows its placeholder and no clear button', () => {
    const schema: RJSFSchema = { type: 'string', format: 'data-url' };
    render(
      <Form schema={schema} uiSchema={{ ...uiSchema, 'ui:placeholder': 'Choose a file' }} validator={validator} />,
    );

    expect(screen.getByText('Choose a file')).toBeInTheDocument();
    expect(screen.queryByLabelText('Clear')).toBeNull();
  });

  test('clearing a single file input reports an undefined value', async () => {
    const schema: RJSFSchema = { type: 'string', format: 'data-url' };
    const onChange = vi.fn();
    render(<Form schema={schema} uiSchema={uiSchema} formData={FILE_STR} validator={validator} onChange={onChange} />);

    await user.click(screen.getByLabelText('Clear'));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: undefined }), 'root');
  });

  test('clearing a multiple file input reports an empty list', async () => {
    const schema: RJSFSchema = { type: 'array', items: { type: 'string', format: 'data-url' } };
    const onChange = vi.fn();
    render(
      <Form schema={schema} uiSchema={uiSchema} formData={[FILE_STR]} validator={validator} onChange={onChange} />,
    );

    await user.click(screen.getByLabelText('Clear'));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: [] }), 'root');
  });
});
