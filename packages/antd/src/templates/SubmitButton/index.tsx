import { getSubmitButtonOptions, SubmitButtonProps } from "@rjsf/utils";
import React from "react";
import Button, { ButtonType } from "antd/lib/button";

export default ({ uiSchema }: SubmitButtonProps) => {
  const {
    submitText,
    norender,
    props: submitButtonProps,
  } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <Button
      type={"submit" as ButtonType}
      {...submitButtonProps}
      htmlType="submit"
    >
      {submitText}
    </Button>
  );
};
