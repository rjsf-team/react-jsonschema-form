import React from "react";

import { Message } from "primereact/message";

import { ErrorListProps } from "@rjsf/core";

const ErrorList = ({ errors }: ErrorListProps) => (
  <Message
    className="mb-3"
    severity="error"
    style={{
      whiteSpace: "pre-line"
    }}
    content={errors.map(error => error.stack).join("\n")}
  />
);

export default ErrorList;
