/* eslint-disable react/prop-types,react/destructuring-assignment */
import React from "react";
import { isMultiSelect, getDefaultRegistry } from "../../../core/lib/utils";
import { Button, Segment, Grid } from "semantic-ui-react";
import AddButton from "../AddButton";
import PropTypes from "prop-types";

const ArrayFieldTitle = ({ TitleField, idSchema, title }) => {
  if (!title) {
    return <div />;
  }

  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} />;
};

function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
}

const sharedStyle = {
  marginBottom: "0px",
};

let sharedNestedStyle = {
  border: "2px solid rgb(35, 39, 51)",
  marginBottom: "10px",
};

const defaultGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 65px",
};

const containerStyle = {
  padding: "1.5em",
};

// checks if its the first array item
function isInitialArrayItem(props) {
  // no underscore because im not sure if we want to import a library here
  const { idSchema } = props.children.props;
  return idSchema.target && idSchema.conditions;
}

// Used in the two templates
function DefaultArrayItem(props) {
  const btnStyle = {
    flex: 1,
  };

  return (
    <div className="array-item" style={sharedNestedStyle} key={props.key}>
      <div
        // this will prevent the nested items from getting styles the parent has
        style={isInitialArrayItem(props) && sharedStyle}>
        <Segment.Group>
          <Grid
            style={
              !isInitialArrayItem(props)
                ? { ...defaultGrid, alignItems: "center" }
                : defaultGrid
            }>
            <Grid.Column
              width={16}
              verticalAlign="middle"
              style={containerStyle}>
              {props.children}
            </Grid.Column>

            {props.hasToolbar && (
              <Grid.Column>
                {(props.hasMoveUp || props.hasMoveDown) && (
                  <Button.Group vertical size="mini">
                    {(props.hasMoveUp ||
                      props.hasMoveDown ||
                      props.hasRemove) && (
                      <Button
                        secondary
                        icon="angle up"
                        className="array-item-move-up"
                        tabIndex="-1"
                        style={btnStyle}
                        disabled={
                          props.disabled || props.readOnly || !props.hasMoveUp
                        }
                        onClick={props.onReorderClick(
                          props.index,
                          props.index - 1
                        )}
                      />
                    )}

                    {props.hasRemove && (
                      <Button
                        secondary
                        icon="trash"
                        className="array-item-remove"
                        tabIndex="-1"
                        style={btnStyle}
                        disabled={props.disabled || props.readOnly}
                        onClick={props.onDropIndexClick(props.index)}
                      />
                    )}

                    {(props.hasMoveUp || props.hasMoveDown) && (
                      <Button
                        secondary
                        icon="angle down"
                        className="array-item-move-down"
                        tabIndex="-1"
                        style={btnStyle}
                        disabled={
                          props.disabled || props.readOnly || !props.hasMoveDown
                        }
                        onClick={props.onReorderClick(
                          props.index,
                          props.index + 1
                        )}
                      />
                    )}
                  </Button.Group>
                )}
              </Grid.Column>
            )}
          </Grid>
        </Segment.Group>
      </div>
    </div>
  );
}

function DefaultFixedArrayFieldTemplate(props) {
  const title = props.uiSchema["ui:title"] || props.title;
  const description =
    props.uiSchema["ui:description"] || props.schema.description;
  return (
    <div className={props.className}>
      {props.displayLabel && title && (
        <ArrayFieldTitle
          key={`array-field-title-${props.idSchema.$id}`}
          TitleField={props.TitleField}
          idSchema={props.idSchema}
          title={title}
          required={props.required}
        />
      )}

      {props.displayLabel && description && (
        <div
          className="field-description"
          key={`field-description-${props.idSchema.$id}`}>
          {description}
        </div>
      )}

      <div
        style={sharedNestedStyle}
        key={`array-item-list-${props.idSchema.$id}`}>
        <div className="row array-item-list">
          {props.items && props.items.map(DefaultArrayItem)}
        </div>

        {props.canAdd && (
          <div style={{ position: "relative", textAlign: "right" }}>
            <AddButton
              onClick={props.onAddClick}
              disabled={props.disabled || props.readOnly}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultNormalArrayFieldTemplate(props) {
  const title = props.uiSchema["ui:title"] || props.title;
  const description =
    props.uiSchema["ui:description"] || props.schema.description;
  return (
    <div className="sortable-form-fields">
      <div className={props.className}>
        {props.displayLabel && title && (
          <ArrayFieldTitle
            key={`array-field-title-${props.idSchema.$id}`}
            TitleField={props.TitleField}
            idSchema={props.idSchema}
            title={props.uiSchema["ui:title"] || props.title}
            required={props.required}
          />
        )}

        {props.displayLabel && description && (
          <ArrayFieldDescription
            key={`array-field-description-${props.idSchema.$id}`}
            DescriptionField={props.DescriptionField}
            idSchema={props.idSchema}
            description={description}
          />
        )}

        <div key={`array-item-list-${props.idSchema.$id}`}>
          <div className="row array-item-list">
            {props.items && props.items.map(p => DefaultArrayItem(p))}
          </div>

          {props.canAdd && (
            <div style={{ position: "relative", textAlign: "right" }}>
              <AddButton
                onClick={props.onAddClick}
                disabled={props.disabled || props.readOnly}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArrayFieldTemplate(props) {
  const { schema, registry = getDefaultRegistry(), options } = props;
  const { showNesting } = options;
  if (!showNesting) {
    delete sharedNestedStyle["border"];
  }
  if (isMultiSelect(schema, registry.definitions)) {
    return <DefaultFixedArrayFieldTemplate {...props} />;
  }
  return <DefaultNormalArrayFieldTemplate {...props} />;
}

ArrayFieldTemplate.defaultProps = {
  options: {
    showNesting: true,
  },
};

ArrayFieldTemplate.propTypes = {
  options: PropTypes.object,
};

export default ArrayFieldTemplate;
