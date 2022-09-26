import React from "react";
import { Input } from "semantic-ui-react";
import { rangeSpec, WidgetProps } from "@rjsf/utils";
import { getSemanticProps } from "../util";

function RangeWidget(props: WidgetProps) {
  const {
    id,
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
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange && onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <React.Fragment>
      <Input
        id={id}
        key={id}
        name={id}
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
    </React.Fragment>
  );
}
export default RangeWidget;
