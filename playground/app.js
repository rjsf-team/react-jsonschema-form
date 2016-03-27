import React, { Component } from "react";
import { render } from "react-dom";
import Codemirror from "react-codemirror";
import "codemirror/mode/javascript/javascript";

import { shouldRender } from "../src/utils";
import { samples } from "./samples";
import Form from "../src";

// Import a few CodeMirror themes; these are used to match alternative
// bootstrap ones.
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/blackboard.css";
import "codemirror/theme/mbo.css";
import "codemirror/theme/ttcn.css";
import "codemirror/theme/solarized.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/eclipse.css";

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
const themes = {
  default: {
    stylesheet: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css"
  },
  cerulean: {
    stylesheet: "http://bootswatch.com/cerulean/bootstrap.min.css"
  },
  cosmo: {
    stylesheet: "http://bootswatch.com/cosmo/bootstrap.min.css"
  },
  cyborg: {
    stylesheet: "http://bootswatch.com/cyborg/bootstrap.min.css",
    editor: "blackboard",
  },
  darkly: {
    stylesheet: "http://bootswatch.com/darkly/bootstrap.min.css",
    editor: "mbo",
  },
  flatly: {
    stylesheet: "http://bootswatch.com/flatly/bootstrap.min.css",
    editor: "ttcn",
  },
  journal: {
    stylesheet: "http://bootswatch.com/journal/bootstrap.min.css"
  },
  lumen: {
    stylesheet: "http://bootswatch.com/lumen/bootstrap.min.css"
  },
  paper: {
    stylesheet: "http://bootswatch.com/paper/bootstrap.min.css"
  },
  readable: {
    stylesheet: "http://bootswatch.com/readable/bootstrap.min.css"
  },
  sandstone: {
    stylesheet: "http://bootswatch.com/sandstone/bootstrap.min.css",
    editor: "solarized",
  },
  simplex: {
    stylesheet: "http://bootswatch.com/simplex/bootstrap.min.css",
    editor: "ttcn",
  },
  slate: {
    stylesheet: "http://bootswatch.com/slate/bootstrap.min.css",
    editor: "monokai",
  },
  spacelab: {
    stylesheet: "http://bootswatch.com/spacelab/bootstrap.min.css"
  },
  "solarized-dark": {
    stylesheet: "https://cdn.rawgit.com/aalpern/bootstrap-solarized/master/bootstrap-solarized-dark.css",
    editor: "dracula",
  },
  "solarized-light": {
    stylesheet: "https://cdn.rawgit.com/aalpern/bootstrap-solarized/master/bootstrap-solarized-light.css",
    editor: "solarized",
  },
  superhero: {
    stylesheet: "http://bootswatch.com/superhero/bootstrap.min.css",
    editor: "dracula",
  },
  united: {
    stylesheet: "http://bootswatch.com/united/bootstrap.min.css"
  },
  yeti: {
    stylesheet: "http://bootswatch.com/yeti/bootstrap.min.css",
    editor: "eclipse",
  },
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
        schema.</p>
        <div className="row">
          <div className="col-sm-6">
            <label>Latitude</label>
            <input className="form-control" type="number" value={lat} step="0.00001"
              onChange={this.onChange("lat")} />
          </div>
          <div className="col-sm-6">
            <label>Longitude</label>
            <input className="form-control" type="number" value={lon} step="0.00001"
              onChange={this.onChange("lon")} />
          </div>
        </div>
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
    const {title, theme} = this.props;
    const icon = this.state.valid ? "ok" : "remove";
    const cls = this.state.valid ? "valid" : "invalid";
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <span className={`${cls} glyphicon glyphicon-${icon}`} />
          {" "}
          {title}
        </div>
        <Codemirror
          value={this.state.code}
          onChange={this._onCodeChange}
          options={Object.assign({}, cmOptions, {theme})} />
      </div>
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

function ThemeSelector({theme, select}) {
  const themeSchema = {
    type: "string",
    enum: Object.keys(themes)
  };
  return (
    <Form schema={themeSchema}
          formData={theme}
          onChange={({formData}) => select(formData, themes[formData])}>
      <div/>
    </Form>
  );
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      form: false,
      schema: {},
      uiSchema: {},
      formData: {},
      editor: "default",
      theme: "default",
    };
    this._onSchemaChange = this.onSchemaChange.bind(this);
    this._onUISchemaChange = this.onUISchemaChange.bind(this);
    this._onFormDataChange = this.onFormDataChange.bind(this);
    this._onThemeSelected = this.onThemeSelected.bind(this);
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

  onThemeSelected(theme, {stylesheet, editor}) {
    // Side effect!
    this.setState({theme, editor: editor ? editor : "default"}, _ => {
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  }

  render() {
    const {theme} = this.state;
    return (
      <div className="container-fluid">
        <div className="page-header">
          <h1>react-jsonschema-form</h1>
          <div className="row">
            <div className="col-sm-10">
              <Selector onSelected={this.load.bind(this)} />
            </div>
            <div className="col-sm-2">
              <ThemeSelector theme={theme} select={this._onThemeSelected} />
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <Editor title="JSONSchema"
            theme={this.state.editor}
            code={toJson(this.state.schema)}
            onChange={this._onSchemaChange} />
          <div className="row">
            <div className="col-sm-6">
              <Editor title="UISchema"
                theme={this.state.editor}
                code={toJson(this.state.uiSchema)}
                onChange={this._onUISchemaChange} />
            </div>
            <div className="col-sm-6">
              <Editor title="formData"
                theme={this.state.editor}
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
