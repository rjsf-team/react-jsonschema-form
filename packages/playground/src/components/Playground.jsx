import { createRef, Component } from 'react';

import { samples } from './samples';
import 'react-app-polyfill/ie11';
import Form, { withTheme } from '@rjsf/core';
import { shouldRender } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';
import isEqualWith from 'lodash/isEqualWith';

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

const log = (type) => console.log.bind(console, type);
const toJson = (val) => JSON.stringify(val, null, 2);

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

export class Playground extends Component {
  constructor(props) {
    super(props);

    // set default theme
    const theme = 'default';
    const validator = 'AJV8';
    // initialize state with Simple data sample
    const { schema, uiSchema, formData, validate } = samples.Simple;
    this.playGroundForm = createRef();
    this.state = {
      form: false,
      schema,
      uiSchema,
      formData,
      validate,
      theme,
      validator,
      subtheme: null,
      liveSettings: {
        showErrorList: 'top',
        validate: false,
        disable: false,
        readonly: false,
        omitExtraData: false,
        liveOmit: false,
      },
      shareURL: null,
      FormComponent: withTheme({}),
    };
  }

  componentDidMount() {
    const { themes } = this.props;
    const { theme } = this.state;
    const hash = document.location.hash.match(/#(.*)/);
    if (hash && typeof hash[1] === 'string' && hash[1].length > 0) {
      try {
        this.load(JSON.parse(atob(hash[1])));
      } catch (err) {
        alert('Unable to load form setup data.');
      }
    } else {
      // initialize theme
      this.onThemeSelected(theme, themes[theme]);

      this.setState({ form: true });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  load = (data) => {
    // Reset the ArrayFieldTemplate whenever you load new data
    const { ArrayFieldTemplate, ObjectFieldTemplate, extraErrors } = data;
    // uiSchema is missing on some examples. Provide a default to
    // clear the field in all cases.
    const { uiSchema = {} } = data;

    const { theme = this.state.theme } = data;
    const { themes } = this.props;
    this.onThemeSelected(theme, themes[theme]);

    // force resetting form component instance
    this.setState({ form: false }, () =>
      this.setState({
        ...data,
        form: true,
        ArrayFieldTemplate,
        ObjectFieldTemplate,
        uiSchema,
        extraErrors,
      })
    );
  };

  onSchemaEdited = (schema) => this.setState({ schema, shareURL: null });

  onUISchemaEdited = (uiSchema) => this.setState({ uiSchema, shareURL: null });

  onFormDataEdited = (formData) => {
    if (
      !isEqualWith(formData, this.state.formData, (newValue, oldValue) => {
        // Since this is coming from the editor which uses JSON.stringify to trim undefined values compare the values
        // using JSON.stringify to see if the trimmed formData is the same as the untrimmed state
        // Sometimes passing the trimmed value back into the Form causes the defaults to be improperly assigned
        return JSON.stringify(oldValue) === JSON.stringify(newValue);
      })
    ) {
      this.setState({ formData, shareURL: null });
    }
  };

  onExtraErrorsEdited = (extraErrors) => this.setState({ extraErrors, shareURL: null });

  onThemeSelected = (theme, { subthemes, stylesheet, theme: themeObj } = {}) => {
    this.setState({
      theme,
      subthemes,
      subtheme: null,
      FormComponent: withTheme(themeObj),
      stylesheet,
    });
  };

  onSubthemeSelected = (subtheme, { stylesheet }) => {
    this.setState({
      subtheme,
      stylesheet,
    });
  };

  onValidatorSelected = (validator) => {
    this.setState({ validator });
  };

  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });

  onFormDataChange = ({ formData = '' }, id) => {
    if (id) {
      console.log('Field changed, id: ', id);
    }
    return this.setState({ formData, shareURL: null });
  };

  onShare = () => {
    const { formData, schema, uiSchema, liveSettings, errorSchema, theme } = this.state;
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
          errorSchema,
        })
      );
      this.setState({ shareURL: `${origin}${pathname}#${hash}` });
    } catch (err) {
      this.setState({ shareURL: null });
    }
  };

  render() {
    const {
      schema,
      uiSchema,
      formData,
      extraErrors,
      liveSettings,
      validate,
      theme,
      validator,
      subtheme,
      FormComponent,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
    } = this.state;

    const { themes, validators } = this.props;

    let templateProps = {};
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
              <Selector onSelected={this.load} />
            </div>
            <div className='col-sm-2'>
              <Form
                idPrefix='rjsf_options'
                schema={liveSettingsSchema}
                formData={liveSettings}
                validator={localValidator}
                onChange={this.setLiveSettings}
              >
                <div />
              </Form>
            </div>
            <div className='col-sm-2'>
              <ThemeSelector themes={themes} theme={theme} select={this.onThemeSelected} />
              {themes[theme] && themes[theme].subthemes && (
                <SubthemeSelector
                  subthemes={themes[theme].subthemes}
                  subtheme={subtheme}
                  select={this.onSubthemeSelected}
                />
              )}
              <ValidatorSelector validators={validators} validator={validator} select={this.onValidatorSelected} />
              <button
                title='Click me to submit the form programmatically.'
                className='btn btn-default'
                type='button'
                onClick={() => this.playGroundForm.current.submit()}
              >
                Prog. Submit
              </button>
              <span> </span>
              <button
                title='Click me to validate the form programmatically.'
                className='btn btn-default'
                type='button'
                onClick={() => {
                  const valid = this.playGroundForm.current.validateForm();
                  alert(valid ? 'Form is valid' : 'Form has errors');
                }}
              >
                Prog. Validate
              </button>
              <button
                title='Click me to reset the form programmatically.'
                className='btn btn-default'
                type='button'
                onClick={() => this.playGroundForm.current.reset()}
              >
                Prog. Reset
              </button>
              <span> </span>
              <div style={{ marginTop: '5px' }} />
              <CopyLink shareURL={this.state.shareURL} onShare={this.onShare} />
            </div>
            <div className='col-sm-2'>
              <RawValidatorTest validator={validators[validator]} schema={schema} formData={formData} />
            </div>
          </div>
        </div>
        <div className='col-sm-7'>
          <Editor title='JSONSchema' code={toJson(schema)} onChange={this.onSchemaEdited} />
          <div className='row'>
            <div className='col-sm-6'>
              <Editor title='UISchema' code={toJson(uiSchema)} onChange={this.onUISchemaEdited} />
            </div>
            <div className='col-sm-6'>
              <Editor title='formData' code={toJson(formData)} onChange={this.onFormDataEdited} />
            </div>
          </div>
          {extraErrors && (
            <div className='row'>
              <div className='col'>
                <Editor title='extraErrors' code={toJson(extraErrors || {})} onChange={this.onExtraErrorsEdited} />
              </div>
            </div>
          )}
        </div>
        <div className='col-sm-5'>
          <ErrorBoundary>
            {this.state.form && (
              <DemoFrame
                head={
                  <>
                    <link rel='stylesheet' id='theme' href={this.state.stylesheet || ''} />
                    {theme === 'antd' && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: document.getElementById('antd-styles-iframe').contentDocument.head.innerHTML,
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
                  onChange={this.onFormDataChange}
                  noHtml5Validate={true}
                  onSubmit={({ formData }, e) => {
                    console.log('submitted formData', formData);
                    console.log('submit event', e);
                    window.alert('Form submitted');
                  }}
                  fields={{ geo: GeoPosition }}
                  customValidate={validate}
                  validator={validators[validator]}
                  onBlur={(id, value) => console.log(`Touched ${id} with value ${value}`)}
                  onFocus={(id, value) => console.log(`Focused ${id} with value ${value}`)}
                  transformErrors={transformErrors}
                  onError={log('errors')}
                  ref={this.playGroundForm}
                />
              </DemoFrame>
            )}
          </ErrorBoundary>
        </div>
      </>
    );
  }
}

export default Playground;
