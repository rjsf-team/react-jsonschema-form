/* eslint-disable react/prop-types */
import React from "react";
import _ from "lodash";
import { Form } from "semantic-ui-react";
import { utils } from '@rjsf/core';
import PropTypes from "prop-types";
import { getSemanticProps } from "../util";


const { asNumber, guessType } = utils;

const nums = new Set(["number", "integer"]);

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

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema, value) => {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;
  if (value === "") {
    return undefined;
  } else if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  } else if (type === "boolean") {
    return value === "true" || value === true;
  } else if (type === "number") {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every(x => guessType(x) === "number")) {
      return asNumber(value);
    } else if (schema.enum.every(x => guessType(x) === "boolean")) {
      return value === "true";
    }
  }

  return value;
};

function SelectWidget(props) {
  const {
    schema,
    id,
    label,
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
  } = props;
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
  ) => onChange && onChange(processValue(schema, value));
  // eslint-disable-next-line no-shadow
  const _onBlur = ({ target: { value } }) =>
    onBlur && onBlur(id, processValue(schema, value));
  const _onFocus = ({
    // eslint-disable-next-line no-shadow
    target: { value },
  }) => onFocus && onFocus(id, processValue(schema, value));

  return (
    <Form.Dropdown
      key={id}
      name={name}
      label={label || schema.title}
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
