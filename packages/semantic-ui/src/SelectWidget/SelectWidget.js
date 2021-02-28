/* eslint-disable react/prop-types */
import React from "react";
import _ from "lodash";
import { Form } from "semantic-ui-react";
import { utils } from '@rjsf/core';
import PropTypes from "prop-types";
import { getSemanticProps } from "../util";

const { processNewValue } = utils;

/**
 * * Returns and creates an array format required for semantic drop down
 * @param {array} enumOptions- array of items for the dropdown
 * @param {array} enumDisabled - array of enum option values to disable
 * @returns {*}
 */
function createDefaultValueOptionsForDropDown(enumOptions, enumDisabled) {
  const disabledOptions = enumDisabled || [];
  let options = [];
  // eslint-disable-next-line no-shadow
  options = _.map(enumOptions, ({ label, value }) => ({
    disabled: disabledOptions.indexOf(value) !== -1,
    key: label,
    text: label,
    value,
  }));
  return options;
}

function SelectWidget({
  schema,
  uiSchema,
  id,
  options,
  name,
  required,
  disabled,
  readonly,
  value,
  multiple,
  placeholder,
  autofocus,
  onChange,
  onBlur,
  onFocus,
}) {
  const semanticProps = getSemanticProps({ options });
  const { enumDisabled, enumOptions } = options;
  const emptyValue = multiple ? [] : "";
  const dropdownOptions = createDefaultValueOptionsForDropDown(
    enumOptions,
    enumDisabled
  );
  const _onChange = (
    event,
    // eslint-disable-next-line no-shadow
    { value }
  ) => onChange && onChange(processNewValue({ schema, uiSchema, newValue: value }));
  // eslint-disable-next-line no-shadow
  const _onBlur = ({ target: { value } }) =>
    onBlur && onBlur(id, processNewValue({ schema, uiSchema, newValue: value }));
  const _onFocus = ({
    // eslint-disable-next-line no-shadow
    target: { value },
  }) => onFocus && onFocus(id, processNewValue({ schema, uiSchema, newValue: value }));
  return (
    <Form.Dropdown
      key={id}
      name={name}
      multiple={typeof multiple === "undefined" ? false : multiple}
      value={typeof value === "undefined" ? emptyValue : value}
      disabled={disabled}
      placeholder={placeholder}
      {...semanticProps}
      required={required}
      autoFocus={autofocus}
      readOnly={readonly}
      options={dropdownOptions}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

SelectWidget.defaultProps = {
  options: {
    semantic: {
      inverted: "false",
      fluid: true,
      selection: true,
      scrolling: true,
      upward: false,
    },
  },
};

SelectWidget.propTypes = {
  options: PropTypes.object,
};

export default SelectWidget;
