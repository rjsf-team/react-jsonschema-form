import { FieldProps } from '@rjsf/utils';
import { FC, useState } from 'react';

const COLORS = ['red', 'green', 'blue'];

const SpecialInput: FC<FieldProps<string>> = ({ onChange, formData }) => {
  const [text, setText] = useState<string>(formData || '');

  const inputBgColor = COLORS[text.length % COLORS.length];

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
            onChange={({ target: { value } }) => {
              onChange(value);
              setText(value);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SpecialInput;
