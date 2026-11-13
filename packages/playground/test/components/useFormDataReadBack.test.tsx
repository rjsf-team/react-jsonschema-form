import { useState } from 'react';
import Form from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import useFormDataReadBack from '../../src/components/useFormDataReadBack.ts';

const user = userEvent.setup();

const withDefault: RJSFSchema = { type: 'object', properties: { name: { type: 'string', default: 'Chuck' } } };

function Playground({ ready, schema }: { ready: boolean; schema: RJSFSchema }) {
  const [formData, setFormData] = useState<unknown>({});
  const [editKey, setEditKey] = useState(0);
  const [readThroughRef, setReadThroughRef] = useState<unknown>();
  const { attachForm, formRef } = useFormDataReadBack(setFormData, schema, undefined, undefined);
  // An edit in the formData editor sets the data and remounts the form with it
  const clearInEditor = () => {
    setFormData({});
    setEditKey((key) => key + 1);
  };
  return (
    <>
      {ready && (
        <Form key={editKey} ref={attachForm} schema={schema} validator={validator} initialFormData={formData} />
      )}
      <button type='button' onClick={clearInEditor}>
        Clear in editor
      </button>
      <button type='button' onClick={() => setReadThroughRef(formRef.current?.getFormData())}>
        Read through ref
      </button>
      <output>{JSON.stringify(formData)}</output>
      <p>{JSON.stringify(readThroughRef)}</p>
    </>
  );
}

describe('useFormDataReadBack', () => {
  it('reads back the defaults of a form that mounts after the first commit, as one inside a frame does', () => {
    const { rerender } = render(<Playground ready={false} schema={withDefault} />);
    expect(screen.getByRole('status')).toHaveTextContent('{}');

    rerender(<Playground ready schema={withDefault} />);

    expect(screen.getByRole('status')).toHaveTextContent('{"name":"Chuck"}');
  });

  it('reads back the defaults a form remounted with edited data fills in', async () => {
    render(<Playground ready schema={withDefault} />);
    expect(screen.getByRole('status')).toHaveTextContent('{"name":"Chuck"}');

    await user.click(screen.getByRole('button', { name: 'Clear in editor' }));

    expect(screen.getByRole('status')).toHaveTextContent('{"name":"Chuck"}');
  });

  it('keeps the ref it returns pointing at the mounted form', async () => {
    render(<Playground ready schema={withDefault} />);

    await user.click(screen.getByRole('button', { name: 'Read through ref' }));

    expect(screen.getByText('{"name":"Chuck"}', { selector: 'p' })).toBeInTheDocument();
  });
});
