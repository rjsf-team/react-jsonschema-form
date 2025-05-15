import { ChangeEvent, PropsWithChildren, useCallback, useState } from 'react';
import { FieldProps } from '@rjsf/utils';

const COLORS = ['red', 'green', 'blue'];

export default function SpecialInput({ onChange, formData }: PropsWithChildren<FieldProps>) {
  const [text, setText] = useState<string>(formData || '');

  const inputBgColor = COLORS[text.length % COLORS.length];

  const handleOnChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      onChange(value);
      setText(value);
    },
    [onChange, setText],
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
          <label>SpecialInput</label>
          <input
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
