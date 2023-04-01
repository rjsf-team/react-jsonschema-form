import { useCallback, useState, useRef, useEffect, ComponentType, FormEvent } from 'react';
import 'react-app-polyfill/ie11';
import isEqualWith from 'lodash/isEqualWith';

import { withTheme, IChangeEvent, FormProps } from '@rjsf/core';
import {
  ErrorSchema,
  TemplatesType,
  ArrayFieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  UiSchema,
  ValidatorType,
} from '@rjsf/utils';

import { samples } from '../samples';
import Header from './Header';
import DemoFrame from './DemoFrame';
import ErrorBoundary from './ErrorBoundary';
import GeoPosition from './GeoPosition';
import { ThemesType } from './ThemeSelector';
import Editor from './Editor';

const log = (type: string) => console.log.bind(console, type);
const toJson = (val: unknown) => JSON.stringify(val, null, 2);

type EditorsProps = {
  schema: RJSFSchema;
  setSchema: React.Dispatch<React.SetStateAction<RJSFSchema>>;
  uiSchema: UiSchema;
  setUiSchema: React.Dispatch<React.SetStateAction<UiSchema>>;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  extraErrors: ErrorSchema | undefined;
  setExtraErrors: React.Dispatch<React.SetStateAction<ErrorSchema | undefined>>;
  setShareURL: React.Dispatch<React.SetStateAction<string | null>>;
};

function Editors({
  extraErrors,
  formData,
  schema,
  uiSchema,
  setExtraErrors,
  setFormData,
  setSchema,
  setShareURL,
  setUiSchema,
}: EditorsProps) {
  const onSchemaEdited = useCallback(
    (newSchema) => {
      setSchema(newSchema);
      setShareURL(null);
    },
    [setSchema, setShareURL]
  );

  const onUISchemaEdited = useCallback(
    (newUiSchema) => {
      setUiSchema(newUiSchema);
      setShareURL(null);
    },
    [setUiSchema, setShareURL]
  );

  const onFormDataEdited = useCallback(
    (newFormData) => {
      if (
        !isEqualWith(newFormData, formData, (newValue, oldValue) => {
          // Since this is coming from the editor which uses JSON.stringify to trim undefined values compare the values
          // using JSON.stringify to see if the trimmed formData is the same as the untrimmed state
          // Sometimes passing the trimmed value back into the Form causes the defaults to be improperly assigned
          return JSON.stringify(oldValue) === JSON.stringify(newValue);
        })
      ) {
        setFormData(newFormData);
        setShareURL(null);
      }
    },
    [formData, setFormData, setShareURL]
  );

  const onExtraErrorsEdited = useCallback(
    (newExtraErrors) => {
      setExtraErrors(newExtraErrors);
      setShareURL(null);
    },
    [setExtraErrors, setShareURL]
  );

  return (
    <div className='col-sm-7'>
      <Editor title='JSONSchema' code={toJson(schema)} onChange={onSchemaEdited} />
      <div className='row'>
        <div className='col-sm-6'>
          <Editor title='UISchema' code={toJson(uiSchema)} onChange={onUISchemaEdited} />
        </div>
        <div className='col-sm-6'>
          <Editor title='formData' code={toJson(formData)} onChange={onFormDataEdited} />
        </div>
      </div>
      {extraErrors && (
        <div className='row'>
          <div className='col'>
            <Editor title='extraErrors' code={toJson(extraErrors || {})} onChange={onExtraErrorsEdited} />
          </div>
        </div>
      )}
    </div>
  );
}

export interface LiveSettings {
  showErrorList: false | 'top' | 'bottom';
  [key: string]: any;
}

export interface PlaygroundProps {
  themes: { [themeName: string]: ThemesType };
  validators: { [validatorName: string]: ValidatorType };
}

export default function Playground({ themes, validators }: PlaygroundProps) {
  const [loaded, setLoaded] = useState(false);
  const [schema, setSchema] = useState<RJSFSchema>(samples.Simple.schema as RJSFSchema);
  const [uiSchema, setUiSchema] = useState<UiSchema>(samples.Simple.uiSchema);
  const [formData, setFormData] = useState<any>(samples.Simple.formData);
  const [extraErrors, setExtraErrors] = useState<ErrorSchema | undefined>();
  const [shareURL, setShareURL] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('default');
  const [subtheme, setSubtheme] = useState<string | null>(null);
  const [stylesheet, setStylesheet] = useState<string | null>(null);
  const [validator, setValidator] = useState<string>('AJV8');
  const [showForm, setShowForm] = useState(false);
  const [liveSettings, setLiveSettings] = useState<LiveSettings>({
    showErrorList: 'top',
    validate: false,
    disable: false,
    readonly: false,
    omitExtraData: false,
    liveOmit: false,
  });
  const [FormComponent, setFormComponent] = useState<ComponentType<FormProps>>(withTheme({}));
  const [ArrayFieldTemplate, setArrayFieldTemplate] = useState<ComponentType<ArrayFieldTemplateProps>>();
  const [ObjectFieldTemplate, setObjectFieldTemplate] = useState<ComponentType<ObjectFieldTemplateProps>>();

  const playGroundFormRef = useRef<any>(null);

  const onThemeSelected = useCallback(
    (theme: string, { stylesheet, theme: themeObj }: ThemesType) => {
      setTheme(theme);
      setSubtheme(null);
      setFormComponent(withTheme(themeObj));
      setStylesheet(stylesheet);
    },
    [setTheme, setSubtheme, setFormComponent, setStylesheet]
  );

  const load = useCallback(
    (data: any) => {
      // Reset the ArrayFieldTemplate whenever you load new data
      const { ArrayFieldTemplate, ObjectFieldTemplate, extraErrors } = data;
      // uiSchema is missing on some examples. Provide a default to
      // clear the field in all cases.
      const { schema, uiSchema = {}, formData, theme: dataTheme = theme } = data;

      onThemeSelected(dataTheme, themes[dataTheme]);

      // force resetting form component instance
      setShowForm(false);
      setSchema(schema);
      setUiSchema(uiSchema);
      setFormData(formData);
      setExtraErrors(extraErrors);
      setTheme(dataTheme);
      setArrayFieldTemplate(ArrayFieldTemplate);
      setObjectFieldTemplate(ObjectFieldTemplate);
      setShowForm(true);
    },
    [theme, onThemeSelected, themes]
  );

  useEffect(() => {
    const hash = document.location.hash.match(/#(.*)/);

    if (hash && typeof hash[1] === 'string' && hash[1].length > 0 && !loaded) {
      try {
        load(JSON.parse(atob(hash[1])));
        setLoaded(true);
      } catch (error) {
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
    ({ formData }: IChangeEvent, id?: string) => {
      if (id) {
        console.log('Field changed, id: ', id);
      }

      setFormData(formData);
      setShareURL(null);
    },
    [setFormData, setShareURL]
  );

  const onFormDataSubmit = useCallback(({ formData }: IChangeEvent, event: FormEvent<any>) => {
    console.log('submitted formData', formData);
    console.log('submit event', event);
    window.alert('Form submitted');
  }, []);

  const templateProps: Partial<TemplatesType> = {
    ArrayFieldTemplate,
    ObjectFieldTemplate,
  };

  return (
    <>
      <Header
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        shareURL={shareURL}
        themes={themes}
        theme={theme}
        subtheme={subtheme}
        validators={validators}
        validator={validator}
        liveSettings={liveSettings}
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
        formData={formData}
        setFormData={setFormData}
        schema={schema}
        setSchema={setSchema}
        uiSchema={uiSchema}
        setUiSchema={setUiSchema}
        extraErrors={extraErrors}
        setExtraErrors={setExtraErrors}
        setShareURL={setShareURL}
      />
      <div className='col-sm-5'>
        <ErrorBoundary>
          {showForm && (
            <DemoFrame
              head={
                <>
                  <link rel='stylesheet' id='theme' href={stylesheet || ''} />
                  {theme === 'antd' && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          (document.getElementById('antd-styles-iframe') as HTMLIFrameElement)?.contentDocument?.head
                            .innerHTML || '',
                      }}
                    />
                  )}
                </>
              }
              style={{
                width: '100%',
                height: 1000,
                border: 0,
              }}
              theme={theme}
            >
              <FormComponent
                {...templateProps}
                {...liveSettings}
                extraErrors={extraErrors}
                schema={schema}
                uiSchema={uiSchema}
                formData={formData}
                noHtml5Validate={true}
                fields={{ geo: GeoPosition }}
                validator={validators[validator]}
                onChange={onFormDataChange}
                onSubmit={onFormDataSubmit}
                onBlur={(id: string, value: string) => console.log(`Touched ${id} with value ${value}`)}
                onFocus={(id: string, value: string) => console.log(`Focused ${id} with value ${value}`)}
                onError={log('errors')}
                ref={playGroundFormRef}
              />
            </DemoFrame>
          )}
        </ErrorBoundary>
      </div>
    </>
  );
}
