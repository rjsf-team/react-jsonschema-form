/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "semantic-ui-react";
import DescriptionField from "../DescriptionField";
import HelpField from "../HelpField";
import RawErrors from "../RawErrors";
import { getSemanticProps } from "../util";

function MaybeWrap({ wrap, Component = "div", ...props }) {
  return wrap ? <Component {...props} /> : props.children;
}

function FieldTemplate({
  id,
  children,
  className,
  displayLabel,
  label,
  rawErrors = [],
  rawHelp,
  rawDescription,
  ...props
}) {
  const semanticProps = getSemanticProps(props);
  const { wrapLabel, wrapInput } = semanticProps;

  return (
    <Form.Field
      className={`sui-field-${id} ${className || ""}`}
      key={id}
      style={{ position: "relative" }}>
      {displayLabel && (label || rawDescription) && (
        <MaybeWrap wrap={wrapLabel} className="sui-field-label">
          {label && <label htmlFor={id}>{label}</label>}
          {rawDescription && (
            <DescriptionField
              description={rawDescription}
              size={semanticProps.size}
            />
          )}
        </MaybeWrap>
      )}
      <MaybeWrap wrap={wrapInput} className="sui-field-input">
        {children}
        <HelpField
          helpText={rawHelp}
          id={id}
          inline={semanticProps.inlineHelp}
        />
        <RawErrors errors={rawErrors} />
      </MaybeWrap>
    </Form.Field>
  );
}

export default FieldTemplate;
