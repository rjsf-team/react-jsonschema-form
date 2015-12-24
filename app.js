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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      valid: true,
      schema,
      schemaJson: JSON.stringify(schema, null, 2),
      uiSchema,
      uiSchemaJson: JSON.stringify(uiSchema, null, 2),
    };
  }

  onJsonSchemaUpdate(schemaJson) {
    try {
      this.setState({
        valid: true,
        schema: JSON.parse(schemaJson, null, 2),
        schemaJson
      });
    } catch(err) {
      this.setState({
        valid: false,
        schemaJson
      });
    }
  }

  onUISchemaJsonUpdate(uiSchemaJson) {
    try {
      this.setState({
        valid: true,
        uiSchema: JSON.parse(uiSchemaJson, null, 2),
        uiSchemaJson
      });
    } catch(err) {
      this.setState({
        valid: false,
        uiSchemaJson
      });
    }
  }

  render() {
    return (
      <div>
        <div className="editor col-md-6">
          <fieldset>
            <legend>JSONSchema</legend>
            <Codemirror
              value={this.state.schemaJson}
              onChange={this.onJsonSchemaUpdate.bind(this)}
              options={cmOptions} />
          </fieldset>
          <fieldset>
            <legend>UISchema</legend>
            <Codemirror
              value={this.state.uiSchemaJson}
              onChange={this.onUISchemaJsonUpdate.bind(this)}
              options={cmOptions} />
          </fieldset>
        </div>
        <div className="col-md-6">
          <JSONSchemaForm
            schema={this.state.schema}
            uiSchema={this.state.uiSchema}
            onChange={log("changed")}
            onSubmit={log("submitted")}
            onError={log("errors")} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
