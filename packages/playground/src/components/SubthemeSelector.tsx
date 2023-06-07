import { useCallback, useMemo } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

const uiSchema: UiSchema = {
  'ui:placeholder': 'Select subtheme',
};

interface SubthemeType {
  stylesheet: string;
}

export interface SubthemesType {
  [subtheme: string]: SubthemeType;
}

interface SubthemeSelectorProps {
  subtheme: string | null;
  subthemes: SubthemesType;
  select: (subthemeName: string, subtheme: SubthemeType) => void;
}

export default function SubthemeSelector({ subtheme, subthemes, select }: SubthemeSelectorProps) {
  const schema: RJSFSchema = useMemo(
    () => ({
      type: 'string',
      title: 'Subtheme',
      enum: Object.keys(subthemes),
    }),
    [subthemes]
  );

  const handleChange = useCallback(
    ({ formData }: IChangeEvent) => {
      if (!formData) {
        return;
      }

      return select(formData, subthemes[formData]);
    },
    [select, subthemes]
  );

  return (
    <Form
      className='form_rjsf_subthemeSelector'
      idPrefix='rjsf_subthemeSelector'
      schema={schema}
      uiSchema={uiSchema}
      formData={subtheme}
      validator={localValidator}
      onChange={handleChange}
    >
      <div />
    </Form>
  );
}
