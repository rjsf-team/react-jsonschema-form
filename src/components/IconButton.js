import React from "react";

export default function IconButton(props) {
  const { type = "default", icon, text, className, ...otherProps } = props;
  return (
    <button
      type="button"
      className={`btn btn-${type} ${className}`}
      {...otherProps}>
        {icon && 
          <i className={`glyphicon glyphicon-${icon}`} />
        }
        {text && 
          <span>{text}</span>
        }
    </button>
  );
}
