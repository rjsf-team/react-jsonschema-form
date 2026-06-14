import type { ChangeEvent, PropsWithChildren } from 'react';
import { useCallback, useState } from 'react';
import type { FieldProps } from '@rjsf/utils';

const COLORS = ['red', 'green', 'blue'];

export default function SpecialInput({ id, fieldPathId, onChange, formData }: PropsWithChildren<FieldProps>) {
  const [text, setText] = useState<string>(formData || '');

  const inputBgColor = COLORS[text.length % COLORS.length];

  const handleOnChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      onChange(value, fieldPathId.path);
      setText(value);
    },
    [onChange, fieldPathId, setText],
  );

  return (
    <div className='SpecialInput'>
      <h3>Hey, I&apos;m a custom component</h3>
      <p>
        I&apos;m registered as <code>/schemas/specialString</code> and referenced in
        <code>Form</code>&apos;s <code>field</code> prop to use for this schema anywhere this schema <code>$id</code> is
        used.
      </p>
      <div className='row'>
        <div className='col-sm-6'>
          <label htmlFor={`${id}-special-input`}>SpecialInput</label>
          <input
            id={`${id}-special-input`}
            className='form-control'
            style={{ background: inputBgColor, color: 'white', fontSize: 14 }}
            value={text}
            onChange={handleOnChange}
          />
        </div>
      </div>
    </div>
  );
}
