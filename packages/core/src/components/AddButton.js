import React from "react";
import IconButton from "./IconButton";

export default function AddButton({ className, onClick, disabled }) {
  return (
    <div className="row">
      <p className={`col-xs-3 col-xs-offset-9 text-right ${className}`}>
        <IconButton
          type="info"
          icon="plus"
          className="btn-add col-xs-12"
          aria-label="Add"
          tabIndex="0"
          onClick={onClick}
          disabled={disabled}
        />
      </p>
    </div>
  );
}
