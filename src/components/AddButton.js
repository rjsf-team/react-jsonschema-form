import React from "react";
import IconButton from "./IconButton";

export default function AddButton({ className, onClick, disabled, textValue, typeValue }) {
  return (
    <div className="row">
      <div  className="col-12">
      <p className={`${className}`}>
        <IconButton
          type={typeValue}/* 
          icon="plus" */
          text={textValue}
          className="btn-add btn-sm"
          tabIndex="0"
          onClick={onClick}
          disabled={disabled}
        />
      </p>
      </div>
    </div>
  );
}
