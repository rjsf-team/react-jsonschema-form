import { memo } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

const ValidatorSelector: React.FC<{ validator: string; validators: any; select: (validator: any) => void }> = memo(
  ({ validator, validators, select }) => {
    const schema: RJSFSchema = {
      type: 'string',
      enum: Object.keys(validators),
    };

    const uiSchema: UiSchema = {
      'ui:placeholder': 'Select validator',
    };

    return (
      <Form
        className='form_rjsf_validatorSelector'
        idPrefix='rjsf_validatorSelector'
        schema={schema}
        uiSchema={uiSchema}
        formData={validator}
        validator={localValidator}
        onChange={({ formData }: IChangeEvent) => formData && select(formData)}
      >
        <div />
      </Form>
    );
  }
);

export default ValidatorSelector;
