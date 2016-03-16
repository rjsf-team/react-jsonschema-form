import React, { Component, PropTypes } from "react";

import { getDefaultFormState, isMultiSelect, optionsList } from "../../utils";
import SelectWidget from "./../widgets/SelectWidget";


class ArrayField extends Component {
  static defaultProps = {
    uiSchema: {}
  };

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    const formData = Array.isArray(props.formData) ? props.formData : null;
    return {items: getDefaultFormState(props.schema, formData) || []};
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
    const {schema} = this.props;
    this.asyncSetState({
      items: items.concat(getDefaultFormState(schema.items))
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
    const {SchemaField} = this.props.registry;
    if (isMultiSelect(schema)) {
      return (
        <SelectWidget
          multiple
          onChange={this.onSelectChange.bind(this)}
          options={optionsList(schema.items)}
          schema={schema}
          title={title}
          defaultValue={schema.default}
          value={items}
        />
      );
    }

    return (
      <fieldset
        className={`field field-array field-array-of-${schema.items.type}`}>
        {title ? <legend>{title}</legend> : null}
        {schema.description ?
          <div className="field-description">{schema.description}</div> : null}
        <div className="array-item-list">{
          items.map((item, index) => {
            return (
              <div key={index}>
                <SchemaField
                  schema={schema.items}
                  uiSchema={uiSchema.items}
                  formData={items[index]}
                  required={this.isItemRequired(schema.items)}
                  onChange={this.onChange.bind(this, index)}
                  registry={this.props.registry}/>
                <p className="array-item-remove">
                  <button type="button"
                    onClick={this.onDropClick.bind(this, index)}>-</button></p>
              </div>
            );
          })
        }</div>
        <p className="array-item-add">
          <button type="button" onClick={this.onAddClick.bind(this)}>+</button>
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
      SchemaField: PropTypes.func.isRequired,
      TitleField: PropTypes.func.isRequired
    })
  };
}

export default ArrayField;
