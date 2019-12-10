import React, { Component } from "react";
import { render } from "react-dom";
import MonacoEditor from "react-monaco-editor";

import { shouldRender } from "../../packages/core/src/utils";
import { samples } from "./samples";
import Form from "../../packages/core/src";
import "react-app-polyfill/ie11";

import MaterialUIForm from "../../packages/material-ui/src";

const log = type => console.log.bind(console, type);
const toJson = val => JSON.stringify(val, null, 2);
const liveSettingsSchema = {
  type: "object",
  properties: {
    validate: { type: "boolean", title: "Live validation" },
    disable: { type: "boolean", title: "Disable whole form" },
    omitExtraData: { type: "boolean", title: "Omit extra data" },
    liveOmit: { type: "boolean", title: "Live omit" },
  },
};
const themes = {
  default: {
    stylesheet:
      "//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    formComponent: Form
  },
  "material-ui": {
    stylesheet: "",
    formComponent: MaterialUIForm
  }
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
    return event => {
      this.setState({ [name]: parseFloat(event.target.value) });
      setImmediate(() => this.props.onChange(this.state));
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

  onCodeChange = code => {
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

  onLabelClick = label => {
    return event => {
      event.preventDefault();
      this.setState({ current: label });
      setImmediate(() => this.props.onSelected(samples[label]));
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
              className={this.state.current === label ? "active" : ""}>
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

function ThemeSelector({ theme, select, FormComponent }) {
  const themeSchema = {
    type: "string",
    enum: Object.keys(themes),
  };
  return (
    <FormComponent
      schema={themeSchema}
      formData={theme}
      onChange={({ formData }) => select(formData, themes[formData])}>
      <div />
    </FormComponent>
  );
}

class CopyLink extends Component {
  onCopyClick = event => {
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
          ref={input => (this.input = input)}
          className="form-control"
          defaultValue={shareURL}
        />
        <span className="input-group-btn">
          <button
            className="btn btn-default"
            type="button"
            onClick={this.onCopyClick}>
            <i className="glyphicon glyphicon-copy" />
          </button>
        </span>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    // initialize state with Simple data sample
    const { schema, uiSchema, formData, validate } = samples.Simple;
    this.state = {
      form: false,
      schema,
      uiSchema,
      formData,
      validate,
      theme: "default",
      liveSettings: {
        validate: true,
        disable: false,
        omitExtraData: false,
        liveOmit: false,
      },
      shareURL: null,
      formComponent: Form
    };
  }

  componentDidMount() {
    const hash = document.location.hash.match(/#(.*)/);
    if (hash && typeof hash[1] === "string" && hash[1].length > 0) {
      try {
        this.load(JSON.parse(atob(hash[1])));
      } catch (err) {
        alert("Unable to load form setup data.");
      }
    } else {
      this.load(samples.Simple);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  load = data => {
    // Reset the ArrayFieldTemplate whenever you load new data
    const { ArrayFieldTemplate, ObjectFieldTemplate, extraErrors } = data;
    // uiSchema is missing on some examples. Provide a default to
    // clear the field in all cases.
    const { uiSchema = {} } = data;
    // force resetting form component instance
    this.setState({ form: false }, _ =>
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

  onSchemaEdited = schema => this.setState({ schema, shareURL: null });

  onUISchemaEdited = uiSchema => this.setState({ uiSchema, shareURL: null });

  onFormDataEdited = formData => this.setState({ formData, shareURL: null });

  onExtraErrorsEdited = extraErrors =>
    this.setState({ extraErrors, shareURL: null });

  onThemeSelected = (theme, { stylesheet, formComponent, editor }) => {
    this.setState({ theme, formComponent, editor: editor ? editor : "default" });
    setImmediate(() => {
      // Side effect!
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  };

  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });

  onFormDataChange = ({ formData }) =>
    this.setState({ formData, shareURL: null });

  onShare = () => {
    const {
      formData,
      schema,
      uiSchema,
      liveSettings,
      errorSchema,
    } = this.state;
    const {
      location: { origin, pathname },
    } = document;
    try {
      const hash = btoa(
        JSON.stringify({
          formData,
          schema,
          uiSchema,
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
      FormComponent,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
    } = this.state;

    return (
      <div className="container-fluid">
        <div className="page-header">
          <h1>react-jsonschema-form</h1>
          <div className="row">
            <div className="col-sm-8">
              <Selector onSelected={this.load} />
            </div>
            <div className="col-sm-2">
              <FormComponent
                schema={liveSettingsSchema}
                formData={liveSettings}
                onChange={this.setLiveSettings}>
                <div />
              </FormComponent>
            </div>
            <div className="col-sm-2">
              <ThemeSelector theme={theme} select={this.onThemeSelected}
                FormComponent={FormComponent}
              />
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
          {this.state.form && (
            <FormComponent
              ArrayFieldTemplate={ArrayFieldTemplate}
              ObjectFieldTemplate={ObjectFieldTemplate}
              liveValidate={liveSettings.validate}
              disabled={liveSettings.disable}
              omitExtraData={liveSettings.omitExtraData}
              liveOmit={liveSettings.liveOmit}
              schema={schema}
              uiSchema={uiSchema}
              formData={formData}
              extraErrors={extraErrors}
              onChange={this.onFormDataChange}
              onSubmit={({ formData }, e) => {
                console.log("submitted formData", formData);
                console.log("submit event", e);
              }}
              fields={{ geo: GeoPosition }}
              validate={validate}
              onBlur={(id, value) =>
                console.log(`Touched ${id} with value ${value}`)
              }
              onFocus={(id, value) =>
                console.log(`Focused ${id} with value ${value}`)
              }
              transformErrors={transformErrors}
              onError={log("errors")}>
              <div className="row">
                <div className="col-sm-3">
                  <button className="btn btn-primary" type="submit">
                    Submit
                  </button>
                </div>
                <div className="col-sm-9 text-right">
                  <CopyLink
                    shareURL={this.state.shareURL}
                    onShare={this.onShare}
                  />
                </div>
              </div>
            </FormComponent>
          )}
        </div>
        <div className="col-sm-12">
          <p style={{ textAlign: "center" }}>
            Powered by{" "}
            <a href="https://github.com/mozilla-services/react-jsonschema-form">
              react-jsonschema-form
            </a>
            . Bootstrap themes courtesy of{" "}
            <a href="http://bootswatch.com/">Bootswatch</a> and{" "}
            <a href="https://github.com/aalpern/bootstrap-solarized/">
              bootstrap-solarized
            </a>
            . Bootstrap version v3.3.6.
            {process.env.SHOW_NETLIFY_BADGE === "true" && (
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

render(<App />, document.getElementById("app"));
