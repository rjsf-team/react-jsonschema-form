import { utils, WidgetProps } from "@rjsf/core";
import React from "react";
import Button from "react-bootstrap/Button";
const { getSubmitButtonProps } = utils;
const SubmitButton: React.FC<WidgetProps> = props => {
  const { submitText, required, ...submitButtonProps }= getSubmitButtonProps(props.uiSchema);
  if(!required) return null;
  return ( <div>
      <Button variant="primary" type="submit" {...submitButtonProps} >
        {submitText}
      </Button>
    </div>
  );
};

export default SubmitButton;
