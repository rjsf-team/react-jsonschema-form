import React from "react";

const REQUIRED_FIELD_SYMBOL = "*";

export type LabelProps = {
  label?: string;
  required?: boolean;
  id?: string;
};

export default function Label(props: LabelProps) {
  const { label, required, id } = props;
  if (!label) {
    return null;
  }
  return (
    <label className="control-label" htmlFor={id}>
      {label}
      {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
    </label>
  );
}
