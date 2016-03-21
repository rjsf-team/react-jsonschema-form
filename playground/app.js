import React, { Component } from "react";
import { render } from "react-dom";
import Codemirror from "react-codemirror";
import "codemirror/mode/javascript/javascript";

import { shouldRender } from "../src/utils";
import { samples } from "./samples";
import Form from "../src";

import "codemirror/lib/codemirror.css";
import "./styles.css";

const log = (type) => console.log.bind(console, type);
const fromJson = (json) => JSON.parse(json);
const toJson = (val) => JSON.stringify(val, null, 2);
const cmOptions = {
  theme: "default",
  height: "auto",
  viewportMargin: Infinity,
  mode: {
    name: "javascript",
    json: true,
    statementIndent: 2,
  },
  lineNumbers: true,
  lineWrapping: true,
  indentWithTabs: false,
  tabSize: 2,
};

class GeoPosition extends Component {
  constructor(props) {
    super(props);
    this.state = {...props.formData};
  }

  onChange(name) {
    return (event) => {
      this.setState({
        [name]: parseFloat(event.target.value)
      }, () => this.props.onChange(this.state));
    };
  }

  render() {
    const {lat, lon} = this.state;
    return (
      <div className="geo">
        <h3>Hey, I'm a custom component</h3>
        <p>I'm registered as <code>geo</code> and referenced in
        <code>uiSchema</code> as the <code>ui:field</code> to use for this
        shcema.</p>
        <p>
          <label>Lat
            <input type="number" value={lat} step="0.00001"
              onChange={this.onChange("lat")} />
          </label>
          <label>Lon
            <input type="number" value={lon} step="0.00001"
              onChange={this.onChange("lon")} />
          </label>
        </p>
      </div>
    );
  }
}

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {valid: true, code: props.code, data: fromJson(props.code)};
    this._onCodeChange = this.onCodeChange.bind(this);
  }

  componentWillReceiveProps(props) {
    this.setState({code: props.code, data: fromJson(props.code)});
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onCodeChange(code) {
    try {
      this.setState({valid: true, data: fromJson(code), code});
      this.props.onChange(this.state.data);
    } catch(err) {
      this.setState({valid: false, code});
    }
  }

  render() {
    const {title} = this.props;
    const icon = this.state.valid ? "ok" : "remove";
    const cls = this.state.valid ? "valid" : "invalid";
    return (
      <fieldset>
        <legend>
          <span className={`${cls} glyphicon glyphicon-${icon}`} />
          {" "}
          {title}
        </legend>
        <Codemirror
          value={this.state.code}
          onChange={this._onCodeChange}
          options={cmOptions} />
      </fieldset>
    );
  }
}

class Selector extends Component {
  constructor(props) {
    super(props);
    this.state = {current: "Simple"};
    this._onClick = this.onClick.bind(this);
    this._onLabelClick = (label) => this._onClick.bind(this, label, samples[label]);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onClick(label, sampleData, event) {
    event.preventDefault();
    this.setState({current: label});
    this.props.onSelected(sampleData);
  }

  render() {
    return (
      <ul className="nav nav-pills">{
        Object.keys(samples).map((label, i) => {
          return (
            <li key={i} role="presentation"
              className={this.state.current === label ? "active" : ""}>
              <a href="#"
                onClick={this._onLabelClick(label)}>
                {label}
              </a>
            </li>
          );
        })
      }</ul>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {form: false, schema: {}, uiSchema: {}, formData: {}};
    this._onSchemaChange = this.onSchemaChange.bind(this);
    this._onUISchemaChange = this.onUISchemaChange.bind(this);
    this._onFormDataChange = this.onFormDataChange.bind(this);
  }

  componentDidMount() {
    this.setState({...samples.Simple, form: true});
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  load(data) {
    // force resetting form component instance
    this.setState({form: false},
      _ => this.setState({...data, form: true}));
  }

  onSchemaChange(schema) {
    this.setState({schema});
  }

  onUISchemaChange(uiSchema) {
    this.setState({uiSchema});
  }

  onFormDataChange(formData) {
    this.setState({formData});
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="page-header">
          <h1>react-jsonschema-form</h1>
          <Selector onSelected={this.load.bind(this)} />
        </div>
        <div className="col-sm-6">
          <Editor title="JSONSchema"
            code={toJson(this.state.schema)}
            onChange={this._onSchemaChange} />
          <div className="row">
            <div className="col-sm-6">
              <Editor title="UISchema"
                code={toJson(this.state.uiSchema)}
                onChange={this._onUISchemaChange} />
            </div>
            <div className="col-sm-6">
              <Editor title="formData"
                code={toJson(this.state.formData)}
                onChange={this._onFormDataChange} />
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          {!this.state.form ? null :
            <Form
              schema={this.state.schema}
              uiSchema={this.state.uiSchema}
              formData={this.state.formData}
              onChange={data => this.setState({formData: data.formData})}
              onSubmit={data => this.setState({formData: data.formData})}
              fields={{geo: GeoPosition}}
              onError={log("errors")} />}
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById("app"));
