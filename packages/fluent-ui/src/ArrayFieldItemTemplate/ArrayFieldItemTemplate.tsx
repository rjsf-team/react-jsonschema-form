import React from "react";
import { ArrayFieldTemplateItemType } from "@rjsf/utils";

import IconButton from "../IconButton";

const ArrayFieldItemTemplate = (props: ArrayFieldTemplateItemType) => {
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
  } = props;
  return (
    <div className="ms-Grid" dir="ltr">
      <div className="ms-Grid-row">
        <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg9">
          <div className="ms-Grid-row">{children}</div>
        </div>
        {hasToolbar && (
          <div
            className="ms-Grid-col ms-sm6 ms-md4 ms-lg3"
            style={{ textAlign: "right" }}
          >
            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                icon="arrow-up"
                className="array-item-move-up"
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                icon="arrow-down"
                className="array-item-move-down"
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
              />
            )}
            {hasRemove && (
              <IconButton
                icon="remove"
                className="array-item-remove"
                disabled={disabled || readonly}
                onClick={onDropIndexClick(index)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrayFieldItemTemplate;
