import React from 'react';
import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

export default function ArrayFieldItemTemplate<
  T = RJSFSchema,
  S = StrictRJSFSchema,
  F = FormContextType
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    className,
    disabled,
    hasToolbar,
    hasMoveUp,
    hasMoveDown,
    hasRemove,
    index,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
  } = props;

  const { MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;

  // Add border and padding for visual separation
  const containerClassName = 'array-item border border-base-lighter padding-1 margin-bottom-1';

  return (
    <div className={containerClassName}>
      <div className={className}>{children}</div>
      {hasToolbar && (
        <div className="col-xs-3 array-item-toolbox">
          <div
            className="usa-button-group"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem', // Increased gap for more buffer
            }}
          >
            {(hasMoveUp || hasMoveDown) && (
              <MoveUpButton
                className="array-item-move-up"
                onClick={onReorderClick(index, index - 1)}
                disabled={disabled || readonly || !hasMoveUp}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <MoveDownButton
                className="array-item-move-down"
                onClick={onReorderClick(index, index + 1)}
                disabled={disabled || readonly || !hasMoveDown}
              />
            )}
            {hasRemove && (
              <RemoveButton
                className="array-item-remove"
                onClick={onDropIndexClick(index)}
                disabled={disabled || readonly}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}