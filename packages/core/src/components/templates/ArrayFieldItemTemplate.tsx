import React from "react";
import { ArrayFieldTemplateItemType } from "@rjsf/utils";

import IconButton from "../IconButton";

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldItemTemplate(
  props: ArrayFieldTemplateItemType
) {
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
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  };
  return (
    <div className={className}>
      <div className={hasToolbar ? "col-xs-9" : "col-xs-12"}>{children}</div>
      {hasToolbar && (
        <div className="col-xs-3 array-item-toolbox">
          <div
            className="btn-group"
            style={{
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                icon="arrow-up"
                aria-label="Move up"
                className="array-item-move-up"
                tabIndex="-1"
                style={btnStyle}
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                icon="arrow-down"
                className="array-item-move-down"
                aria-label="Move down"
                tabIndex="-1"
                style={btnStyle}
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
              />
            )}
            {hasRemove && (
              <IconButton
                type="danger"
                icon="remove"
                aria-label="Remove"
                className="array-item-remove"
                tabIndex="-1"
                style={btnStyle}
                disabled={disabled || readonly}
                onClick={onDropIndexClick(index)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
