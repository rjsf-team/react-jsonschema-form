import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
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
  const btnStyle = {
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
                  <IconButton
                    icon="arrow-up"
                    className="array-item-move-up"
                    tabIndex={-1}
                    style={btnStyle as any}
                    disabled={disabled || readonly || !hasMoveUp}
                    onClick={onReorderClick(index, index - 1)}
                  />
                </div>
              )}
              {(hasMoveUp || hasMoveDown) && (
                <div className="m-0 p-0">
                  <IconButton
                    icon="arrow-down"
                    tabIndex={-1}
                    style={btnStyle as any}
                    disabled={disabled || readonly || !hasMoveDown}
                    onClick={onReorderClick(index, index + 1)}
                  />
                </div>
              )}
              {hasRemove && (
                <div className="m-0 p-0">
                  <IconButton
                    icon="remove"
                    tabIndex={-1}
                    style={btnStyle as any}
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
