import { utils, WidgetProps } from "@rjsf/core";
import React from "react";
import Button from "react-bootstrap/Button";
const { getSubmitButtonOptions } = utils;
const SubmitButton: React.FC<WidgetProps> = props => {
  const { submitText, norender, props: submitButtonProps }= getSubmitButtonOptions(props.uiSchema);
  if(norender) return null;
  return ( <div>
      <Button variant="primary" type="submit" {...submitButtonProps} >
        {submitText}
      </Button>
    </div>
  );
};

export default SubmitButton;
