import React from "react";
import { ArrayFieldTemplateItemType } from "@rjsf/utils";
import Button from "antd/lib/button";
import Col from "antd/lib/col";
import Row from "antd/lib/row";

const BTN_GRP_STYLE = {
  width: "100%",
};

const BTN_STYLE = {
  width: "calc(100% / 3)",
};

const ArrayFieldItemTemplate = ({
  children,
  disabled,
  hasMoveDown,
  hasMoveUp,
  hasRemove,
  hasToolbar,
  index,
  onDropIndexClick,
  onReorderClick,
  readonly,
  registry,
  uiSchema,
}: ArrayFieldTemplateItemType) => {
  const { MoveDownButton, MoveUpButton, RemoveButton } =
    registry.templates.ButtonTemplates;
  const { rowGutter = 24, toolbarAlign = "top" } = registry.formContext;

  return (
    <Row align={toolbarAlign} key={`array-item-${index}`} gutter={rowGutter}>
      <Col flex="1">{children}</Col>

      {hasToolbar && (
        <Col flex="192px">
          <Button.Group style={BTN_GRP_STYLE}>
            {(hasMoveUp || hasMoveDown) && (
              <MoveUpButton
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
                style={BTN_STYLE}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <MoveDownButton
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
                style={BTN_STYLE}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasRemove && (
              <RemoveButton
                disabled={disabled || readonly}
                onClick={onDropIndexClick(index)}
                style={BTN_STYLE}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
          </Button.Group>
        </Col>
      )}
    </Row>
  );
};

export default ArrayFieldItemTemplate;
