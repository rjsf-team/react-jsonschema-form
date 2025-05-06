import React from 'react';
import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Grid } from '@trussworks/react-uswds';

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    disabled,
    hasToolbar,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    index,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry, // Add registry to props destructuring
  } = props;

  // Retrieve button components from registry
  const { MoveUpButton, MoveDownButton, RemoveButton } = registry.templates.ButtonTemplates;

  return (
    <Grid row>
      <Grid col>{children}</Grid>
      {hasToolbar && (
        <Grid col="auto">
          {(hasMoveUp || hasMoveDown) &&
            MoveUpButton && ( // Check if button component exists
              <MoveUpButton
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
                registry={registry}
              />
            )}
          {(hasMoveUp || hasMoveDown) &&
            MoveDownButton && ( // Check if button component exists
              <MoveDownButton
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
                registry={registry}
              />
            )}
          {hasRemove &&
            RemoveButton && ( // Check if button component exists
              <RemoveButton
                disabled={disabled || readonly}
                onClick={onDropIndexClick(index)}
                registry={registry}
              />
            )}
        </Grid>
      )}
    </Grid>
  );
}
