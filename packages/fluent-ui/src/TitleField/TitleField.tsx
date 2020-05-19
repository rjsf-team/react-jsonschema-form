import React from "react";

import { FieldProps } from "@rjsf/core";

import { Label } from "office-ui-fabric-react/lib/Label";

const TitleField = ({ title }: FieldProps) => (
  <>
    <Label>{title}</Label>
  </>
);

export default TitleField;
