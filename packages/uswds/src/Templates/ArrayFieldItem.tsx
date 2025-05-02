import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Grid } from '@trussworks/react-uswds';
import React, { ComponentType } from 'react';

export default function ArrayFieldItem<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    className,
    disabled,
    hasToolbar,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    index,
    onDropIndexClick,
    onReorderClick,
    readonly,
  } = props;

  return (
    <Grid row gap={2} className={className}>
      <Grid col>{children}</Grid>

      {hasToolbar && (
        <Grid col="auto">
          {(hasMoveUp || hasMoveDown) && (
            <MoveUpButton
              disabled={disabled || readonly || !hasMoveUp}
              onClick={onReorderClick(index, index - 1)}
            />
          )}

          {(hasMoveUp || hasMoveDown) && (
            <MoveDownButton
              disabled={disabled || readonly || !hasMoveDown}
              onClick={onReorderClick(index, index + 1)}
            />
          )}

          {hasRemove && (
            <RemoveButton
              disabled={disabled || readonly}
              onClick={onDropIndexClick(index)}
            />
          )}
        </Grid>
      )}
    </Grid>
  );
}
