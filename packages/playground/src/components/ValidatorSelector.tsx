import Form from '@rjsf/core';
import localValidator from '@rjsf/validator-ajv8';

const ValidatorSelector: React.FC<{ validator: string; validators: any; select: (validator: any) => void }> = ({
  validator,
  validators,
  select,
}) => {
  const schema = {
    type: 'string',
    enum: Object.keys(validators),
  };

  const uiSchema = {
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
      onChange={({ formData }: { formData: any }) => formData && select(formData)}
    >
      <div />
    </Form>
  );
};

export default ValidatorSelector;
