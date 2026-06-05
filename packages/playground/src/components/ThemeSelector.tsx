import type { SyntheticEvent } from 'react';
import { useCallback } from 'react';
import type { IChangeEvent } from '@rjsf/core';
import Form from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

import type { SubthemesType } from './SubthemeSelector';

export interface ThemesType {
  theme: any;
  stylesheet: string;
  subthemes?: SubthemesType;
}

interface ThemeSelectorProps {
  theme: string;
  themes: Record<string, ThemesType>;
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
    <div role='presentation' onClick={cancelBubble}>
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
