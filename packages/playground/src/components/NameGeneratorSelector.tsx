import { useCallback } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

interface NameGeneratorSelectorProps {
  nameGenerator: string | null;
  select: (nameGenerator: string | null) => void;
}

export default function NameGeneratorSelector({ nameGenerator, select }: NameGeneratorSelectorProps) {
  const schema: RJSFSchema = {
    type: 'string',
    title: 'Name Generator',
    oneOf: [
      { const: '', title: 'None' },
      { const: 'bracket', title: 'Bracket (root[field][0])' },
      { const: 'dotnotation', title: 'Dot Notation (root.field.0)' },
    ],
  };

  const uiSchema: UiSchema = {
    'ui:placeholder': 'Select name generator',
  };

  const onChange = useCallback(
    ({ formData }: IChangeEvent) => {
      select(formData === '' ? null : formData);
    },
    [select],
  );

  return (
    <Form
      className='form_rjsf_nameGeneratorSelector'
      idPrefix='rjsf_nameGeneratorSelector'
      schema={schema}
      uiSchema={uiSchema}
      formData={nameGenerator || ''}
      validator={localValidator}
      onChange={onChange}
    >
      <div />
    </Form>
  );
}
