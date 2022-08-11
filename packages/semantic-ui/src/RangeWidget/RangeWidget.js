/* eslint-disable react/prop-types */
import { Fragment } from "react";
import { Input } from "semantic-ui-react";
import { rangeSpec } from "@rjsf/utils";
import { getSemanticProps } from "../util";

function RangeWidget(props) {
  const {
    id,
    name,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    uiSchema,
    formContext,
    rawErrors = [],
  } = props;
  const semanticProps = getSemanticProps({
    formContext,
    options,
    uiSchema,
    defaultSchemaProps: {
      fluid: true,
    },
  });

  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange && onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <Fragment>
      <Input
        id={id}
        key={id}
        name={name}
        type="range"
        required={required}
        disabled={disabled || readonly}
        {...rangeSpec(schema)}
        {...semanticProps}
        value={value || ""}
        error={rawErrors.length > 0}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      <span>{value}</span>
    </Fragment>
  );
}
export default RangeWidget;
