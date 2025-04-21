import React from "react";
import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

const ArrayFieldItemTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  props: ArrayFieldTemplateItemType<T, S, F>,
) => {
  const {
    children,
    disabled,
    hasToolbar,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    hasCopy, // Added for completeness, though icon not requested
    index,
    onCopyIndexClick, // Added for completeness
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
    uiSchema,
  } = props;

  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } =
    registry.templates.ButtonTemplates;

  return (
    <div className="rjsf-uswds-array-item">
      <div className="grid-row grid-gap">
        <div className={hasToolbar ? "grid-col-9" : "grid-col-12"}>
          {children}
        </div>

        {hasToolbar && (
          <div className="grid-col-3 rjsf-uswds-array-item-toolbox">
            <div
              className="usa-button-group usa-button-group--segmented display-flex flex-justify-end grid-gap-1" // Use utility classes
            >
              {(hasMoveUp || hasMoveDown) && (
                <MoveUpButton
                  className="array-item-move-up"
                  disabled={disabled || readonly || !hasMoveUp}
                  onClick={onReorderClick(index, index - 1)}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}

              {(hasMoveUp || hasMoveDown) && (
                <MoveDownButton
                  className="array-item-move-down"
                  disabled={disabled || readonly || !hasMoveDown}
                  onClick={onReorderClick(index, index + 1)}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}

              {hasCopy && (
                <CopyButton
                  className="array-item-copy"
                  disabled={disabled || readonly}
                  onClick={onCopyIndexClick(index)}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}

              {hasRemove && (
                <RemoveButton
                  className="array-item-remove"
                  disabled={disabled || readonly}
                  onClick={onDropIndexClick(index)}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrayFieldItemTemplate;
