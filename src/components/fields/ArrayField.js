import React, { Component, PropTypes } from "react";

import {
  getDefaultFormState,
  isMultiSelect,
  optionsList,
  retrieveSchema,
  shouldRender
} from "../../utils";
import SelectWidget from "./../widgets/SelectWidget";


class ArrayField extends Component {
  static defaultProps = {
    uiSchema: {}
  };

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
    // Caching bound instance methods for rendering perf optimization.
    this._onSelectChange = this.onSelectChange.bind(this);
    this._onChange = this.onChange.bind(this);
    this._onChangeForIndex = (index) => this._onChange.bind(this, index);
    this._onDropClick = this.onDropClick.bind(this);
    this._onDropIndexClick = (index) => this._onDropClick.bind(this, index);
    this._onAddClick = this.onAddClick.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    const formData = Array.isArray(props.formData) ? props.formData : null;
    const {definitions} = this.props.registry;
    return {
      items: getDefaultFormState(props.schema, formData, definitions) || []
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  get itemTitle() {
    const {schema} = this.props;
    return schema.items.title || schema.items.description || "Item";
  }

  isItemRequired(itemsSchema) {
    return itemsSchema.type === "string" && itemsSchema.minLength > 0;
  }

  asyncSetState(state, options) {
    // ensure state is propagated to parent component when it's actually set
    this.setState(state, _ => this.props.onChange(this.state.items, options));
  }

  onAddClick(event) {
    event.preventDefault();
    const {items} = this.state;
    const {schema, registry} = this.props;
    const {definitions} = registry;
    this.asyncSetState({
      items: items.concat(getDefaultFormState(schema.items, undefined, definitions))
    }, {validate: false});
  }

  onDropClick(index, event) {
    event.preventDefault();
    this.asyncSetState({
      items: this.state.items.filter((_, i) => i !== index)
    }, {validate: false});
  }

  onChange(index, value) {
    this.asyncSetState({
      items: this.state.items.map((item, i) => {
        return index === i ? value : item;
      })
    }, {validate: false});
  }

  onSelectChange(value) {
    this.asyncSetState({items: value}, {validate: false});
  }

  render() {
    const {schema, uiSchema, name} = this.props;
    const title = schema.title || name;
    const {items} = this.state;
    const {fields, definitions} = this.props.registry;
    const {SchemaField} = fields;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    if (isMultiSelect(schema)) {
      return (
        <SelectWidget
          multiple
          onChange={this._onSelectChange}
          options={optionsList(itemsSchema)}
          schema={schema}
          title={title}
          defaultValue={schema.default}
          value={items}
        />
      );
    }

    return (
      <fieldset
        className={`field field-array field-array-of-${itemsSchema.type}`}>
        {title ? <legend>{title}</legend> : null}
        {schema.description ?
          <div className="field-description">{schema.description}</div> : null}
        <div className="array-item-list">{
          items.map((item, index) => {
            return (
              <div key={index}>
                <SchemaField
                  schema={itemsSchema}
                  uiSchema={uiSchema.items}
                  formData={items[index]}
                  required={this.isItemRequired(itemsSchema)}
                  onChange={this._onChangeForIndex(index)}
                  registry={this.props.registry}/>
                <p className="array-item-remove">
                  <button type="button"
                    onClick={this._onDropIndexClick(index)}>-</button></p>
              </div>
            );
          })
        }</div>
        <p className="array-item-add">
          <button type="button" onClick={this._onAddClick}>+</button>
        </p>
      </fieldset>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  ArrayField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.array,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.func).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
    })
  };
}

export default ArrayField;
