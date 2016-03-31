import React, { Component, PropTypes } from "react";

import {
  getDefaultFormState,
  isMultiSelect,
  optionsList,
  retrieveSchema,
  toIdSchema,
  shouldRender
} from "../../utils";
import SelectWidget from "./../widgets/SelectWidget";


class ArrayField extends Component {
  static defaultProps = {
    uiSchema: {},
    idSchema: {},
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

  onAddClick = (event) => {
    event.preventDefault();
    const {items} = this.state;
    const {schema, registry} = this.props;
    const {definitions} = registry;
    this.asyncSetState({
      items: items.concat([getDefaultFormState(schema.items, undefined, definitions)])
    }, {validate: false});
  };

  onDropIndexClick = (index) => {
    return (event) => {
      event.preventDefault();
      this.asyncSetState({
        items: this.state.items.filter((_, i) => i !== index)
      }, {validate: false});
    };
  };

  onChangeForIndex = (index) => {
    return (value) => {
      this.asyncSetState({
        items: this.state.items.map((item, i) => {
          return index === i ? value : item;
        })
      }, {validate: false});
    };
  };

  onSelectChange = (value) => {
    this.asyncSetState({items: value}, {validate: false});
  };

  render() {
    const {schema, uiSchema, errorSchema, idSchema, name} = this.props;
    const title = schema.title || name;
    const {items} = this.state;
    const {fields, definitions} = this.props.registry;
    const {SchemaField} = fields;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    if (isMultiSelect(schema)) {
      return (
        <SelectWidget
          id={idSchema && idSchema.id}
          multiple
          onChange={this.onSelectChange}
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
        <div className="row array-item-list">{
          items.map((item, index) => {
            const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
            const itemIdPrefix = idSchema.id + "_" + index;
            const itemIdSchema = toIdSchema(itemsSchema, itemIdPrefix, definitions);
            return (
              <div key={index}>
                <div className="col-xs-10">
                  <SchemaField
                    schema={itemsSchema}
                    uiSchema={uiSchema.items}
                    formData={items[index]}
                    errorSchema={itemErrorSchema}
                    idSchema={itemIdSchema}
                    required={this.isItemRequired(itemsSchema)}
                    onChange={this.onChangeForIndex(index)}
                    registry={this.props.registry}/>
                </div>
                <div className="col-xs-2 array-item-remove text-right">
                  <button type="button" className="btn btn-danger col-xs-12"
                    onClick={this.onDropIndexClick(index)}>Delete</button>
                </div>
              </div>
            );
          })
        }</div>
        <div className="row">
          <p className="col-xs-2 col-xs-offset-10 array-item-add text-right">
            <button type="button" className="btn btn-info col-xs-12"
              onClick={this.onAddClick}>Add</button>
          </p>
        </div>
      </fieldset>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  ArrayField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    errorSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.array,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.func).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
    })
  };
}

export default ArrayField;
