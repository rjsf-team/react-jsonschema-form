import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render, screen } from '@testing-library/react';

import Form from './WrappedForm.tsx';

const FILE_STR = 'data:text/plain;name=file1.txt;base64,';
const uiSchema: UiSchema = { 'ui:options': { clearable: true, clearButtonProps: { 'aria-label': 'Clear' } } };

describe('FileWidget', () => {
  test('clearing a single file input reports an undefined value', () => {
    const schema: RJSFSchema = { type: 'string', format: 'data-url' };
    const onChange = vi.fn();
    render(<Form schema={schema} uiSchema={uiSchema} formData={FILE_STR} validator={validator} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Clear'));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: undefined }), 'root');
  });

  test('clearing a multiple file input reports an empty list', () => {
    const schema: RJSFSchema = { type: 'array', items: { type: 'string', format: 'data-url' } };
    const onChange = vi.fn();
    render(
      <Form schema={schema} uiSchema={uiSchema} formData={[FILE_STR]} validator={validator} onChange={onChange} />,
    );

    fireEvent.click(screen.getByLabelText('Clear'));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: [] }), 'root');
  });
});
