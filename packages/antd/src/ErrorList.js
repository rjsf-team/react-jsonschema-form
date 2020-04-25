import React from 'react';

import { Alert, List, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const ErrorList = ({
  // errorSchema,
  errors,
  // formContext,
  // schema,
  // uiSchema,
}) => {
  const renderErrors = () => (
    <List className="list-group" size="small">
      {errors.map((error, index) => (
        <List.Item key={index}>
          <Space>
            <ExclamationCircleOutlined />
            {error.stack}
          </Space>
        </List.Item>
      ))}
    </List>
  );

  return (
    <Alert
      className="panel panel-danger errors"
      description={renderErrors()}
      message="Errors"
      type="error"
    />
  );
};

export default ErrorList;
