import { memo } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
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

const SubthemeSelector: React.FC<Props> = memo(({ subtheme, subthemes, select }) => {
  const schema: RJSFSchema = {
    type: 'string',
    enum: Object.keys(subthemes),
  };

  const uiSchema: UiSchema = {
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
      onChange={({ formData }: IChangeEvent) => formData && select(formData, subthemes[formData])}
    >
      <div />
    </Form>
  );
});

export default SubthemeSelector;
