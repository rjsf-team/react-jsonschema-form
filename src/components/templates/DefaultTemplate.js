import React from "react";
import PropTypes from "prop-types";

const REQUIRED_FIELD_SYMBOL = "*";

function Label(props) {
  const { label, required, id } = props;
  if (!label) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  return (
    <label className="control-label" htmlFor={id}>
      {label}
      {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
    </label>
  );
}

function DefaultTemplate(props) {
  const {
    id,
    classNames,
    label,
    children,
    errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
  } = props;
  if (hidden) {
    return children;
  }

  return (
    <div className={classNames}>
      {displayLabel && <Label label={label} required={required} id={id} />}
      {displayLabel && description ? description : null}
      {children}
      {errors}
      {help}
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  DefaultTemplate.propTypes = {
    id: PropTypes.string,
    classNames: PropTypes.string,
    label: PropTypes.string,
    children: PropTypes.node.isRequired,
    errors: PropTypes.element,
    rawErrors: PropTypes.arrayOf(PropTypes.string),
    help: PropTypes.element,
    rawHelp: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    description: PropTypes.element,
    rawDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    hidden: PropTypes.bool,
    required: PropTypes.bool,
    readonly: PropTypes.bool,
    displayLabel: PropTypes.bool,
    fields: PropTypes.object,
    formContext: PropTypes.object,
  };
}

DefaultTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true,
};

export default DefaultTemplate;
