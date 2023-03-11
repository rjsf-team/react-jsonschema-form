import Form from '@rjsf/core';
import localValidator from '@rjsf/validator-ajv8';

interface Props {
  subtheme: any;
  subthemes: any;
  select: (
    subtheme: any,
    {
      stylesheet,
    }: {
      stylesheet: any;
    }
  ) => void;
}

const SubthemeSelector: React.FC<Props> = ({ subtheme, subthemes, select }) => {
  const schema = {
    type: 'string',
    enum: Object.keys(subthemes),
  };

  const uiSchema = {
    'ui:placeholder': 'Select subtheme',
  };

  return (
    <Form
      className='form_rjsf_subthemeSelector'
      idPrefix='rjsf_subthemeSelector'
      schema={schema}
      uiSchema={uiSchema}
      formData={subtheme}
      validator={localValidator}
      onChange={({ formData }: { formData: any }) => formData && select(formData, subthemes[formData])}
    >
      <div />
    </Form>
  );
};

export default SubthemeSelector;
