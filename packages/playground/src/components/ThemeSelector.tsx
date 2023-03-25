import { memo } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

const ThemeSelector: React.FC<{ theme: any; themes: any; select: (...args: any[]) => void }> = memo(
  ({ theme, themes, select }) => {
    const schema: RJSFSchema = {
      type: 'string',
      enum: Object.keys(themes),
    };

    const uiSchema: UiSchema = {
      'ui:placeholder': 'Select theme',
    };

    return (
      <Form
        className='form_rjsf_themeSelector'
        idPrefix='rjsf_themeSelector'
        schema={schema}
        uiSchema={uiSchema}
        formData={theme}
        validator={localValidator}
        onChange={({ formData }: IChangeEvent) => formData && select(formData, themes[formData])}
      >
        <div />
      </Form>
    );
  }
);

export default ThemeSelector;
