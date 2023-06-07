import Form, { IChangeEvent } from '@rjsf/core';
import { GenericObjectType, RJSFSchema, UiSchema } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

interface ValidatorSelectorProps {
  validator: string;
  validators: GenericObjectType;
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
