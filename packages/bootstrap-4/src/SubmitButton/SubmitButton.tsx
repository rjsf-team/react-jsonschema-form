import React from "react";
import Button from "react-bootstrap/Button";
import { getSubmitButtonOptions, WidgetProps } from "@rjsf/utils";

const SubmitButton: React.ComponentType<WidgetProps> = props => {
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
