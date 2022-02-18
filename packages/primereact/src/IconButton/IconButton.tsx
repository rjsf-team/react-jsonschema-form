import React from "react";
import { Button } from "primereact/button";
import { PrimeIcons } from "primereact/api";
import cn from "clsx";

const mappings: any = {
  remove: <i className={PrimeIcons.TIMES}/>,
  plus: <i className={PrimeIcons.PLUS}/>,
  "arrow-up": <i className={PrimeIcons.ARROW_UP}/>,
  "arrow-down": <i className={PrimeIcons.ARROW_DOWN}/>,
};

type IconButtonProps = {
  icon: string;
  className?: string;
  tabIndex?: number;
  style?: any;
  disabled?: any;
  onClick?: any;
};

const IconButton = (props: IconButtonProps) => {
  const { icon, className, ...otherProps } = props;
  return (
    <Button
      {...otherProps}
      icon={mappings[icon]}
      className={cn("p-button-outlined p-button-sm", props.className)}
    />
  );
};

export default IconButton;
