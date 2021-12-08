/* eslint-disable react/prop-types,react/destructuring-assignment */
import { utils } from '@rjsf/core';
import React from "react";
import { Button, Grid, Segment } from "semantic-ui-react";
import { getSemanticProps, MaybeWrap } from "../util";
import { DefaultFixedArrayFieldTemplate } from './FixedArrayFieldTemplate';
import { DefaultNormalArrayFieldTemplate } from './NormalArrayFieldTemplate';
const { isFixedItems,getDefaultRegistry,
  getUiOptions,
  getWidget,
  isFilesArray,
  isMultiSelect,
  optionsList,
  retrieveSchema, } = utils;


export function ArrayFieldTitle ({ TitleField, idSchema, uiSchema, title })  {
    if (!title) {
      return null;
    }

    const id = `${idSchema.$id}__title`;
    return <TitleField id={id} title={title} options={uiSchema["ui:options"]} />;
}

export function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
    if (!description) {
      // See #312: Ensure compatibility with old versions of React.
      return null;
    }
    const id = `${idSchema.$id}__description`;
    return <DescriptionField id={id} description={description} />;
  }

const gridStyle = vertical => ({
  display: "grid",
  gridTemplateColumns: `1fr ${vertical ? 65 : 110}px`,
});

// checks if its the first array item
function isInitialArrayItem(props) {
  // no underscore because im not sure if we want to import a library here
  const { idSchema } = props.children.props;
  return idSchema.target && idSchema.conditions;
}

// Used in the two templates
export function DefaultArrayItem(props) {
  return (
    <div className="array-item" key={props.key}>
      <MaybeWrap wrap={props.wrapItem} component={Segment}>
        <Grid
          style={
            !isInitialArrayItem(props)
              ? { ...gridStyle(!props.horizontalButtons), alignItems: "center" }
              : gridStyle(!props.horizontalButtons)
          }>
          <Grid.Column width={16} verticalAlign="middle">
            {props.children}
          </Grid.Column>

          {props.hasToolbar && (
            <Grid.Column>
              {(props.hasMoveUp || props.hasMoveDown || props.hasRemove) && (
                <Button.Group size="mini" vertical={!props.horizontalButtons}>
                  {(props.hasMoveUp || props.hasMoveDown) && (
                    <Button
                      icon="angle up"
                      className="array-item-move-up"
                      tabIndex="-1"
                      disabled={
                        props.disabled || props.readOnly || !props.hasMoveUp
                      }
                      onClick={props.onReorderClick(
                        props.index,
                        props.index - 1
                      )}
                    />
                  )}

                  {(props.hasMoveUp || props.hasMoveDown) && (
                    <Button
                      icon="angle down"
                      className="array-item-move-down"
                      tabIndex="-1"
                      disabled={
                        props.disabled || props.readOnly || !props.hasMoveDown
                      }
                      onClick={props.onReorderClick(
                        props.index,
                        props.index + 1
                      )}
                    />
                  )}

                  {props.hasRemove && (
                    <Button
                      icon="trash"
                      className="array-item-remove"
                      tabIndex="-1"
                      disabled={props.disabled || props.readOnly}
                      onClick={props.onDropIndexClick(props.index)}
                    />
                  )}
                </Button.Group>
              )}
            </Grid.Column>
          )}
        </Grid>
      </MaybeWrap>
    </div>
  );
}

function ArrayFieldTemplate(props) {
  const {
    DescriptionField,
    TitleField,
    autofocus,
    canAdd,
    className,
    disabled,
    formContext,
    formData,
    idSchema,
    items,
    label,
    name,
    onAddClick,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    rawErrors,
    readonly,
    registry = getDefaultRegistry(),
    required,
    schema,
    title,
    uiSchema,
  } = props;
  const { fields, rootSchema, widgets } = registry;
  const { UnsupportedField } = fields;
  const { horizontalButtons, wrapItem } = getSemanticProps(props);
  const itemProps = { horizontalButtons, wrapItem };

  const renderFiles = () => {
    const { widget = 'files', ...options } = getUiOptions(uiSchema);

    const Widget = getWidget(schema, widget, widgets);

    return (
      <Widget
        id={idSchema && idSchema.$id}
        options={options}
        multiple
        schema={schema}
        value={formData}
        title={schema.title || name} // Why not props.title?
      />
    );
  };

  const renderMultiSelect = () => {
    const itemsSchema = retrieveSchema(schema.items, rootSchema, formData);
    const enumOptions = optionsList(itemsSchema);
    const { widget = 'select', ...options } = {
      ...getUiOptions(uiSchema),
      enumOptions,
    };

    const Widget = getWidget(schema, widget, widgets);

    return (
      <Widget
        autofocus={autofocus}
        disabled={disabled}
        formContext={formContext}
        id={idSchema && idSchema.$id}
        label={label}
        multiple
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        options={options}
        placeholder={placeholder}
        rawErrors={rawErrors}
        readonly={readonly}
        registry={registry}
        required={required}
        schema={schema}
        value={formData}
      />
    );
  };

  if (!Object.prototype.hasOwnProperty.call(schema, 'items')) {
    return (
      <UnsupportedField
        idSchema={idSchema}
        reason="Missing items definition"
        schema={schema}
      />
    );
  }

  if (isFixedItems(schema)) {
    return <DefaultFixedArrayFieldTemplate
    canAdd={canAdd}
    className={className}
    DescriptionField={DescriptionField}
    disabled={disabled}
    formContext={formContext}
    formData={formData}
    idSchema={idSchema}
    items={items}
    onAddClick={onAddClick}
    readonly={readonly}
    registry={registry}
    required={required}
    schema={schema}
    title={title}
    TitleField={TitleField}
    uiSchema={uiSchema}
    itemProps={itemProps} />;
  }

  if (isFilesArray(schema, uiSchema, rootSchema)) {
    return renderFiles();
  }
  if (isMultiSelect(schema, rootSchema)) {
    return renderMultiSelect();
  }

  return <DefaultNormalArrayFieldTemplate
      canAdd={canAdd}
      className={className}
      DescriptionField={DescriptionField}
      disabled={disabled}
      formContext={formContext}
      formData={formData}
      idSchema={idSchema}
      items={items}
      onAddClick={onAddClick}
      readonly={readonly}
      registry={registry}
      required={required}
      schema={schema}
      title={title}
      TitleField={TitleField}
      uiSchema={uiSchema}
      itemProps={itemProps}
      />;
}

export default ArrayFieldTemplate;
