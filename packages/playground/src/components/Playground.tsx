// oxlint-disable no-console
import type { SubmitEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import type { FormProps, IChangeEvent } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import MarkdownTemplate from '@rjsf/core/markdown';
import type { ErrorSchema, RJSFSchema, RJSFValidationError, UiSchema, ValidatorType } from '@rjsf/utils';
import { createSchemaUtils, resetLogOnce } from '@rjsf/utils';

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

const DEFAULT_VALIDATOR = 'AJV8';

const INITIAL_LIVE_SETTINGS: LiveSettings = {
  showErrorList: 'top',
  validate: false,
  disabled: false,
  noHtml5Validate: false,
  readonly: false,
  omitExtraData: false,
  liveOmit: 'off',
  liveValidate: 'off',
  defaultFormStateBehavior: {
    arrayMinItems: 'populate',
    emptyObjectFields: 'populateAllDefaults',
  },
  useFallbackField: false,
};

type LoadData = Sample & {
  theme?: string;
  liveSettings: LiveSettings;
  sampleName?: string;
  validator?: string;
};

/** Decodes the setup a shared link carries in the URL `hash`. It's read once, before the playground first renders,
 * and a malformed link's `error` is reported after the first paint
 */
export function readSharedSetup(hash: string): { setup?: LoadData; error?: unknown } {
  if (!hash) {
    return {};
  }
  let data: unknown;
  try {
    data = JSON.parse(base64.decode(hash));
  } catch (error) {
    return { error };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { error: `A shared link's setup must be an object: ${JSON.stringify(data)}` };
  }
  return { setup: data as LoadData };
}

const { setup: sharedSetup, error: sharedSetupError } = readSharedSetup(
  typeof document === 'undefined' ? '' : document.location.hash.slice(1),
);

/** The playground state that loading `data` sets: for the page's first render, a picked sample, or a shared link.
 * `currentTheme` stands in for a theme the data doesn't name. `sampleName` and `validator` are `undefined` when the
 * data doesn't carry them, so the caller keeps its own.
 */
export function loadedState(
  data: LoadData,
  currentTheme: string,
  themes: PlaygroundProps['themes'],
  validators: PlaygroundProps['validators'],
) {
  const {
    schema,
    // uiSchema is missing on some examples. Provide a default to
    // clear the field in all cases.
    uiSchema: loadedUiSchema = {},
    // Always reset templates and fields
    templates = {},
    fields = {},
    formData: loadedFormData,
    theme: dataTheme = currentTheme,
    extraErrors,
    liveSettings: loadedLiveSettings,
    validator,
    sampleName,
    ...rest
  } = data;

  // To support mui v6 `material-ui-5` was change to `mui` fix the load to update that as well
  const namedTheme = dataTheme === 'material-ui-5' ? 'mui' : dataTheme;
  // Old shared links still name themes the playground has since dropped, such as `semantic-ui` or `fluent-ui`
  const theme = Object.hasOwn(themes, namedTheme) ? namedTheme : 'default';
  const uiSchema = typeof loadedUiSchema === 'function' ? loadedUiSchema(currentTheme) : loadedUiSchema;
  const knownSampleName = sampleName !== undefined && !Object.hasOwn(samples, sampleName) ? 'Simple' : sampleName;
  const sampleUiSchema = knownSampleName ? samples[knownSampleName].uiSchema : undefined;
  const liveSettings = normalizeLiveSettings(loadedLiveSettings);
  // A hand-edited link, or one from before a validator was renamed, may name one the playground doesn't have
  const knownValidator =
    validator !== undefined && Object.hasOwn(validators, validator) ? validator : DEFAULT_VALIDATOR;

  // The playground owns the form data, so it seeds the schema defaults itself, the way any controlled parent does
  let formData = loadedFormData;
  try {
    // A sample passes the current validator and a shared link carries its own
    const schemaUtils = createSchemaUtils(validators[knownValidator], schema, liveSettings.defaultFormStateBehavior);
    formData = schemaUtils.getDefaultFormState(schema, loadedFormData, false, false, uiSchema);
  } catch (error) {
    // A sample may deliberately carry a schema the utilities cannot resolve; it then renders the data as given
    console.error(error);
  }

  return {
    theme,
    stylesheet: themes[theme].stylesheet,
    schema,
    uiSchema,
    formData,
    extraErrors,
    liveSettings,
    otherFormProps: { fields, templates, ...rest },
    sampleName: knownSampleName,
    uiSchemaGenerator: typeof sampleUiSchema === 'function' ? { generator: sampleUiSchema } : undefined,
    validator: validator === undefined ? undefined : knownValidator,
  };
}

export default function Playground({ themes, validators }: PlaygroundProps) {
  // Only the first render's result is read: every `useState` below keeps its own value from then on, so a recompute
  // (Fast Refresh does one when this file is edited) repeats the work and logs a sample's errors again, and changes
  // nothing
  const initial = useMemo(
    () =>
      loadedState(
        sharedSetup ?? {
          ...samples.Simple,
          sampleName: 'Simple',
          liveSettings: INITIAL_LIVE_SETTINGS,
          validator: DEFAULT_VALIDATOR,
        },
        'default',
        themes,
        validators,
      ),
    [themes, validators],
  );
  const [schema, setSchema] = useState<RJSFSchema>(initial.schema);
  const [uiSchema, setUiSchema] = useState<UiSchema>(initial.uiSchema);
  // Store the generator inside of an object, otherwise react treats it as an initializer function
  const [uiSchemaGenerator, setUiSchemaGenerator] = useState<{ generator: UiSchemaForTheme } | undefined>(
    initial.uiSchemaGenerator,
  );
  const [formData, setFormData] = useState<unknown>(initial.formData);
  const [extraErrors, setExtraErrors] = useState<ErrorSchema | undefined>(initial.extraErrors);
  const [shareURL, setShareURL] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(initial.theme);
  const [sampleName, setSampleName] = useState<string>(initial.sampleName ?? 'Simple');
  const [subtheme, setSubtheme] = useState<string | null>(null);
  const [stylesheet, setStylesheet] = useState<string | null>(initial.stylesheet ?? null);
  const [validator, setValidator] = useState<string>(initial.validator ?? DEFAULT_VALIDATOR);
  const [formKey, setFormKey] = useState(0);
  const [liveSettings, setLiveSettings] = useState<LiveSettings>(initial.liveSettings);
  const [otherFormProps, setOtherFormProps] = useState<Partial<FormProps>>(initial.otherFormProps);

  const playGroundFormRef = useRef<any>(null);

  useEffect(() => {
    if (sharedSetupError !== undefined) {
      // oxlint-disable-next-line no-alert
      alert('Unable to load form setup data.');
      console.error(sharedSetupError);
    }
  }, []);

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
    (data: LoadData) => {
      const next = loadedState(data, theme, themes, validators);
      // The uiSchema warnings are logged once per page, and every sample renders under the default `idPrefix`, so
      // without this the second sample to make the same mistake at the same field would warn about nothing. Checking
      // those warnings by hand is most of what the playground is for.
      resetLogOnce();
      setTheme(next.theme);
      setStylesheet(next.stylesheet ?? null);
      if (next.sampleName) {
        setSampleName(next.sampleName);
        setUiSchemaGenerator(next.uiSchemaGenerator);
      }
      setFormKey((key) => key + 1);
      setSchema(next.schema);
      setUiSchema(next.uiSchema);
      setFormData(next.formData);
      setExtraErrors(next.extraErrors);
      setLiveSettings(next.liveSettings);
      if (next.validator !== undefined) {
        setValidator(next.validator);
      }
      setOtherFormProps(next.otherFormProps);
    },
    [theme, themes, validators],
  );

  const onSampleSelected = useCallback(
    (selectedSampleName: string) => {
      const { liveSettings: sampleLiveSettings, ...sample } = samples[selectedSampleName];
      load({
        validator,
        ...sample,
        sampleName: selectedSampleName,
        liveSettings: { ...liveSettings, ...sampleLiveSettings },
        theme,
      });
    },
    [load, liveSettings, theme, validator],
  );

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
              key={formKey}
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
