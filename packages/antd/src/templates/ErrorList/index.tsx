import React from "react";
import Alert from "antd/lib/alert";
import List from "antd/lib/list";
import Space from "antd/lib/space";
import ExclamationCircleOutlined from "@ant-design/icons/ExclamationCircleOutlined";
import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ errors }: ErrorListProps<T, S, F>) {
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
}
