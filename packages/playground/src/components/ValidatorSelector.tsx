import { useCallback } from 'react';
import type { IChangeEvent } from '@rjsf/core';
import Form from '@rjsf/core';
import type { RJSFSchema, UiSchema, ValidatorType } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

interface ValidatorSelectorProps {
  validator: string;
  validators: Record<string, ValidatorType>;
  select: (validator: string) => void;
}

export default function ValidatorSelector({ validator, validators, select }: ValidatorSelectorProps) {
  const schema: RJSFSchema = {
    type: 'string',
    title: 'Validator',
    enum: Object.keys(validators),
  };

  const uiSchema: UiSchema = {
    'ui:placeholder': 'Select validator',
  };

  const onChange = useCallback(
    ({ formData }: IChangeEvent) => {
      if (formData) {
        select(formData);
      }
    },
    [select],
  );

  return (
    <Form
      className='form_rjsf_validatorSelector'
      idPrefix='rjsf_validatorSelector'
      schema={schema}
      uiSchema={uiSchema}
      formData={validator}
      validator={localValidator}
      onChange={onChange}
    >
      <div />
    </Form>
  );
}
