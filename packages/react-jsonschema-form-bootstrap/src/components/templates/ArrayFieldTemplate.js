import React from 'react';

import ArrowUp from '../icons/ArrowUp';
import ArrowDown from '../icons/ArrowDown';
import Cross from '../icons/Cross';
import Plus from '../icons/Plus';

function ArrayFieldTitle({ TitleTemplate, idSchema, title, required }) {
  if (!title) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__title`;
  return <TitleTemplate id={id} title={title} required={required} />;
}

function ArrayFieldDescription({ DescriptionTemplate, idSchema, description }) {
  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__description`;
  return <DescriptionTemplate id={id} description={description} />;
}

function IconBtn(props) {
  const { type = 'secondary', icon: Icon, className, ...otherProps } = props;
  return (
    <button
      type="button"
      className={`btn btn-${type} ${className}`}
      {...otherProps}
    >
      <Icon />
    </button>
  );
}

function ArrayItem(props) {
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold'
  };
  const classNames = [props.className, 'row'].join(' ').trim();

  return (
    <div key={props.index} className={classNames}>
      <div className={props.hasToolbar ? 'col-md-9' : 'col-md-12'}>
        {props.children}
      </div>

      {props.hasToolbar && (
        <div className="col-md-3 array-item-toolbox">
          <div
            className="btn-group"
            style={{
              display: 'flex',
              justifyContent: 'space-around'
            }}
          >
            {(props.hasMoveUp || props.hasMoveDown) && (
              <IconBtn
                icon={ArrowUp}
                className="array-item-move-up"
                tabIndex="-1"
                style={btnStyle}
                disabled={props.disabled || props.readonly || !props.hasMoveUp}
                onClick={props.onReorderClick(props.index, props.index - 1)}
              />
            )}

            {(props.hasMoveUp || props.hasMoveDown) && (
              <IconBtn
                icon={ArrowDown}
                className="array-item-move-down"
                tabIndex="-1"
                style={btnStyle}
                disabled={
                  props.disabled || props.readonly || !props.hasMoveDown
                }
                onClick={props.onReorderClick(props.index, props.index + 1)}
              />
            )}

            {props.hasRemove && (
              <IconBtn
                type="danger"
                icon={Cross}
                className="array-item-remove"
                tabIndex="-1"
                style={btnStyle}
                disabled={props.disabled || props.readonly}
                onClick={props.onDropIndexClick(props.index)}
                data-testid="remove-array-item"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddButton({ onClick, disabled }) {
  return (
    <div className="row">
      <p className="col-md-3 col-md-offset-9 array-item-add text-right">
        <IconBtn
          type="info"
          icon={Plus}
          className="btn-add col-md-12"
          tabIndex="0"
          onClick={onClick}
          disabled={disabled}
          data-testid="add-array-item"
        />
      </p>
    </div>
  );
}

function ArrayFieldTemplate(props) {
  return (
    <fieldset className={props.className}>
      <ArrayFieldTitle
        key={`array-field-title-${props.idSchema.$id}`}
        TitleTemplate={props.TitleTemplate}
        idSchema={props.idSchema}
        title={props.uiSchema['ui:title'] || props.title}
        required={props.required}
      />

      {(props.uiSchema['ui:description'] || props.schema.description) && (
        <ArrayFieldDescription
          key={`array-field-description-${props.idSchema.$id}`}
          DescriptionTemplate={props.DescriptionTemplate}
          idSchema={props.idSchema}
          description={
            props.uiSchema['ui:description'] || props.schema.description
          }
        />
      )}

      <div
        className="array-item-list"
        key={`array-item-list-${props.idSchema.$id}`}
      >
        {props.items && props.items.map(p => ArrayItem(p))}
      </div>

      {props.canAdd && (
        <AddButton
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
        />
      )}
    </fieldset>
  );
}

/**
 * TODO: PropTypes
 */

export default ArrayFieldTemplate;
