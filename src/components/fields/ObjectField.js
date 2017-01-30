import React, {Component, PropTypes} from "react";

import {deepEquals} from "../../utils";


import {
  getDefaultFormState,
  orderProperties,
  retrieveSchema,
  shouldRender,
  getDefaultRegistry,
  setState
} from "../../utils";


function objectKeysHaveChanged(formData, state) {
  // for performance, first check for lengths
  const newKeys = Object.keys(formData);
  const oldKeys = Object.keys(state);
  if (newKeys.length < oldKeys.length) {
    return true;
  }
  // deep check on sorted keys
  if (!deepEquals(newKeys.sort(), oldKeys.sort())) {
    return true;
  }
  return false;
}

class ObjectField extends Component {
  static defaultProps = {
    uiSchema: {},
    errorSchema: {},
    idSchema: {},
    registry: getDefaultRegistry(),
    required: false,
    disabled: false,
    readonly: false,
  }

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentWillReceiveProps(nextProps) {
    const state = this.getStateFromProps(nextProps);
    const {formData} = nextProps;
    if (formData && objectKeysHaveChanged(formData, this.state)) {
      // We *need* to replace state entirely here has we have received formData
      // holding different keys (so with some removed).
      this.state = state;
      this.forceUpdate();
    } else {
      this.setState(state);
    }
  }

  getStateFromProps(props) {
    const {schema, formData, registry} = props;
    return getDefaultFormState(schema, formData, registry.definitions) || {};
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  isRequired(name) {
    const schema = this.props.schema;
    return Array.isArray(schema.required) &&
      schema.required.indexOf(name) !== -1;
  }

  asyncSetState(state, options={validate: false}) {
    setState(this, state, () => {
      this.props.onChange(this.state, options);
    });
  }

  onPropertyChange = (name) => {
    return (value, options) => {
      this.asyncSetState({[name]: value}, options);
    };
  };

  render() {
    const {
      uiSchema,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      onBlur
    } = this.props;
    const {definitions, fields, formContext} = this.props.registry;
    const {SchemaField, TitleField, DescriptionField} = fields;
    const schema = retrieveSchema(this.props.schema, definitions);
    const title = (schema.title === undefined) ? name : schema.title;
    let orderedProperties;
    try {
      const properties = Object.keys(schema.properties);
      orderedProperties = orderProperties(properties, uiSchema["ui:order"]);
    } catch (err) {
      return (
        <div>
          <p className="config-error" style={{color: "red"}}>
            Invalid {name || "root"} object field configuration:
            <em>{err.message}</em>.
          </p>
          <pre>{JSON.stringify(schema)}</pre>
        </div>
      );
    }
    return (
      <fieldset>
        {title ? <TitleField
                   id={`${idSchema.$id}__title`}
                   title={title}
                   required={required}
                   formContext={formContext}/> : null}
        {schema.description ?
          <DescriptionField
            id={`${idSchema.$id}__description`}
            description={schema.description}
            formContext={formContext}/> : null}
        {
        orderedProperties.map((name, index) => {
          return (
            <SchemaField key={index}
              name={name}
              required={this.isRequired(name)}
              schema={schema.properties[name]}
              uiSchema={uiSchema[name]}
              errorSchema={errorSchema[name]}
              idSchema={idSchema[name]}
              formData={this.state[name]}
              onChange={this.onPropertyChange(name)}
              onBlur={onBlur}
              registry={this.props.registry}
              disabled={disabled}
              readonly={readonly}/>
          );
        })
      }</fieldset>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  ObjectField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    errorSchema: PropTypes.object,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.object,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
      ])).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      formContext: PropTypes.object.isRequired,
    })
  };
}

export default ObjectField;
