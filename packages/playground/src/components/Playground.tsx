import { useCallback, useState, useRef, useEffect } from 'react';
import 'react-app-polyfill/ie11';
import Form, { withTheme } from '@rjsf/core';
import localValidator from '@rjsf/validator-ajv8';
import isEqualWith from 'lodash/isEqualWith';

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

const liveSettingsSchema = {
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

export const Playground: React.FC<{ themes: any; validators: any }> = ({ themes, validators }) => {
  const [schema, setSchema] = useState<object>(samples.Simple.schema);
  const [uiSchema, setUiSchema] = useState<object>(samples.Simple.uiSchema);
  const [formData, setFormData] = useState<object>(samples.Simple.formData);
  const [extraErrors, setExtraErrors] = useState<unknown>();
  const [shareURL, setShareURL] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('default');
  const [subtheme, setSubtheme] = useState<string | null>(null);
  const [stylesheet, setStylesheet] = useState<string | null>(null);
  const [validator, setValidator] = useState<string>('AJV8');
  const [showForm, setShowForm] = useState(false);
  const [liveSettings, setLiveSettings] = useState({
    showErrorList: 'top',
    validate: false,
    disable: false,
    readonly: false,
    omitExtraData: false,
    liveOmit: false,
  });
  const [FormComponent, setFormComponent] = useState<any>(withTheme({}));
  const [ArrayFieldTemplate, setArrayFieldTemplate] = useState<any>();
  const [ObjectFieldTemplate, setObjectFieldTemplate] = useState<any>();

  const playGroundFormRef = useRef<any>(null);

  useEffect(() => {
    const hash = document.location.hash.match(/#(.*)/);
    if (hash && typeof hash[1] === 'string' && hash[1].length > 0) {
      try {
        load(JSON.parse(atob(hash[1])));
      } catch (err) {
        alert('Unable to load form setup data.');
      }
    } else {
      // initialize theme
      onThemeSelected(theme, themes[theme]);

      setShowForm(true);
    }
  }, []);

  const load = (data: any) => {
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
  };

  const onThemeSelected = (theme: string, { stylesheet, theme: themeObj }: { stylesheet?: any; theme?: any }) => {
    setTheme(theme);
    setSubtheme(null);
    setFormComponent(withTheme(themeObj));
    setStylesheet(stylesheet);
  };

  const onSubthemeSelected = (subtheme: any, { stylesheet }: { stylesheet: any }) => {
    setSubtheme(subtheme);
    setStylesheet(stylesheet);
  };

  const onValidatorSelected = (validator: string) => {
    setValidator(validator);
  };

  const handleSetLiveSettings = ({ formData }: { formData: any }) => {
    setLiveSettings(formData);
  };

  const onFormDataChange = ({ formData = '' }, id: string) => {
    if (id) {
      console.log('Field changed, id: ', id);
    }

    setFormData(formData as any);
    setShareURL(null);
  };

  const onShare = () => {
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
    } catch (err) {
      setShareURL(null);
    }
  };

  let templateProps: any = {};
  if (ArrayFieldTemplate) {
    templateProps.ArrayFieldTemplate = ArrayFieldTemplate;
  }
  if (ObjectFieldTemplate) {
    templateProps.ObjectFieldTemplate = ObjectFieldTemplate;
  }
  if (extraErrors) {
    templateProps.extraErrors = extraErrors;
  }

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
              schema={liveSettingsSchema as any}
              formData={liveSettings}
              validator={localValidator}
              onChange={handleSetLiveSettings as any}
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
            </button>
            <span> </span>
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
                        // @ts-ignore
                        __html: document.getElementById('antd-styles-iframe')?.contentDocument.head.innerHTML,
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
                schema={schema}
                uiSchema={uiSchema}
                formData={formData}
                onChange={onFormDataChange}
                noHtml5Validate={true}
                onSubmit={({ formData }: { formData: string }, e: any) => {
                  console.log('submitted formData', formData);
                  console.log('submit event', e);
                  window.alert('Form submitted');
                }}
                fields={{ geo: GeoPosition }}
                validator={validators[validator]}
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

type EditorsProps = {
  schema: unknown;
  setSchema: React.Dispatch<React.SetStateAction<object>>;
  uiSchema: unknown;
  setUiSchema: React.Dispatch<React.SetStateAction<object>>;
  formData: unknown;
  setFormData: React.Dispatch<React.SetStateAction<object>>;
  extraErrors: unknown;
  setExtraErrors: React.Dispatch<React.SetStateAction<unknown>>;
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
  const onSchemaEdited = useCallback((newSchema) => {
    setSchema(newSchema);
    setShareURL(null);
  }, []);

  const onUISchemaEdited = useCallback((newUiSchema) => {
    setUiSchema(newUiSchema);
    setShareURL(null);
  }, []);

  const onFormDataEdited = useCallback((newFormData) => {
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
  }, []);

  const onExtraErrorsEdited = useCallback((newExtraErrors) => {
    setExtraErrors(newExtraErrors);
    setShareURL(null);
  }, []);

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
