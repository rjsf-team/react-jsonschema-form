/* eslint-disable react/prop-types,react/destructuring-assignment */
import React from "react";
import PropTypes from "prop-types";
import { Button, Grid, Segment } from "semantic-ui-react";
import { utils } from '@rjsf/core';
import AddButton from "../AddButton";
import { cleanClassNames, getSemanticProps, MaybeWrap } from "../util";

const { isFixedItems } = utils;

const ArrayFieldTitle = ({ TitleField, idSchema, uiSchema, title }) => {
  if (!title) {
    return null;
  }

  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} options={uiSchema["ui:options"]} />;
};

function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
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
function DefaultArrayItem(props) {
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

// Used for arrays that are represented as multiple selection fields
// (displayed as a multi select or checkboxes)
function DefaultFixedArrayFieldTemplate({
  uiSchema,
  idSchema,
  canAdd,
  className,
  classNames,
  disabled,
  items,
  onAddClick,
  readOnly,
  required,
  schema,
  title,
  TitleField,
  itemProps,
}) {
  const fieldTitle = uiSchema["ui:title"] || title;
  const fieldDescription = uiSchema["ui:description"] || schema.description;

  return (
    <div className={cleanClassNames([className, classNames])}>
      <ArrayFieldTitle
        key={`array-field-title-${idSchema.$id}`}
        TitleField={TitleField}
        idSchema={idSchema}
        uiSchema={uiSchema}
        title={fieldTitle}
        required={required}
      />

      {fieldDescription && (
        <div
          className="field-description"
          key={`field-description-${idSchema.$id}`}>
          {fieldDescription}
        </div>
      )}

      <div key={`array-item-list-${idSchema.$id}`}>
        <div className="row array-item-list">
          {items && items.map(p => DefaultArrayItem({ ...p, ...itemProps }))}
        </div>

        {canAdd && (
          <div
            style={{
              marginTop: "1rem",
              position: "relative",
              textAlign: "right",
            }}>
            <AddButton onClick={onAddClick} disabled={disabled || readOnly} />
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultNormalArrayFieldTemplate({
  uiSchema,
  idSchema,
  canAdd,
  className,
  classNames,
  disabled,
  DescriptionField,
  items,
  onAddClick,
  readOnly,
  required,
  schema,
  title,
  TitleField,
  itemProps,
}) {
  const fieldTitle = uiSchema["ui:title"] || title;
  const fieldDescription = uiSchema["ui:description"] || schema.description;
  return (
    <div
      className={cleanClassNames([
        className,
        classNames,
        "sortable-form-fields",
      ])}>
      <ArrayFieldTitle
        key={`array-field-title-${idSchema.$id}`}
        TitleField={TitleField}
        idSchema={idSchema}
        uiSchema={uiSchema}
        title={fieldTitle}
        required={required}
      />

      {fieldDescription && (
        <ArrayFieldDescription
          key={`array-field-description-${idSchema.$id}`}
          DescriptionField={DescriptionField}
          idSchema={idSchema}
          description={fieldDescription}
        />
      )}

      <div key={`array-item-list-${idSchema.$id}`}>
        <div className="row array-item-list">
          {items && items.map(p => DefaultArrayItem({ ...p, ...itemProps }))}
        </div>

        {canAdd && (
          <div
            style={{
              marginTop: "1rem",
              position: "relative",
              textAlign: "right",
            }}>
            <AddButton onClick={onAddClick} disabled={disabled || readOnly} />
          </div>
        )}
      </div>
    </div>
  );
}

function ArrayFieldTemplate(props) {
  const { schema } = props;
  const { horizontalButtons, wrapItem } = getSemanticProps(props);
  const itemProps = { horizontalButtons, wrapItem };

  if (isFixedItems(schema)) {
    return <DefaultFixedArrayFieldTemplate {...props} itemProps={itemProps} />;
  }
  return <DefaultNormalArrayFieldTemplate {...props} itemProps={itemProps} />;
}

ArrayFieldTemplate.defaultProps = {
  options: {},
};

ArrayFieldTemplate.propTypes = {
  options: PropTypes.object,
};

export default ArrayFieldTemplate;
