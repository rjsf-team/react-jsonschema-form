import React from "react";

import { AddButtonProps } from "@rjsf/core";
import cn from "clsx";
import { PrimeIcons } from "primereact/api";
import { Button } from "primereact/Button";

const AddButton: React.FC<AddButtonProps> = props => (
  <Button {...props} className={cn('w-full', props.className)}>
    <i className={PrimeIcons.PLUS} />
  </Button>
);

export default AddButton;
