import React from "react";
import Typography from "@mui/material/Typography";
import { FieldProps } from "@rjsf/utils";

const DescriptionField = ({ description }: FieldProps) => {
  if (description) {
    return (
      <Typography variant="subtitle2" style={{ marginTop: "5px" }}>
        {description}
      </Typography>
    );
  }

  return null;
};

export default DescriptionField;
