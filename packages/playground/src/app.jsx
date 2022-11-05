import React, { Component } from "react";
import MonacoEditor from "@monaco-editor/react";
import { samples } from "./samples";
import "react-app-polyfill/ie11";
import Form, { withTheme } from "@rjsf/core";
import { shouldRender } from "@rjsf/utils";
import localValidator from "@rjsf/validator-ajv8";

import DemoFrame from "./DemoFrame";
import ErrorBoundary from "./ErrorBoundary";

const log = (type) => console.log.bind(console, type);
const toJson = (val) => JSON.stringify(val, null, 2);

const liveSettingsSchema = {
  type: "object",
  properties: {
    validate: { type: "boolean", title: "Live validation" },
    disable: { type: "boolean", title: "Disable whole form" },
    readonly: { type: "boolean", title: "Readonly whole form" },
    omitExtraData: { type: "boolean", title: "Omit extra data" },
    liveOmit: { type: "boolean", title: "Live omit" },
    noValidate: { type: "boolean", title: "Disable validation" },
    showErrorList:{ type: "string", "default": "top", title: "Show Error List", enum:[false,"top","bottom"] }
  },
};

const monacoEditorOptions = {
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
};

class GeoPosition extends Component {
  constructor(props) {
    super(props);
    this.state = { ...props.formData };
  }

  onChange(name) {
    return (event) => {
      this.setState({ [name]: parseFloat(event.target.value) });
      setTimeout(() => this.props.onChange(this.state), 0);
    };
  }

  render() {
    const { lat, lon } = this.state;
    return (
      <div className="geo">
        <h3>Hey, I'm a custom component</h3>
        <p>
          I'm registered as <code>geo</code> and referenced in
          <code>uiSchema</code> as the <code>ui:field</code> to use for this
          schema.
        </p>
        <div className="row">
          <div className="col-sm-6">
            <label>Latitude</label>
            <input
              className="form-control"
              type="number"
              value={lat}
              step="0.00001"
              onChange={this.onChange("lat")}
            />
          </div>
          <div className="col-sm-6">
            <label>Longitude</label>
            <input
              className="form-control"
              type="number"
              value={lon}
              step="0.00001"
              onChange={this.onChange("lon")}
            />
          </div>
        </div>
      </div>
    );
  }
}

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = { valid: true, code: props.code };
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.setState({ valid: true, code: props.code });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.valid) {
      return (
        JSON.stringify(JSON.parse(nextProps.code)) !==
        JSON.stringify(JSON.parse(this.state.code))
      );
    }
    return false;
  }

  onCodeChange = (code) => {
    try {
      const parsedCode = JSON.parse(code);
      this.setState({ valid: true, code }, () =>
        this.props.onChange(parsedCode)
      );
    } catch (err) {
      this.setState({ valid: false, code });
    }
  };

  render() {
    const { title } = this.props;
    const icon = this.state.valid ? "ok" : "remove";
    const cls = this.state.valid ? "valid" : "invalid";
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <span className={`${cls} glyphicon glyphicon-${icon}`} />
          {" " + title}
        </div>
        <MonacoEditor
          language="json"
          value={this.state.code}
          theme="vs-light"
          onChange={this.onCodeChange}
          height={400}
          options={monacoEditorOptions}
        />
      </div>
    );
  }
}

class Selector extends Component {
  constructor(props) {
    super(props);
    this.state = { current: "Simple" };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onLabelClick = (label) => {
    return (event) => {
      event.preventDefault();
      this.setState({ current: label });
      setTimeout(() => this.props.onSelected(samples[label]), 0);
    };
  };

  render() {
    return (
      <ul className="nav nav-pills">
        {Object.keys(samples).map((label, i) => {
          return (
            <li
              key={i}
              role="presentation"
              className={this.state.current === label ? "active" : ""}
            >
              <a href="#" onClick={this.onLabelClick(label)}>
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }
}

function ThemeSelector({ theme, themes, select }) {
  const schema = {
    type: "string",
    enum: Object.keys(themes),
  };
  const uiSchema = {
    "ui:placeholder": "Select theme",
  };
  return (
    <Form
      className="form_rjsf_themeSelector"
      idPrefix="rjsf_themeSelector"
      schema={schema}
      uiSchema={uiSchema}
      formData={theme}
      validator={localValidator}
      onChange={({ formData }) =>
        formData && select(formData, themes[formData])
      }
    >
      <div />
    </Form>
  );
}

function SubthemeSelector({ subtheme, subthemes, select }) {
  const schema = {
    type: "string",
    enum: Object.keys(subthemes),
  };
  const uiSchema = {
    "ui:placeholder": "Select subtheme",
  };
  return (
    <Form
      className="form_rjsf_subthemeSelector"
      idPrefix="rjsf_subthemeSelector"
      schema={schema}
      uiSchema={uiSchema}
      formData={subtheme}
      validator={localValidator}
      onChange={({ formData }) =>
        formData && select(formData, subthemes[formData])
      }
    >
      <div />
    </Form>
  );
}

function ValidatorSelector({ validator, validators, select }) {
  const schema = {
    type: "string",
    enum: Object.keys(validators),
  };
  const uiSchema = {
    "ui:placeholder": "Select validator",
  };
  return (
    <Form
      className="form_rjsf_validatorSelector"
      idPrefix="rjsf_validatorSelector"
      schema={schema}
      uiSchema={uiSchema}
      formData={validator}
      validator={localValidator}
      onChange={({ formData }) => formData && select(formData)}
    >
      <div />
    </Form>
  );
}

class CopyLink extends Component {
  onCopyClick = (event) => {
    this.input.select();
    document.execCommand("copy");
  };

  render() {
    const { shareURL, onShare } = this.props;
    if (!shareURL) {
      return (
        <button className="btn btn-default" type="button" onClick={onShare}>
          Share
        </button>
      );
    }
    return (
      <div className="input-group">
        <input
          type="text"
          ref={(input) => (this.input = input)}
          className="form-control"
          defaultValue={shareURL}
        />
        <span className="input-group-btn">
          <button
            className="btn btn-default"
            type="button"
            onClick={this.onCopyClick}
          >
            <i className="glyphicon glyphicon-copy" />
          </button>
        </span>
      </div>
    );
  }
}

function RawValidatorTest({ validator, schema, formData }) {
  const [rawValidation, setRawValidation] = React.useState();
  const handleClearClick = () => setRawValidation(undefined);
  const handleRawClick = () => setRawValidation(validator.rawValidation(schema, formData));

  let displayErrors = "Validation not run";
  if (rawValidation) {
    displayErrors =
      rawValidation.errors || rawValidation.validationError ?
        JSON.stringify(rawValidation, null, 2) :
        "No AJV errors encountered";
  }
  return (
    <div>
      <details style={{ marginBottom: "10px" }}>
        <summary style={{ display: "list-item" }}>Raw Ajv Validation</summary>
        To determine whether a validation issue is really a BUG in Ajv use the button to trigger the raw Ajv validation.
        This will run your schema and formData through Ajv without involving any react-jsonschema-form specific code.
        If there is an unexpected error, then <a href="https://github.com/ajv-validator/ajv/issues/new/choose" target="_blank" rel="noopener">file an issue</a> with Ajv instead.
      </details>
      <div style={{ marginBottom: "10px" }}>
        <button
          className="btn btn-default"
          type="button"
          onClick={handleRawClick}
        >
          Raw Validate
        </button>
        {rawValidation && (
          <>
            <span>{" "}</span>
            <button
              className="btn btn-default"
              type="button"
              onClick={handleClearClick}
            >
              Clear
            </button>
          </>
        )}
      </div>
      <textarea rows={4} readOnly disabled={!rawValidation} value={displayErrors} />
    </div>
  );
}

class Playground extends Component {
  constructor(props) {
    super(props);

    // set default theme
    const theme = "default";
    const validator = "AJV8";
    // initialize state with Simple data sample
    const { schema, uiSchema, formData, validate } = samples.Simple;
    this.playGroundForm = React.createRef();
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
        showErrorList:'top',
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
    if (hash && typeof hash[1] === "string" && hash[1].length > 0) {
      try {
        this.load(JSON.parse(atob(hash[1])));
      } catch (err) {
        alert("Unable to load form setup data.");
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

  onFormDataEdited = (formData) => this.setState({ formData, shareURL: null });

  onExtraErrorsEdited = (extraErrors) =>
    this.setState({ extraErrors, shareURL: null });

  onThemeSelected = (
    theme,
    { subthemes, stylesheet, theme: themeObj } = {}
  ) => {
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

  onFormDataChange = ({ formData = "" }, id) => {
    if (id) {
      console.log("Field changed, id: ", id);
    }
    return this.setState({ formData, shareURL: null });
  };

  onShare = () => {
    const { formData, schema, uiSchema, liveSettings, errorSchema, theme } =
      this.state;
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
      <div className="container-fluid">
        <div className="page-header">
          <h1>react-jsonschema-form</h1>
          <div className="row">
            <div className="col-sm-6">
              <Selector onSelected={this.load} />
            </div>
            <div className="col-sm-2">
              <Form
                idPrefix="rjsf_options"
                schema={liveSettingsSchema}
                formData={liveSettings}
                validator={localValidator}
                onChange={this.setLiveSettings}
              >
                <div />
              </Form>
            </div>
            <div className="col-sm-2">
              <ThemeSelector
                themes={themes}
                theme={theme}
                select={this.onThemeSelected}
              />
              {themes[theme].subthemes && (
                <SubthemeSelector
                  subthemes={themes[theme].subthemes}
                  subtheme={subtheme}
                  select={this.onSubthemeSelected}
                />
              )}
              <ValidatorSelector
                validators={validators}
                validator={validator}
                select={this.onValidatorSelected}
              />
              <button
                title="Click me to submit the form programmatically."
                className="btn btn-default"
                type="button"
                onClick={() => this.playGroundForm.current.submit()}
              >
                Prog. Submit
              </button>
              <span> </span>
              <button
                title="Click me to validate the form programmatically."
                className="btn btn-default"
                type="button"
                onClick={() => {
                  const valid = this.playGroundForm.current.validateForm();
                  alert(valid ? "Form is valid" : "Form has errors");
                }}
              >
                Prog. Validate
              </button>
              <div style={{ marginTop: "5px" }} />
              <CopyLink shareURL={this.state.shareURL} onShare={this.onShare} />
            </div>
            <div className="col-sm-2">
              <RawValidatorTest validator={validators[validator]} schema={schema} formData={formData} />
            </div>
          </div>
        </div>
        <div className="col-sm-7">
          <Editor
            title="JSONSchema"
            code={toJson(schema)}
            onChange={this.onSchemaEdited}
          />
          <div className="row">
            <div className="col-sm-6">
              <Editor
                title="UISchema"
                code={toJson(uiSchema)}
                onChange={this.onUISchemaEdited}
              />
            </div>
            <div className="col-sm-6">
              <Editor
                title="formData"
                code={toJson(formData)}
                onChange={this.onFormDataEdited}
              />
            </div>
          </div>
          {extraErrors && (
            <div className="row">
              <div className="col">
                <Editor
                  title="extraErrors"
                  code={toJson(extraErrors || {})}
                  onChange={this.onExtraErrorsEdited}
                />
              </div>
            </div>
          )}
        </div>
        <div className="col-sm-5">
          <ErrorBoundary>
            {this.state.form && (
              <DemoFrame
                head={
                  <React.Fragment>
                    <link
                      rel="stylesheet"
                      id="theme"
                      href={this.state.stylesheet || ""}
                    />
                    {theme === "antd" && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            document.getElementById("antd-styles-iframe")
                              .contentDocument.head.innerHTML,
                        }}
                      />
                    )}
                  </React.Fragment>
                }
                style={{
                  width: "100%",
                  height: 1000,
                  border: 0,
                }}
                theme={theme}
              >
                <FormComponent
                  {...templateProps}
                  liveValidate={liveSettings.validate}
                  disabled={liveSettings.disable}
                  readonly={liveSettings.readonly}
                  omitExtraData={liveSettings.omitExtraData}
                  liveOmit={liveSettings.liveOmit}
                  noValidate={liveSettings.noValidate}
                  showErrorList={liveSettings.showErrorList}
                  schema={schema}
                  uiSchema={uiSchema}
                  formData={formData}
                  onChange={this.onFormDataChange}
                  noHtml5Validate={true}
                  onSubmit={({ formData }, e) => {
                    console.log("submitted formData", formData);
                    console.log("submit event", e);
                    window.alert("Form submitted");
                  }}
                  fields={{ geo: GeoPosition }}
                  customValidate={validate}
                  validator={validators[validator]}
                  onBlur={(id, value) =>
                    console.log(`Touched ${id} with value ${value}`)
                  }
                  onFocus={(id, value) =>
                    console.log(`Focused ${id} with value ${value}`)
                  }
                  transformErrors={transformErrors}
                  onError={log("errors")}
                  ref={this.playGroundForm}
                />
              </DemoFrame>
            )}
          </ErrorBoundary>
        </div>
        <div className="col-sm-12">
          <p style={{ textAlign: "center" }}>
            Powered by{" "}
            <a href="https://github.com/rjsf-team/react-jsonschema-form">
              react-jsonschema-form
            </a>
            .
            {import.meta.env.VITE_SHOW_NETLIFY_BADGE === "true" && (
              <div style={{ float: "right" }}>
                <a href="https://www.netlify.com">
                  <img src="https://www.netlify.com/img/global/badges/netlify-color-accent.svg" />
                </a>
              </div>
            )}
          </p>
        </div>
      </div>
    );
  }
}

export default Playground;
