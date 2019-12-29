import React from 'react';
import PropTypes from 'prop-types';

import { Button, Col, Row } from 'antd';

const ArrayFieldTemplateItem = ({
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
}) => {
  const btnStyle = {
    width: 'calc(100% / 3)',
  };

  return (
    <Row align="bottom" key={`array-item-${index}`} gutter={24} type="flex">
      <Col style={{ flex: '1' }}>{children}</Col>

      {hasToolbar && (
        <Col style={{ width: '192px' }}>
          <Button.Group style={{ width: '100%' }}>
            {(hasMoveUp || hasMoveDown) && (
              <Button
                disabled={disabled || readonly || !hasMoveUp}
                icon="arrow-up"
                onClick={onReorderClick(index, index - 1)}
                style={btnStyle}
                type="default"
              />
            )}

            {(hasMoveUp || hasMoveDown) && (
              <Button
                disabled={disabled || readonly || !hasMoveDown}
                icon="arrow-down"
                onClick={onReorderClick(index, index + 1)}
                style={btnStyle}
                type="default"
              />
            )}

            {hasRemove && (
              <Button
                disabled={disabled || readonly}
                icon="delete"
                onClick={onDropIndexClick(index)}
                style={btnStyle}
                type="danger"
              />
            )}
          </Button.Group>
        </Col>
      )}
    </Row>
  );
};

ArrayFieldTemplateItem.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  hasMoveDown: PropTypes.bool,
  hasMoveUp: PropTypes.bool,
  hasRemove: PropTypes.bool,
  hasToolbar: PropTypes.bool,
  index: PropTypes.number.isRequired,
  onDropIndexClick: PropTypes.func,
  onReorderClick: PropTypes.func,
  readonly: PropTypes.bool,
};

ArrayFieldTemplateItem.defaultProps = {
  disabled: false,
  hasMoveDown: true,
  hasMoveUp: true,
  hasRemove: true,
  hasToolbar: true,
  onDropIndexClick: () => {},
  onReorderClick: () => {},
  readonly: false,
};

export default ArrayFieldTemplateItem;
