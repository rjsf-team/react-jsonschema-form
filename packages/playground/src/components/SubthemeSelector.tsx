import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

interface SubthemeTypes {
  stylesheet: string;
}

export interface SubthemesType {
  [subtheme: string]: SubthemeTypes;
}

interface SubthemeSelectorProps {
  subtheme: string;
  subthemes: SubthemesType;
  select: (subthemeName: string, subtheme: SubthemeTypes) => void;
}

export default function SubthemeSelector({ subtheme, subthemes, select }: SubthemeSelectorProps) {
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
}
