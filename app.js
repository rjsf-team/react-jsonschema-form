const schema = {
  title: "Todo Tasks",
  type: "object",
  required: ["title"],
  properties: {
    title: {type: "string", title: "Title", default: "A new task"},
    done: {type: "boolean", title: "Done?", default: false}
  }
};

const uiSchema = {
  done: {
    widget: "radio"
  }
};

const formData = {
  title: "My task",
  done: false
};

const cmOptions = {
  theme: "default",
  mode: {
    name: "javascript",
    json: true,
    statementIndent: 2,
  },
  lineNumbers: true,
  indentWithTabs: false,
  tabSize: 2,
};

const log = (type) => console.log.bind(console, type);
const fromJson = (json) => JSON.parse(json);
const toJson = (val) => JSON.stringify(val, null, 2);

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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {schema, uiSchema, formData};
  }

  render() {
    return (
      <div>
        <div className="editor col-md-6">
          <Editor title="JSONSchema"
            code={toJson(this.state.schema)}
            onChange={schema => this.setState({schema})} />
          <div>
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
          <JSONSchemaForm
            schema={this.state.schema}
            uiSchema={this.state.uiSchema}
            formData={this.state.formData}
            onChange={data => this.setState({formData: data.formData})}
            onSubmit={data => this.setState({formData: data.formData})}
            onError={log("errors")} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
