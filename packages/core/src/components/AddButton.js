import React from "react";
import IconButton from "./IconButton";
export default function AddButton({ className, onClick, disabled }) {
  return (
    <div className="flex flex-wrap">
      <p className={`col-xs-3 col-xs-offset-9 text-right ${className}`}>
        <IconButton
          type="info"
          icon="plus"
          className="btn-add sm:w-1/6 pr-4 pl-42"
          aria-label="Add"
          tabIndex="0"
          onClick={onClick}
          disabled={disabled}
        />
      </p>
    </div>
  );
}
