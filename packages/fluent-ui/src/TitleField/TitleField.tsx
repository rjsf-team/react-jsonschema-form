import React from "react";

import { FieldProps } from "@rjsf/core";

import { Label } from "office-ui-fabric-react/lib/Label";
//import color from "@material-ui/core/colors/yellow";

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
