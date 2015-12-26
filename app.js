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
const samples = {
  Simple: "simple.json",
  Nested: "nested.json",
  Widgets: "widgets.json",
  Arrays: "arrays.json",
};

function loadSample(url) {
  return fetch(url)
    .then(res => res.json());
}

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {valid: true, code: props.code, data: fromJson(props.code)}
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
    const  {title, code} = this.props;
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

class Selector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {current: "Simple", loading: null};
  }

  onClick(label, url, event) {
    event.preventDefault();
    this.setState({loading: label});
    this.props.onLoading();
    loadSample(url)
      .then(data => {
        this.setState({current: label, loading: null});
        this.props.onLoaded(data);
      });
  }

  render() {
    return (
      <ul className="nav nav-pills">{
        Object.keys(samples).map((label, i) => {
          return (
            <li role="presentation"
              className={this.state.current === label ? "active" : ""}>
              <a href={samples[label]}
                onClick={this.onClick.bind(this, label, samples[label])}>
                {this.state.loading === label ? "Loading..." : label}
              </a>
            </li>
          );
        })
      }</ul>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loading: false, schema: {}, uiSchema: {}, formData: {}};
  }

  componentDidMount() {
    this.setState({loading: true});
    loadSample("simple.json")
      .then(data => this.loaded(data));
  }

  loaded(data) {
    this.setState(Object.assign({}, data, {loading: false}));
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="page-header">
          <h1>react-jsonschema-form</h1>
          <Selector
            onLoading={_ => this.setState({loading: true})}
            onLoaded={(data) => this.loaded(data)} />
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
          {this.state.loading ? null :
            <JSONSchemaForm
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

ReactDOM.render(<App />, document.getElementById("app"));
