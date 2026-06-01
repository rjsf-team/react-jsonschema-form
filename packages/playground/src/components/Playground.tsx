// oxlint-disable no-console
import type { ComponentType, FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import type { FormProps, IChangeEvent } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import type { ErrorSchema, RJSFSchema, RJSFValidationError, UiSchema, ValidatorType } from '@rjsf/utils';
import { isFunction } from 'lodash';

import { samples } from '../samples';
import type { Sample, UiSchemaForTheme } from '../samples/Sample';
import base64 from '../utils/base64';
import DemoFrame from './DemoFrame';
import Editors from './Editors';
import ErrorBoundary from './ErrorBoundary';
import GeoPosition from './GeoPosition';
import type { LiveSettings } from './OptionsDrawer';
import OptionsDrawer from './OptionsDrawer';
import SampleSelector from './SampleSelector';
import SpecialInput from './SpecialInput';
import type { ThemesType } from './ThemeSelector';

export interface PlaygroundProps {
  themes: Record<string, ThemesType>;
  validators: Record<string, ValidatorType>;
}

export default function Playground({ themes, validators }: PlaygroundProps) {
  const [loaded, setLoaded] = useState(false);
  const [schema, setSchema] = useState<RJSFSchema>(samples.Simple.schema);
  const [uiSchema, setUiSchema] = useState<UiSchema>(samples.Simple.uiSchema as UiSchema);
  // Store the generator inside of an object, otherwise react treats it as an initializer function
  const [uiSchemaGenerator, setUiSchemaGenerator] = useState<{ generator: UiSchemaForTheme } | undefined>(undefined);
  const [formData, setFormData] = useState<any>(samples.Simple.formData);
  const [extraErrors, setExtraErrors] = useState<ErrorSchema | undefined>();
  const [shareURL, setShareURL] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('default');
  const [sampleName, setSampleName] = useState<string>('Simple');
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
    experimental_componentUpdateStrategy: 'customDeep',
    experimental_defaultFormStateBehavior: { arrayMinItems: 'populate', emptyObjectFields: 'populateAllDefaults' },
    useFallbackField: false,
  });
  const [otherFormProps, setOtherFormProps] = useState<Partial<FormProps>>({});

  const playGroundFormRef = useRef<any>(null);

  const [FormComponent, setFormComponent] = useState<ComponentType<FormProps>>(withTheme({}));

  const onThemeSelected = useCallback(
    (newTheme: string, { stylesheet: newStylesheet, theme: themeObj }: ThemesType) => {
      setTheme(newTheme);
      setFormComponent(withTheme(themeObj));
      setStylesheet(newStylesheet);
      if (uiSchemaGenerator) {
        setUiSchema(uiSchemaGenerator.generator(newTheme));
      }
    },
    [uiSchemaGenerator, setTheme, setFormComponent, setStylesheet],
  );

  const load = useCallback(
    (data: Sample & { theme: string; liveSettings: LiveSettings; sampleName?: string; validator?: string }) => {
      const {
        schema: loadedSchema,
        // uiSchema is missing on some examples. Provide a default to
        // clear the field in all cases.
        uiSchema: loadedUiSchema = {},
        // Always reset templates and fields
        templates = {},
        fields = {},
        formData: loadedFormData,
        theme: dataTheme = theme,
        extraErrors: loadedExtraErrors,
        liveSettings: loadedLiveSettings,
        validator: theValidator,
        sampleName: loadedSampleName,
        ...rest
      } = data;

      // To support mui v6 `material-ui-5` was change to `mui` fix the load to update that as well
      const theTheme = dataTheme === 'material-ui-5' ? 'mui' : dataTheme;

      onThemeSelected(theTheme, themes[theTheme]);

      let theUiSchema: UiSchema;
      if (isFunction(loadedUiSchema)) {
        theUiSchema = loadedUiSchema(theme);
      } else {
        theUiSchema = loadedUiSchema;
      }
      if (loadedSampleName) {
        setSampleName(loadedSampleName);
        const sample = samples[loadedSampleName];
        if (isFunction(sample.uiSchema)) {
          setUiSchemaGenerator({ generator: sample.uiSchema });
        } else {
          setUiSchemaGenerator(undefined);
        }
      }

      // force resetting form component instance
      setShowForm(false);
      setSchema(loadedSchema);
      setUiSchema(theUiSchema);
      setFormData(loadedFormData);
      setExtraErrors(loadedExtraErrors);
      setShowForm(true);
      if (loadedLiveSettings?.liveValidate === true) {
        // Convert v5 true value to `onChange`
        loadedLiveSettings.liveValidate = 'onChange';
      }
      if (loadedLiveSettings?.liveOmit === true) {
        // Convert v5 true value to `onChange`
        loadedLiveSettings.liveOmit = 'onChange';
      }
      setLiveSettings(loadedLiveSettings);
      if ('validator' in data && theValidator !== undefined) {
        setValidator(theValidator);
      }
      setOtherFormProps({ fields, templates, ...rest });
    },
    [theme, onThemeSelected, themes],
  );

  const onSampleSelected = useCallback(
    (selectedSampleName: string) => {
      const { liveSettings: sampleLiveSettings, ...sample } = samples[selectedSampleName];
      load({
        ...sample,
        sampleName: selectedSampleName,
        liveSettings: { ...liveSettings, ...sampleLiveSettings },
        theme,
      });
    },
    [load, liveSettings, theme],
  );

  useEffect(() => {
    const hash = document.location.hash.match(/#(.*)/);

    if (hash && typeof hash[1] === 'string' && hash[1].length > 0 && !loaded) {
      try {
        const decoded = base64.decode(hash[1]);
        load(JSON.parse(decoded));
        setLoaded(true);
      } catch (error) {
        alert('Unable to load form setup data.');
        // oxlint-disable-next-line no-console
        console.error(error);
      }

      return;
    }

    // initialize theme
    onThemeSelected(theme, themes[theme]);

    setShowForm(true);
  }, [onThemeSelected, load, loaded, setShowForm, theme, themes]);

  const onFormDataChange = useCallback(
    (event: IChangeEvent, id?: string) => {
      const { formData: newFormData } = event;
      if (id) {
        // oxlint-disable-next-line no-console
        console.log('Field changed, id: ', id);
      }

      setFormData(newFormData);
      setShareURL(null);
    },
    [setFormData, setShareURL],
  );

  const onFormDataSubmit = useCallback(({ formData: submittedFormData }: IChangeEvent, event: FormEvent<any>) => {
    // oxlint-disable-next-line no-console
    console.log('submitted formData', submittedFormData);
    // oxlint-disable-next-line no-console
    console.log('submit event', event);
    window.alert('Form submitted');
  }, []);

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <SampleSelector onSelected={onSampleSelected} selectedSample={sampleName} />
      <Box sx={{ width: '100%' }}>
        <Editors
          themes={themes}
          theme={theme}
          subtheme={subtheme}
          onThemeSelected={onThemeSelected}
          setSubtheme={setSubtheme}
          setStylesheet={setStylesheet}
          formData={formData}
          setFormData={setFormData}
          schema={schema}
          setSchema={setSchema}
          uiSchema={uiSchema}
          setUiSchema={setUiSchema}
          extraErrors={extraErrors}
          setExtraErrors={setExtraErrors}
          setShareURL={setShareURL}
          hasUiSchemaGenerator={!!uiSchemaGenerator}
        />
        <Divider variant='fullWidth' sx={{ my: 1 }} />
        <ErrorBoundary>
          {showForm && (
            <DemoFrame
              head={
                <>
                  <link rel='stylesheet' id='theme' href={stylesheet || ''} />
                </>
              }
              style={{
                width: '100%',
                height: 1000,
                border: 0,
              }}
              theme={theme}
              subtheme={subtheme || 'light'}
            >
              <FormComponent
                {...otherFormProps}
                {...liveSettings}
                extraErrors={extraErrors}
                schema={schema}
                uiSchema={uiSchema}
                formData={formData}
                fields={{
                  ...otherFormProps.fields,
                  geo: GeoPosition,
                  '/schemas/specialString': SpecialInput,
                }}
                validator={validators[validator]}
                onChange={onFormDataChange}
                onSubmit={onFormDataSubmit}
                // oxlint-disable-next-line no-console
                onBlur={(id: string, value: string) => console.log(`Blurred ${id} with value ${value}`)}
                // oxlint-disable-next-line no-console
                onFocus={(id: string, value: string) => console.log(`Focused ${id} with value ${value}`)}
                // oxlint-disable-next-line no-console
                onError={(errorList: RJSFValidationError[]) => console.log('errors', errorList)}
                ref={playGroundFormRef}
              />
            </DemoFrame>
          )}
        </ErrorBoundary>
      </Box>
      <OptionsDrawer
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        shareURL={shareURL}
        theme={theme}
        validators={validators}
        validator={validator}
        liveSettings={liveSettings}
        sampleName={sampleName}
        playGroundFormRef={playGroundFormRef}
        setValidator={setValidator}
        setLiveSettings={setLiveSettings}
        setShareURL={setShareURL}
      />
    </Box>
  );
}
