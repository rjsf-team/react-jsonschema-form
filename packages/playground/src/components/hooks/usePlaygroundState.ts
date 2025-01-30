import { ComponentType } from 'react';
import { useState } from 'react';
import { FormProps, withTheme } from '@rjsf/core';
import { ErrorSchema, RJSFSchema, UiSchema } from '@rjsf/utils';
import { samples } from '../../samples';
import { LiveSettings } from '../Header';

export function usePlaygroundState() {
  const [loaded, setLoaded] = useState(false);
  const [schema, setSchema] = useState<RJSFSchema>(samples.Simple.schema as RJSFSchema);
  const [uiSchema, setUiSchema] = useState<UiSchema>(samples.Simple.uiSchema!);
  const [formData, setFormData] = useState<any>(samples.Simple.formData);
  const [extraErrors, setExtraErrors] = useState<ErrorSchema | undefined>();
  const [shareURL, setShareURL] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('daisy-ui');
  const [subtheme, setSubtheme] = useState<string | null>(null);
  const [stylesheet, setStylesheet] = useState<string | null>(null);
  const [validator, setValidator] = useState<string>('AJV8');
  const [showForm, setShowForm] = useState(false);
  const [liveSettings, setLiveSettings] = useState<LiveSettings>({
    showErrorList: 'top',
    validate: false,
    disabled: false,
    noHtml5Validate: false,
    readonly: false,
    omitExtraData: false,
    liveOmit: false,
    experimental_defaultFormStateBehavior: { arrayMinItems: 'populate', emptyObjectFields: 'populateAllDefaults' },
  });
  const [FormComponent, setFormComponent] = useState<ComponentType<FormProps>>(withTheme({}));
  const [otherFormProps, setOtherFormProps] = useState<Partial<FormProps>>({});

  return {
    state: {
      loaded,
      schema,
      uiSchema,
      formData,
      extraErrors,
      shareURL,
      theme,
      subtheme,
      stylesheet,
      validator,
      showForm,
      liveSettings,
      FormComponent,
      otherFormProps,
    },
    setLoaded,
    setSchema,
    setUiSchema,
    setFormData,
    setExtraErrors,
    setShareURL,
    setTheme,
    setSubtheme,
    setStylesheet,
    setValidator,
    setShowForm,
    setLiveSettings,
    setFormComponent,
    setOtherFormProps,
  };
}
