import React, { Component } from "react";
import { render } from "react-dom";
import Codemirror from "react-codemirror";
import "codemirror/mode/javascript/javascript";

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

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {valid: true, code: props.code, data: fromJson(props.code)};
  }

  componentWillReceiveProps(props) {
    this.setState({code: props.code, data: fromJson(props.code)});
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
    return (
      <fieldset>
        <legend>
          <span className={`glyphicon glyphicon-${icon}`} />
          {" "}
          {title}
        </legend>
        <Codemirror
          value={this.state.code}
          onChange={this.onCodeChange.bind(this)}
          options={cmOptions} />
      </fieldset>
    );
  }
}

class Selector extends Component {
  constructor(props) {
    super(props);
    this.state = {current: "Simple"};
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
                onClick={this.onClick.bind(this, label, samples[label])}>
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
  }

  componentDidMount() {
    this.setState({...samples.Simple, form: true});
  }

  load(data) {
    // force resetting form component instance
    this.setState({form: false},
      _ => this.setState({...data, form: true}));
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="page-header">
          <h1>react-jsonschema-form</h1>
          <Selector onSelected={this.load.bind(this)} />
        </div>
        <div className="col-md-6">
          <Editor title="JSONSchema"
            code={toJson(this.state.schema)}
            onChange={schema => this.setState({schema})} />
          <div className="row">
            <div className="col-md-6">
              <Editor title="UISchema"
                code={toJson(this.state.uiSchema)}
                onChange={uiSchema => this.setState({uiSchema})} />
            </div>
            <div className="col-md-6">
              <Editor title="formData"
                code={toJson(this.state.formData)}
                onChange={formData => this.setState({formData})} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          {!this.state.form ? null :
            <Form
              schema={this.state.schema}
              uiSchema={this.state.uiSchema}
              formData={this.state.formData}
              onChange={data => this.setState({formData: data.formData})}
              onSubmit={data => this.setState({formData: data.formData})}
              onError={log("errors")} />}
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById("app"));
