import React from "react";

export default function IconButton(props) {
  const { type = "default", icon, className, ...otherProps } = props;
  return (
    <button
      type="button"
      className={`btn btn-${type} ${className}`}
      {...otherProps}>
      <i className={`glyphicon glyphicon-${icon}`} />
    </button>
  );
}
