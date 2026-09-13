// oxlint-disable no-console
import type { SubmitEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import type { FormProps, IChangeEvent } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import MarkdownTemplate from '@rjsf/core/markdown';
import type { ErrorSchema, RJSFSchema, RJSFValidationError, UiSchema, ValidatorType } from '@rjsf/utils';

import { samples } from '../samples/index.ts';
import type { Sample, UiSchemaForTheme } from '../samples/Sample.ts';
import base64 from '../utils/base64.ts';
import DemoFrame from './DemoFrame.tsx';
import Editors from './Editors.tsx';
import ErrorBoundary from './ErrorBoundary.tsx';
import GeoPosition from './GeoPosition.tsx';
import type { LiveSettings } from './OptionsDrawer.tsx';
import OptionsDrawer from './OptionsDrawer.tsx';
import SampleSelector from './SampleSelector.tsx';
import SpecialInput from './SpecialInput.tsx';
import type { ThemesType } from './ThemeSelector.tsx';

export interface PlaygroundProps {
  themes: Record<string, ThemesType>;
  validators: Record<string, ValidatorType>;
}

/** Maps the `liveSettings` drawer's `'off' | 'onChange' | 'onBlur'` radio value onto the
 * `liveValidate`/`liveOmit` prop shape `Form` actually accepts, since `Form` has no `'off'` value of its own.
 */
export function toLiveSetting(value: unknown): 'onChange' | 'onBlur' | undefined {
  return value === 'onChange' || value === 'onBlur' ? value : undefined;
}

/** Converts a legacy boolean `liveValidate`/`liveOmit` value - `true` from a v5 shared link, `false` from a v5/v6
 * one - into the current string value. Any other value (including `undefined`) passes through unchanged.
 */
function normalizeLiveFlag(value: unknown): unknown {
  if (value === true) {
    return 'onChange';
  }
  if (value === false) {
    return 'off';
  }
  return value;
}

/** Normalizes `liveSettings` decoded from a shared playground URL or sample: defaults a missing object to `{}` (a
 * shared URL predating `liveSettings` support omits it entirely) so callers never have to null-check it, and
 * converts any legacy boolean `liveValidate`/`liveOmit` values to their current string equivalents.
 */
export function normalizeLiveSettings(loadedLiveSettings?: LiveSettings): LiveSettings {
  const settings = loadedLiveSettings ?? {};
  return {
    ...settings,
    liveValidate: normalizeLiveFlag(settings.liveValidate),
    liveOmit: normalizeLiveFlag(settings.liveOmit),
  };
}

export default function Playground({ themes, validators }: PlaygroundProps) {
  const [loaded, setLoaded] = useState(false);
  const [schema, setSchema] = useState<RJSFSchema>(samples.Simple.schema);
  const [uiSchema, setUiSchema] = useState<UiSchema>(samples.Simple.uiSchema as UiSchema);
  // Store the generator inside of an object, otherwise react treats it as an initializer function
  const [uiSchemaGenerator, setUiSchemaGenerator] = useState<{ generator: UiSchemaForTheme } | undefined>(undefined);
  const [formData, setFormData] = useState<unknown>(samples.Simple.formData);
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
    liveOmit: 'off',
    liveValidate: 'off',
    experimental_componentUpdateStrategy: 'customDeep',
    defaultFormStateBehavior: {
      arrayMinItems: 'populate',
      emptyObjectFields: 'populateAllDefaults',
    },
    useFallbackField: false,
  });
  const [otherFormProps, setOtherFormProps] = useState<Partial<FormProps>>({});

  const playGroundFormRef = useRef<any>(null);

  const FormComponent = useMemo(() => withTheme(themes[theme].theme), [themes, theme]);

  const onThemeSelected = useCallback(
    (newTheme: string, { stylesheet: newStylesheet }: ThemesType) => {
      setTheme(newTheme);
      setStylesheet(newStylesheet);
      if (uiSchemaGenerator) {
        setUiSchema(uiSchemaGenerator.generator(newTheme));
      }
    },
    [uiSchemaGenerator, setTheme, setStylesheet],
  );

  const load = useCallback(
    (
      data: Sample & {
        theme: string;
        liveSettings: LiveSettings;
        sampleName?: string;
        validator?: string;
      },
    ) => {
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
      if (typeof loadedUiSchema === 'function') {
        theUiSchema = loadedUiSchema(theme);
      } else {
        theUiSchema = loadedUiSchema;
      }
      if (loadedSampleName) {
        setSampleName(loadedSampleName);
        const sample = samples[loadedSampleName];
        if (typeof sample.uiSchema === 'function') {
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
      setLiveSettings(normalizeLiveSettings(loadedLiveSettings));
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
        // oxlint-disable-next-line no-alert
        alert('Unable to load form setup data.');
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
        console.log('Field changed, id: ', id);
      }

      setFormData(newFormData);
      setShareURL(null);
    },
    [setFormData, setShareURL],
  );

  const onFormDataSubmit = useCallback(({ formData: submittedFormData }: IChangeEvent, event: SubmitEvent<any>) => {
    console.log('submitted formData', submittedFormData);
    console.log('submit event', event);
    // oxlint-disable-next-line no-alert
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
              head={<link rel='stylesheet' id='theme' href={stylesheet || ''} />}
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
                liveValidate={toLiveSetting(liveSettings.liveValidate)}
                liveOmit={toLiveSetting(liveSettings.liveOmit)}
                extraErrors={extraErrors}
                schema={schema}
                uiSchema={uiSchema}
                formData={formData}
                templates={{ MarkdownTemplate, ...otherFormProps.templates }}
                fields={{
                  ...otherFormProps.fields,
                  geo: GeoPosition,
                  '/schemas/specialString': SpecialInput,
                }}
                validator={validators[validator]}
                onChange={onFormDataChange}
                onSubmit={onFormDataSubmit}
                onBlur={(id: string, value: unknown) => console.log(`Blurred ${id} with value ${value}`)}
                onFocus={(id: string, value: unknown) => console.log(`Focused ${id} with value ${value}`)}
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
