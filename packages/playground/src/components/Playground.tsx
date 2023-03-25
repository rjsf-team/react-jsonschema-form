import { useCallback, useState, useRef, useEffect, ComponentType, FormEvent } from 'react';
import 'react-app-polyfill/ie11';
import isEqualWith from 'lodash/isEqualWith';
import Form, { withTheme, IChangeEvent, FormProps } from '@rjsf/core';
import {
  ErrorSchema,
  TemplatesType,
  ArrayFieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';

import { samples } from '../samples';
import DemoFrame from './DemoFrame';
import ErrorBoundary from './ErrorBoundary';
import CopyLink from './CopyLink';
import GeoPosition from './GeoPosition';
import ThemeSelector from './ThemeSelector';
import Selector from './Selector';
import ValidatorSelector from './ValidatorSelector';
import SubthemeSelector from './SubthemeSelector';
import RawValidatorTest from './RawValidatorTest';
import Editor from './Editor';

const log = (type: string) => console.log.bind(console, type);
const toJson = (val: unknown) => JSON.stringify(val, null, 2);

const liveSettingsSchema: RJSFSchema = {
  type: 'object',
  properties: {
    liveValidate: { type: 'boolean', title: 'Live validation' },
    disable: { type: 'boolean', title: 'Disable whole form' },
    readonly: { type: 'boolean', title: 'Readonly whole form' },
    omitExtraData: { type: 'boolean', title: 'Omit extra data' },
    liveOmit: { type: 'boolean', title: 'Live omit' },
    noValidate: { type: 'boolean', title: 'Disable validation' },
    focusOnFirstError: { type: 'boolean', title: 'Focus on 1st Error' },
    showErrorList: {
      type: 'string',
      default: 'top',
      title: 'Show Error List',
      enum: [false, 'top', 'bottom'],
    },
  },
};

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

const Editors: React.FC<EditorsProps> = ({
  extraErrors,
  formData,
  schema,
  uiSchema,
  setExtraErrors,
  setFormData,
  setSchema,
  setShareURL,
  setUiSchema,
}) => {
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
};

interface LiveSettings {
  showErrorList: false | 'top' | 'bottom';
  [key: string]: any;
}

export const Playground: React.FC<{ themes: any; validators: any }> = ({ themes, validators }) => {
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
    (theme: string, { stylesheet, theme: themeObj }: { stylesheet?: any; theme?: any }) => {
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
      const { uiSchema = {} } = data;

      const { theme: dataTheme = theme } = data;

      onThemeSelected(dataTheme, themes[dataTheme]);

      // force resetting form component instance
      setShowForm(false);

      setUiSchema(uiSchema);
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

    if (hash && typeof hash[1] === 'string' && hash[1].length > 0) {
      try {
        load(JSON.parse(atob(hash[1])));
      } catch (error) {
        alert('Unable to load form setup data.');
        console.error(error);
      }

      return;
    }

    // initialize theme
    onThemeSelected(theme, themes[theme]);

    setShowForm(true);
  }, [onThemeSelected, load, setShowForm, theme, themes]);

  const onSubthemeSelected = useCallback(
    (subtheme: any, { stylesheet }: { stylesheet: any }) => {
      setSubtheme(subtheme);
      setStylesheet(stylesheet);
    },
    [setSubtheme, setStylesheet]
  );

  const onValidatorSelected = useCallback(
    (validator: string) => {
      setValidator(validator);
    },
    [setValidator]
  );

  const handleSetLiveSettings = useCallback(
    ({ formData }: IChangeEvent<any, RJSFSchema, any>) => {
      setLiveSettings(formData);
    },
    [setLiveSettings]
  );

  const onFormDataChange = useCallback(
    ({ formData }: IChangeEvent<any, RJSFSchema, any>, id?: string) => {
      if (id) {
        console.log('Field changed, id: ', id);
      }

      setFormData(formData);
      setShareURL(null);
    },
    [setFormData, setShareURL]
  );

  const onFormDataSubmit = useCallback(({ formData }: IChangeEvent<any, RJSFSchema, any>, event: FormEvent<any>) => {
    console.log('submitted formData', formData);
    console.log('submit event', event);
    window.alert('Form submitted');
  }, []);

  const onShare = useCallback(() => {
    const {
      location: { origin, pathname },
    } = document;

    try {
      const hash = btoa(
        JSON.stringify({
          formData,
          schema,
          uiSchema,
          theme,
          liveSettings,
        })
      );

      setShareURL(`${origin}${pathname}#${hash}`);
    } catch (error) {
      setShareURL(null);
      console.error(error);
    }
  }, [formData, liveSettings, schema, theme, uiSchema]);

  const templateProps: Partial<TemplatesType> = {
    ArrayFieldTemplate,
    ObjectFieldTemplate,
  };

  return (
    <>
      <div className='page-header'>
        <h1>react-jsonschema-form</h1>
        <div className='row'>
          <div className='col-sm-6'>
            <Selector onSelected={load} />
          </div>
          <div className='col-sm-2'>
            <Form
              idPrefix='rjsf_options'
              schema={liveSettingsSchema}
              formData={liveSettings}
              validator={localValidator}
              onChange={handleSetLiveSettings}
            >
              <div />
            </Form>
          </div>
          <div className='col-sm-2'>
            <ThemeSelector themes={themes} theme={theme} select={onThemeSelected} />
            {themes[theme] && themes[theme].subthemes && (
              <SubthemeSelector subthemes={themes[theme].subthemes} subtheme={subtheme} select={onSubthemeSelected} />
            )}
            <ValidatorSelector validators={validators} validator={validator} select={onValidatorSelected} />
            <button
              title='Click me to submit the form programmatically.'
              className='btn btn-default'
              type='button'
              onClick={() => playGroundFormRef.current.submit()}
            >
              Prog. Submit
            </button>{' '}
            <button
              title='Click me to validate the form programmatically.'
              className='btn btn-default'
              type='button'
              onClick={() => {
                const valid = playGroundFormRef.current.validateForm();
                alert(valid ? 'Form is valid' : 'Form has errors');
              }}
            >
              Prog. Validate
            </button>{' '}
            <button
              title='Click me to reset the form programmatically.'
              className='btn btn-default'
              type='button'
              onClick={() => playGroundFormRef.current.reset()}
            >
              Prog. Reset
            </button>
            <div style={{ marginTop: '5px' }} />
            <CopyLink shareURL={shareURL} onShare={onShare} />
          </div>
          <div className='col-sm-2'>
            <RawValidatorTest validator={validators[validator]} schema={schema} formData={formData} />
          </div>
        </div>
      </div>
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
};

export default Playground;
