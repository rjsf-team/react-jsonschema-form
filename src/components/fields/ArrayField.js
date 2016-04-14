import React, { Component, PropTypes } from "react";

import {
  getDefaultFormState,
  isMultiSelect,
  isFixedItems,
  allowAdditionalItems,
  optionsList,
  retrieveSchema,
  toIdSchema,
  shouldRender,
  getDefaultRegistry
} from "../../utils";
import SelectWidget from "./../widgets/SelectWidget";


class ArrayField extends Component {
  static defaultProps = {
    uiSchema: {},
    idSchema: {},
    registry: getDefaultRegistry(),
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
    let itemSchema = schema.items;
    if (isFixedItems(schema) && allowAdditionalItems(schema)) {
      itemSchema = schema.additionalItems;
    }
    this.asyncSetState({
      items: items.concat([getDefaultFormState(itemSchema, undefined, definitions)])
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
    const {schema} = this.props;
    if (isFixedItems(schema)) {
      return this.renderFixedArray();
    }
    if (isMultiSelect(schema)) {
      return this.renderMultiSelect();
    }
    return this.renderNormalArray();
  }

  renderNormalArray() {
    const {schema, uiSchema, errorSchema, idSchema, name} = this.props;
    const title = schema.title || name;
    const {items} = this.state;
    const {definitions} = this.props.registry;
    const itemsSchema = retrieveSchema(schema.items, definitions);

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
            return this.renderArrayFieldItem({
              index,
              itemSchema: itemsSchema,
              itemIdSchema,
              itemErrorSchema,
              itemData: items[index],
              itemUiSchema: uiSchema.items
            });
          })
        }</div>
        <AddButton onClick={this.onAddClick}/>
      </fieldset>
    );
  }

  renderMultiSelect() {
    const {schema, idSchema, name} = this.props;
    const title = schema.title || name;
    const {items} = this.state;
    const {definitions} = this.props.registry;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    return (
      <SelectWidget
        id={idSchema && idSchema.id}
        multiple
        onChange={this.onSelectChange}
        options={optionsList(itemsSchema)}
        schema={schema}
        title={title}
        value={items}
      />
    );
  }

  renderFixedArray() {
    const {schema, uiSchema, errorSchema, idSchema, name} = this.props;
    const title = schema.title || name;
    let {items} = this.state;
    const {definitions} = this.props.registry;
    const itemSchemas = schema.items.map(item =>
      retrieveSchema(item, definitions));
    const additionalSchema = allowAdditionalItems(schema) ?
      retrieveSchema(schema.additionalItems, definitions) : null;

    if (!items || items.length < itemSchemas.length) {
      // to make sure at least all fixed items are generated
      items = items || [];
      items = items.concat(new Array(itemSchemas.length - items.length));
    }

    return (
      <fieldset className="field field-array field-array-fixed-items">
        {title ? <legend>{title}</legend> : null}
        {schema.description ?
          <div className="field-description">{schema.description}</div> : null}
        <div className="row array-item-list">{
          items.map((item, index) => {
            const additional = index >= itemSchemas.length;
            const itemSchema = additional ?
              additionalSchema : itemSchemas[index];
            const itemIdPrefix = idSchema.id + "_" + index;
            const itemIdSchema = toIdSchema(itemSchema, itemIdPrefix, definitions);
            const itemUiSchema = additional ?
              uiSchema.additionalItems || {} :
              Array.isArray(uiSchema.items) ?
                uiSchema.items[index] : uiSchema.items || {};
            const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;

            return this.renderArrayFieldItem({
              index,
              removable: additional,
              itemSchema,
              itemData: item,
              itemUiSchema,
              itemIdSchema,
              itemErrorSchema
            });
          })
        }</div>
        {
          additionalSchema ? <AddButton onClick={this.onAddClick}/> : null
        }
      </fieldset>
    );
  }

  renderArrayFieldItem({
    index,
    removable=true,
    itemSchema,
    itemData,
    itemUiSchema,
    itemIdSchema,
    itemErrorSchema
  }) {
    const {SchemaField} = this.props.registry.fields;
    return (
      <div key={index}>
        <div className={removable ? "col-xs-10" : "col-xs-12"}>
          <SchemaField
            schema={itemSchema}
            uiSchema={itemUiSchema}
            formData={itemData}
            errorSchema={itemErrorSchema}
            idSchema={itemIdSchema}
            required={this.isItemRequired(itemSchema)}
            onChange={this.onChangeForIndex(index)}
            registry={this.props.registry}/>
        </div>
        {
          removable ?
            <div className="col-xs-2 array-item-remove text-right">
              <button type="button" className="btn btn-danger col-xs-12"
                      tabIndex="-1"
                      onClick={this.onDropIndexClick(index)}>Delete</button>
            </div>
          : null
        }
      </div>
    );
  }
}

function AddButton({onClick}) {
  return (
    <div className="row">
      <p className="col-xs-2 col-xs-offset-10 array-item-add text-right">
        <button type="button" className="btn btn-info col-xs-12"
                tabIndex="-1" onClick={onClick}>Add</button>
      </p>
    </div>
  );
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
      definitions: PropTypes.object.isRequired,
    })
  };
}

export default ArrayField;
