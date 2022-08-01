import React from "react";
import { TitleFieldProps } from "@rjsf/utils";
import { Label } from "@fluentui/react";

const styles = {
  root: [
    {
      fontSize: 24,
      marginBottom: 20,
      paddingBottom: 0,
    },
  ],
};

const TitleField = ({ id, title }: TitleFieldProps) => (
  <Label id={id} styles={styles}>
    {title}
  </Label>
);

export default TitleField;
