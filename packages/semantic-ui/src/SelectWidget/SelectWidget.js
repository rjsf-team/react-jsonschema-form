/* eslint-disable react/prop-types */
import { processSelectValue } from "@rjsf/utils";
import _ from "lodash";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";

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

function SelectWidget(props) {
  const {
    schema,
    uiSchema,
    formContext,
    id,
    options,
    name,
    label,
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
    rawErrors = [],
  } = props;
  const semanticProps = getSemanticProps({
    schema,
    uiSchema,
    formContext,
    options,
    defaultSchemaProps: {
      inverted: "false",
      selection: true,
      fluid: true,
      scrolling: true,
      upward: false,
    },
  });
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
  ) => onChange && onChange(processSelectValue(schema, value));
  // eslint-disable-next-line no-shadow
  const _onBlur = ({ target: { value } }) =>
    onBlur && onBlur(id, processSelectValue(schema, value));
  const _onFocus = ({
    // eslint-disable-next-line no-shadow
    target: { value },
  }) => onFocus && onFocus(id, processSelectValue(schema, value));

  return (
    <Form.Dropdown
      key={id}
      name={name}
      label={label || schema.title}
      multiple={typeof multiple === "undefined" ? false : multiple}
      value={typeof value === "undefined" ? emptyValue : value}
      error={rawErrors.length > 0}
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
export default SelectWidget;
