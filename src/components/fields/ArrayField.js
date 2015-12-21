import React, { Component, PropTypes } from "react";

import { defaultTypeValue } from "../../utils";
import SchemaField from "./SchemaField";


export default class ArrayField extends Component {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.array,
  }

  constructor(props) {
    super(props);
    const formData = Array.isArray(props.formData) ? props.formData : null;
    this.state = {items: formData || props.schema.default || []};
  }

  get itemTitle() {
    const {schema} = this.props;
    return schema.items.title || schema.items.description || "Item";
  }

  defaultItem(itemsSchema) {
    if (itemsSchema.default) {
      return itemsSchema.default;
    }
    return defaultTypeValue(itemsSchema.type);
  }

  isItemRequired(itemsSchema) {
    return itemsSchema.type === "string" && itemsSchema.minLength > 0;
  }

  asyncSetState(state) {
    // ensure state is propagated to parent component when it's actually set
    this.setState(state, _ => this.props.onChange(this.state.items));
  }

  onAddClick(event) {
    event.preventDefault();
    this.setState({
      items: this.state.items.concat(this.defaultItem(this.props.schema.items))
    });
  }

  onDropClick(index, event) {
    event.preventDefault();
    this.setState({
      items: this.state.items.filter((_, i) => i !== index)
    });
  }

  onChange(index, value) {
    this.asyncSetState({
      items: this.state.items.map((item, i) => {
        return index === i ? value : item;
      })
    });
  }

  render() {
    const {schema} = this.props;
    const {items} = this.state;
    return (
      <fieldset
        className={`field field-array field-array-of-${schema.items.type}`}>
        <legend>{schema.title}</legend>
        {schema.description ? <div>{schema.description}</div> : null}
        <div className="array-item-list">{
          items.map((item, index) => {
            return <div key={index}>
              <SchemaField schema={schema.items}
                formData={items[index]}
                required={this.isItemRequired(schema.items)}
                onChange={this.onChange.bind(this, index)} />
              <p className="array-item-remove">
                <button type="button"
                  onClick={this.onDropClick.bind(this, index)}>-</button></p>
            </div>;
          })
        }</div>
        <p className="array-item-add">
          <button type="button" onClick={this.onAddClick.bind(this)}>+</button>
        </p>
      </fieldset>
    );
  }
}
