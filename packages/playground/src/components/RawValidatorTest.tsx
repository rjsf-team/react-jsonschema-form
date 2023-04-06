import { useState } from 'react';
import { ValidatorType, RJSFSchema } from '@rjsf/utils';

interface RawValidatorTestProps {
  validator: ValidatorType;
  schema: RJSFSchema;
  formData: object;
}

export default function RawValidatorTest({ validator, schema, formData }: RawValidatorTestProps) {
  const [rawValidation, setRawValidation] = useState<{ errors?: any[]; validationError?: Error } | undefined>();
  const handleClearClick = () => setRawValidation(undefined);
  const handleRawClick = () => setRawValidation(validator.rawValidation(schema, formData));

  let displayErrors = 'Validation not run';
  if (rawValidation) {
    displayErrors =
      rawValidation.errors || rawValidation.validationError
        ? JSON.stringify(rawValidation, null, 2)
        : 'No AJV errors encountered';
  }
  return (
    <div>
      <details style={{ marginBottom: '10px' }}>
        <summary style={{ display: 'list-item' }}>Raw Ajv Validation</summary>
        To determine whether a validation issue is really a BUG in Ajv use the button to trigger the raw Ajv validation.
        This will run your schema and formData through Ajv without involving any react-jsonschema-form specific code. If
        there is an unexpected error, then{' '}
        <a href='https://github.com/ajv-validator/ajv/issues/new/choose' target='_blank' rel='noreferrer'>
          file an issue
        </a>{' '}
        with Ajv instead.
      </details>
      <div style={{ marginBottom: '10px' }}>
        <button className='btn btn-default' type='button' onClick={handleRawClick}>
          Raw Validate
        </button>
        {rawValidation && (
          <>
            <span> </span>
            <button className='btn btn-default' type='button' onClick={handleClearClick}>
              Clear
            </button>
          </>
        )}
      </div>
      <textarea rows={4} readOnly disabled={!rawValidation} value={displayErrors} />
    </div>
  );
}
