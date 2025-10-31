import { SyntheticEvent, useCallback } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

import { SubthemesType } from './SubthemeSelector';

export interface ThemesType {
  theme: any;
  stylesheet: string;
  subthemes?: SubthemesType;
}

interface ThemeSelectorProps {
  theme: string;
  themes: { [themeName: string]: ThemesType };
  select: (themeName: string, theme: ThemesType) => void;
}

export default function ThemeSelector({ theme, themes, select }: ThemeSelectorProps) {
  const schema: RJSFSchema = {
    type: 'string',
    title: 'Theme',
    enum: Object.keys(themes),
  };

  const uiSchema: UiSchema = {
    'ui:placeholder': 'Select theme',
  };

  const onChange = useCallback(
    ({ formData }: IChangeEvent) => {
      if (formData) {
        select(formData, themes[formData]);
      }
    },
    [select, themes],
  );
  const cancelBubble = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div onClick={cancelBubble}>
      <Form
        className='form_rjsf_themeSelector'
        idPrefix='rjsf_themeSelector'
        schema={schema}
        uiSchema={uiSchema}
        formData={theme}
        validator={localValidator}
        onChange={onChange}
      >
        <div />
      </Form>
    </div>
  );
}
