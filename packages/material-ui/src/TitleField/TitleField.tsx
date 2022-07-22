import React from "react";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import { FieldProps } from "@rjsf/utils";

const TitleField = ({ title }: FieldProps) => {
  return (
    <Box mb={1} mt={1}>
      <Typography variant="h5">{title}</Typography>
      <Divider />
    </Box>
  );
};

export default TitleField;
