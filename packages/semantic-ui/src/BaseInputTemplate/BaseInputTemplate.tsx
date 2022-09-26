import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
import { getInputProps, WidgetProps } from "@rjsf/utils";

function BaseInputTemplate(props: WidgetProps) {
  const {
    id,
    placeholder,
    label,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    formContext,
    type,
    registry,
    rawErrors = [],
  } = props;
  const inputProps = getInputProps(schema, type, options);
  const semanticProps = getSemanticProps({
    uiSchema,
    formContext,
    options,
  });
  const { schemaUtils } = registry;
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);

  return (
    <>
      <Form.Input
        key={id}
        id={id}
        name={id}
        placeholder={placeholder}
        {...inputProps}
        label={displayLabel ? label || schema.title : false}
        required={required}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        list={schema.examples ? `examples_${id}` : undefined}
        {...semanticProps}
        value={value || value === 0 ? value : ""}
        error={rawErrors.length > 0}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      {schema.examples && (
        <datalist id={`examples_${id}`}>
          {(schema.examples as string[])
            .concat(schema.default ? ([schema.default] as string[]) : [])
            .map((example) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </>
  );
}
export default BaseInputTemplate;
