import { IChangeEvent, withTheme } from '@rjsf/core';
import { ValidatorType } from '@rjsf/utils';
import { FormEvent, useCallback, useEffect, useRef } from 'react';
import { Sample } from '../samples/Sample';
import Editors from './Editors';
import ErrorBoundary from './ErrorBoundary';
import Header, { LiveSettings } from './Header';
import { useHashLoad } from './hooks/useHashLoad';
import { usePlaygroundState } from './hooks/usePlaygroundState';
import { PlaygroundForm } from './PlaygroundForm';
import { ThemesType } from './ThemeSelector';

export interface PlaygroundProps {
  themes: { [themeName: string]: ThemesType };
  validators: { [validatorName: string]: ValidatorType };
}

export default function Playground({ themes, validators }: PlaygroundProps) {
  const {
    state,
    setFormData,
    setShareURL,
    setTheme,
    setSubtheme,
    setFormComponent,
    setStylesheet,
    setShowForm,
    setLiveSettings,
    setValidator,
    setOtherFormProps,
    setSchema,
    setUiSchema,
    setExtraErrors,
  } = usePlaygroundState();

  const playGroundFormRef = useRef<any>(null);

  const onThemeSelected = useCallback((theme: string, { stylesheet, theme: themeObj }: ThemesType) => {
    setTheme(theme);
    setSubtheme(null);
    setFormComponent(withTheme(themeObj));
    setStylesheet(stylesheet);
  }, []);

  const load = useCallback(
    (data: Sample & { theme: string; liveSettings: LiveSettings }) => {
      const {
        schema,
        uiSchema = {},
        templates = {},
        fields = {},
        formData,
        theme: dataTheme = state.theme,
        extraErrors,
        liveSettings,
        validator,
        ...rest
      } = data;

      const theTheme = dataTheme === 'material-ui-5' ? 'mui' : dataTheme;

      // Only update theme and subtheme if theme actually changed
      if (theTheme !== state.theme) {
        onThemeSelected(theTheme, themes[theTheme]);
        setSubtheme(null); // Only reset subtheme if theme changes
      }

      setShowForm(false);
      setSchema(schema);
      setUiSchema(uiSchema);
      setFormData(formData);
      setExtraErrors(extraErrors);
      setTheme(theTheme);
      setShowForm(true);
      setLiveSettings(liveSettings);
      if ('validator' in data) {
        setValidator(validator);
      }
      setOtherFormProps({ fields, templates, ...rest });
    },
    [state.theme, onThemeSelected, themes]
  );

  useHashLoad({ load, loaded: state.loaded });

  useEffect(() => {
    onThemeSelected(state.theme, themes[state.theme]);
    setShowForm(true);
  }, [onThemeSelected, state.theme, themes]);

  const handleFormChange = useCallback(({ formData }: IChangeEvent, id?: string) => {
    if (id) {
      console.log('Field changed, id: ', id);
    }
    setFormData(formData);
    setShareURL(null);
  }, []);

  const handleFormSubmit = useCallback(({ formData }: IChangeEvent, event: FormEvent<any>) => {
    console.log('submitted formData', formData);
    console.log('submit event', event);
    window.alert('Form submitted');
  }, []);

  return (
    <>
      <Header
        {...state}
        themes={themes}
        validators={validators}
        playGroundFormRef={playGroundFormRef}
        load={load}
        onThemeSelected={onThemeSelected}
        setSubtheme={setSubtheme}
        setStylesheet={setStylesheet}
        setValidator={setValidator}
        setLiveSettings={setLiveSettings}
        setShareURL={setShareURL}
      />
      <Editors
        {...state}
        setFormData={setFormData}
        setSchema={setSchema}
        setUiSchema={setUiSchema}
        setExtraErrors={setExtraErrors}
        setShareURL={setShareURL}
      />
      <div className='col-sm-5'>
        <ErrorBoundary>
          {state.showForm && (
            <PlaygroundForm
              {...state}
              playGroundFormRef={playGroundFormRef}
              validators={validators}
              onChange={handleFormChange}
              onSubmit={handleFormSubmit}
            />
          )}
        </ErrorBoundary>
      </div>
    </>
  );
}
