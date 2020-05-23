import React from "react";
import { FieldProps } from "@rjsf/core";
import { Label } from "@fluentui/react";

const styles = {
  root: [
    {
      fontSize: 24,
    },
  ],
};

const TitleField = ({ title }: FieldProps) => (
  <>
    <Label styles={styles}>{title}</Label>
  </>
);

export default TitleField;
