import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getTemplate,
  IconButtonProps,
  Registry,
  UiSchema,
} from '@rjsf/utils';
import { Grid } from '@trussworks/react-uswds';
import React, { ComponentType } from 'react';

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    className,
    disabled,
    hasToolbar,
    index,
    readonly,
    registry,
    schema,
    uiSchema,
    buttonsProps,
  } = props;

  const { MoveUpButton, MoveDownButton, CopyButton, RemoveButton } = registry.templates
    .ButtonTemplates as {
    MoveUpButton: ComponentType<IconButtonProps<T, S, F>>;
    MoveDownButton: ComponentType<IconButtonProps<T, S, F>>;
    CopyButton: ComponentType<IconButtonProps<T, S, F>>;
    RemoveButton: ComponentType<IconButtonProps<T, S, F>>;
  };

  return (
    <Grid row gap={2} className={className}>
      <Grid col>{children}</Grid>

      {hasToolbar && (
        <Grid col="auto">
          {(buttonsProps.hasMoveUp || buttonsProps.hasMoveDown) && (
            <MoveUpButton
              disabled={buttonsProps.disabled || buttonsProps.readonly || !buttonsProps.hasMoveUp}
              onClick={buttonsProps.onReorderClick(index, index - 1)}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}

          {(buttonsProps.hasMoveUp || buttonsProps.hasMoveDown) && (
            <MoveDownButton
              disabled={buttonsProps.disabled || buttonsProps.readonly || !buttonsProps.hasMoveDown}
              onClick={buttonsProps.onReorderClick(index, index + 1)}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}

          {buttonsProps.hasCopy && (
            <CopyButton
              disabled={buttonsProps.disabled || buttonsProps.readonly}
              onClick={buttonsProps.onCopyIndexClick(index)}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}

          {buttonsProps.hasRemove && (
            <RemoveButton
              disabled={buttonsProps.disabled || buttonsProps.readonly}
              onClick={buttonsProps.onDropIndexClick(index)}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
        </Grid>
      )}
    </Grid>
  );
}
