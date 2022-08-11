import React from "react";
import PropTypes from "prop-types";
import { Button } from "semantic-ui-react";

function IconButton(props) {
  const { icon, iconType, className, ...otherProps } = props;
  return (
    <Button
      icon={icon}
      size={iconType}
      tabIndex="-1"
      className={className}
      {...otherProps}
    />
  );
}

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default IconButton;

export function MoveDownButton(props) {
  return <IconButton title="Move down" {...props} icon="angle down" />;
}

export function MoveUpButton(props) {
  return <IconButton title="Move up" {...props} icon="angle up" />;
}

export function RemoveButton(props) {
  return <IconButton title="Remove" {...props} icon="trash" />;
}
