import { useState } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import type { ValidatorType, RJSFSchema } from '@rjsf/utils';

interface RawValidatorTestProps {
  validator: ValidatorType;
  schema: RJSFSchema;
  formData: unknown;
}

export default function RawValidatorTest({ validator, schema, formData }: RawValidatorTestProps) {
  const [rawValidation, setRawValidation] = useState<ReturnType<ValidatorType['rawValidation']>>();
  const handleClearClick = () => setRawValidation(undefined);
  const handleRawClick = () => setRawValidation(validator.rawValidation(schema, formData));

  let displayErrors = 'Validation not run';
  if (rawValidation) {
    displayErrors =
      rawValidation.errors || rawValidation.validationError
        ? JSON.stringify(
            rawValidation,
            (_, value: unknown) => {
              if (value instanceof Error) {
                return {
                  name: value.name,
                  message: value.message,
                  stack: value.stack,
                };
              }
              return value;
            },
            2,
          )
        : 'No errors encountered';
  }
  return (
    <div>
      <details style={{ marginBottom: '10px' }}>
        <summary style={{ display: 'list-item' }}>Raw Validation</summary>
        To determine whether a validation issue is really a BUG in the selected validator&apos;s library use the button
        to trigger its raw validation. This will run your schema and formData through that library without involving any
        react-jsonschema-form specific code. If there is an unexpected error, then file an issue with that library
        instead.
      </details>
      <ButtonGroup size='small' sx={{ mb: 1 }}>
        <Button onClick={handleRawClick}>Raw Validate</Button>
        {rawValidation && <Button onClick={handleClearClick}>Clear</Button>}
      </ButtonGroup>
      <textarea rows={4} readOnly disabled={!rawValidation} value={displayErrors} />
    </div>
  );
}
