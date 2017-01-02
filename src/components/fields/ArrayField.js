import React, {Component, PropTypes} from "react";

import {
  getWidget,
  getDefaultFormState,
  getUiOptions,
  isMultiSelect,
  isFilesArray,
  isFixedItems,
  allowAdditionalItems,
  optionsList,
  retrieveSchema,
  toIdSchema,
  shouldRender,
  getDefaultRegistry,
  setState
} from "../../utils";

function ArrayFieldTitle({TitleField, idSchema, title, required}) {
  if (!title) {
    // See #312: Ensure compatibility with old versions of React.
    return <div/>;
  }
  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required}/>;
}

function ArrayFieldDescription({DescriptionField, idSchema, description}) {
  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return <div/>;
  }
  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description}/>;
}

function IconBtn(props) {
  const {type="default", icon, className, ...otherProps} = props;
  return (
    <button type="button" className={`btn btn-${type} ${className}`} {...otherProps}>
      <i className={`glyphicon glyphicon-${icon}`}/>
    </button>
  );
}

class ArrayField extends Component {
  static defaultProps = {
    uiSchema: {},
    idSchema: {},
    registry: getDefaultRegistry(),
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
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

  asyncSetState(state, options={validate: false}) {
    setState(this, state, () => {
      this.props.onChange(this.state.items, options);
    });
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
      items: items.concat([
        getDefaultFormState(itemSchema, undefined, definitions)
      ])
    });
  };

  onDropIndexClick = (index) => {
    return (event) => {
      event.preventDefault();
      this.asyncSetState({
        items: this.state.items.filter((_, i) => i !== index)
      }, {validate: true}); // refs #195
    };
  };

  onReorderClick = (index, newIndex) => {
    return (event) => {
      event.preventDefault();
      event.target.blur();
      const {items} = this.state;
      this.asyncSetState({
        items: items.map((item, i) => {
          if (i === newIndex) {
            return items[index];
          } else if (i === index) {
            return items[newIndex];
          } else {
            return item;
          }
        })
      }, {validate: true});
    };
  };

  onChangeForIndex = (index) => {
    return (value) => {
      this.asyncSetState({
        items: this.state.items.map((item, i) => {
          return index === i ? value : item;
        })
      });
    };
  };

  onSelectChange = (value) => {
    this.asyncSetState({items: value});
  };

  render() {
    const {schema, uiSchema} = this.props;
    if (isFilesArray(schema, uiSchema)) {
      return this.renderFiles();
    }
    if (isFixedItems(schema)) {
      return this.renderFixedArray();
    }
    if (isMultiSelect(schema)) {
      return this.renderMultiSelect();
    }
    return this.renderNormalArray();
  }

  renderNormalArray() {
    const {
      schema,
      uiSchema,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
    } = this.props;
    const title = (schema.title === undefined) ? name : schema.title;
    const {items} = this.state;
    const {definitions, fields} = this.props.registry;
    const {TitleField, DescriptionField} = fields;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    const {addable=true} = getUiOptions(uiSchema);

    return (
      <fieldset
        className={`field field-array field-array-of-${itemsSchema.type}`}>
        <ArrayFieldTitle
          TitleField={TitleField}
          idSchema={idSchema}
          title={title}
          required={required}/>
        {schema.description ?
          <ArrayFieldDescription
            DescriptionField={DescriptionField}
            idSchema={idSchema}
            description={schema.description}/> : null}
        <div className="row array-item-list">{
          items.map((item, index) => {
            const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
            const itemIdPrefix = idSchema.$id + "_" + index;
            const itemIdSchema = toIdSchema(itemsSchema, itemIdPrefix, definitions);
            return this.renderArrayFieldItem({
              index,
              canMoveUp: index > 0,
              canMoveDown: index < items.length - 1,
              itemSchema: itemsSchema,
              itemIdSchema,
              itemErrorSchema,
              itemData: items[index],
              itemUiSchema: uiSchema.items,
              autofocus: autofocus && index === 0
            });
          })
        }</div>
        {addable ? <AddButton
                     onClick={this.onAddClick}
                     disabled={disabled || readonly}/> : null}
      </fieldset>
    );
  }

  renderMultiSelect() {
    const {schema, idSchema, uiSchema, disabled, readonly, autofocus} = this.props;
    const {items} = this.state;
    const {widgets, definitions} = this.props.registry;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    const enumOptions = optionsList(itemsSchema);
    const {widget="select", ...options} = {...getUiOptions(uiSchema), enumOptions};
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        id={idSchema && idSchema.$id}
        multiple
        onChange={this.onSelectChange}
        options={options}
        schema={schema}
        value={items}
        disabled={disabled}
        readonly={readonly}
        autofocus={autofocus}/>
    );
  }

  renderFiles() {
    const {schema, uiSchema, idSchema, name, disabled, readonly, autofocus} = this.props;
    const title = schema.title || name;
    const {items} = this.state;
    const {widgets} = this.props.registry;
    const {widget="files", ...options} = getUiOptions(uiSchema);
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        options={options}
        id={idSchema && idSchema.$id}
        multiple
        onChange={this.onSelectChange}
        schema={schema}
        title={title}
        value={items}
        disabled={disabled}
        readonly={readonly}
        autofocus={autofocus}/>
    );
  }

  renderFixedArray() {
    const {
      schema,
      uiSchema,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
    } = this.props;
    const title = schema.title || name;
    let {items} = this.state;
    const {definitions, fields} = this.props.registry;
    const {TitleField} = fields;
    const itemSchemas = schema.items.map(item =>
      retrieveSchema(item, definitions));
    const additionalSchema = allowAdditionalItems(schema) ?
      retrieveSchema(schema.additionalItems, definitions) : null;
    const {addable=true} = getUiOptions(uiSchema);
    const canAdd = addable && additionalSchema;

    if (!items || items.length < itemSchemas.length) {
      // to make sure at least all fixed items are generated
      items = items || [];
      items = items.concat(new Array(itemSchemas.length - items.length));
    }

    return (
      <fieldset className="field field-array field-array-fixed-items">
        <ArrayFieldTitle
          TitleField={TitleField}
          idSchema={idSchema}
          title={title}
          required={required}/>
        {schema.description ?
          <div className="field-description">{schema.description}</div> : null}
        <div className="row array-item-list">{
          items.map((item, index) => {
            const additional = index >= itemSchemas.length;
            const itemSchema = additional ?
              additionalSchema : itemSchemas[index];
            const itemIdPrefix = idSchema.$id + "_" + index;
            const itemIdSchema = toIdSchema(itemSchema, itemIdPrefix, definitions);
            const itemUiSchema = additional ?
              uiSchema.additionalItems || {} :
              Array.isArray(uiSchema.items) ?
                uiSchema.items[index] : uiSchema.items || {};
            const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;

            return this.renderArrayFieldItem({
              index,
              canRemove: additional,
              canMoveUp: index >= itemSchemas.length + 1,
              canMoveDown: additional && index < items.length - 1,
              itemSchema,
              itemData: item,
              itemUiSchema,
              itemIdSchema,
              itemErrorSchema,
              autofocus: autofocus && index === 0
            });
          })
        }</div>
        {
          canAdd ? <AddButton
                               onClick={this.onAddClick}
                               disabled={disabled || readonly}/> : null
        }
      </fieldset>
    );
  }

  renderArrayFieldItem({
    index,
    canRemove=true,
    canMoveUp=true,
    canMoveDown=true,
    itemSchema,
    itemData,
    itemUiSchema,
    itemIdSchema,
    itemErrorSchema,
    autofocus
  }) {
    const {SchemaField} = this.props.registry.fields;
    const {disabled, readonly, uiSchema} = this.props;
    const {orderable, removable} = {
      orderable: true,
      removable: true,
      ...uiSchema["ui:options"]
    };
    const has = {
      moveUp: orderable && canMoveUp,
      moveDown: orderable && canMoveDown,
      remove: removable && canRemove
    };
    has.toolbar = Object.keys(has).some(key => has[key]);
    const btnStyle = {flex: 1, paddingLeft: 6, paddingRight: 6, fontWeight: "bold"};

    return (
      <div key={index} className="array-item">
        <div className={has.toolbar ? "col-xs-9" : "col-xs-12"}>
          <SchemaField
            schema={itemSchema}
            uiSchema={itemUiSchema}
            formData={itemData}
            errorSchema={itemErrorSchema}
            idSchema={itemIdSchema}
            required={this.isItemRequired(itemSchema)}
            onChange={this.onChangeForIndex(index)}
            registry={this.props.registry}
            disabled={this.props.disabled}
            readonly={this.props.readonly}
            autofocus={autofocus}/>
        </div>
        {
          has.toolbar ?
            <div className="col-xs-3 array-item-toolbox">
              <div className="btn-group" style={{display: "flex", justifyContent: "space-around"}}>
                {has.moveUp || has.moveDown ?
                  <IconBtn icon="arrow-up" className="array-item-move-up"
                          tabIndex="-1"
                          style={btnStyle}
                          disabled={disabled || readonly || !has.moveUp}
                          onClick={this.onReorderClick(index, index - 1)}/>
                  : null}
                {has.moveUp || has.moveDown ?
                  <IconBtn icon="arrow-down" className="array-item-move-down"
                          tabIndex="-1"
                          style={btnStyle}
                          disabled={disabled || readonly || !has.moveDown}
                          onClick={this.onReorderClick(index, index + 1)}/>
                  : null}
                {has.remove ?
                  <IconBtn type="danger" icon="remove" className="array-item-remove"
                          tabIndex="-1"
                          style={btnStyle}
                          disabled={disabled || readonly}
                          onClick={this.onDropIndexClick(index)}/>
                  : null}
              </div>
            </div>
          : null
        }
      </div>
    );
  }
}

function AddButton({onClick, disabled}) {
  return (
    <div className="row">
      <p className="col-xs-3 col-xs-offset-9 array-item-add text-right">
        <IconBtn type="info" icon="plus" className="btn-add col-xs-12"
                 tabIndex="0" onClick={onClick}
                 disabled={disabled}/>
      </p>
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  ArrayField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.shape({
      "ui:options": PropTypes.shape({
        addable: PropTypes.bool,
        orderable: PropTypes.bool,
        removable: PropTypes.bool
      })
    }),
    idSchema: PropTypes.object,
    errorSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.array,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
      ])).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      formContext: PropTypes.object.isRequired
    }),
  };
}

export default ArrayField;
