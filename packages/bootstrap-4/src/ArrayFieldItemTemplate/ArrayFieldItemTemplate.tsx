import React, { CSSProperties } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { ArrayFieldTemplateItemType } from "@rjsf/utils";

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
    registry,
  } = props;
  const { MoveDownButton, MoveUpButton, RemoveButton } =
    registry.templates.ButtonTemplates;
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  };
  return (
    <div>
      <Row className="mb-2  d-flex align-items-center">
        <Col xs="9" lg="9">
          {children}
        </Col>
        <Col xs="3" lg="3" className="py-4">
          {hasToolbar && (
            <div className="d-flex flex-row">
              {(hasMoveUp || hasMoveDown) && (
                <div className="m-0 p-0">
                  <MoveUpButton
                    className="array-item-move-up"
                    style={btnStyle}
                    disabled={disabled || readonly || !hasMoveUp}
                    onClick={onReorderClick(index, index - 1)}
                  />
                </div>
              )}
              {(hasMoveUp || hasMoveDown) && (
                <div className="m-0 p-0">
                  <MoveDownButton
                    style={btnStyle}
                    disabled={disabled || readonly || !hasMoveDown}
                    onClick={onReorderClick(index, index + 1)}
                  />
                </div>
              )}
              {hasRemove && (
                <div className="m-0 p-0">
                  <RemoveButton
                    style={btnStyle}
                    disabled={disabled || readonly}
                    onClick={onDropIndexClick(index)}
                  />
                </div>
              )}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ArrayFieldItemTemplate;
