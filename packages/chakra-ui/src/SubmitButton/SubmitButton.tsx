import React from "react";
import { Box, Button } from "@chakra-ui/react";
import { getSubmitButtonOptions, SubmitButtonProps } from "@rjsf/utils";

const SubmitButton = ({ uiSchema }: SubmitButtonProps) => {
  const {
    submitText,
    norender,
    props: submitButtonProps,
  } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }

  return (
    <Box marginTop={3}>
      <Button type="submit" variant="solid" {...submitButtonProps}>
        {submitText}
      </Button>
    </Box>
  );
};
export default SubmitButton;
