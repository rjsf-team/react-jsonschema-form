import React from "react";
import { utils, WidgetProps } from '@rjsf/core';
import { PrimaryButton } from "@fluentui/react";
const { getSubmitButtonOptions } = utils;
export default ({uiSchema}: WidgetProps) => {
  const { submitText, norender, props: submitButtonProps }= getSubmitButtonOptions(uiSchema);
  if(norender) return null;
  return (
    <div>
      <br />
      <div className="ms-Grid-col ms-sm12">
        <PrimaryButton text={submitText} type="submit" {...submitButtonProps} />
      </div>
    </div>
  );
};
