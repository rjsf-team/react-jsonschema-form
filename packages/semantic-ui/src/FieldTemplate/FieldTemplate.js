/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "semantic-ui-react";
import HelpField from "../HelpField";
import DescriptionField from "../DescriptionField";
import RawErrors from "../RawErrors";
import { getSemanticProps } from "../util";

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

  const labelElement = (
    <React.Fragment>
      {displayLabel && label && <label htmlFor={id}>{label}</label>}
      {displayLabel && rawDescription && (
        <DescriptionField
          description={rawDescription}
          size={semanticProps.size}
        />
      )}
    </React.Fragment>
  );

  return (
    <Form.Field
      className={className || "sui-field"}
      key={id}
      style={{ position: "relative" }}>
      {semanticProps.wrapLabel ? (
        <div className="sui-field-label">{labelElement}</div>
      ) : (
        labelElement
      )}
      <div className="sui-field-inner">
        {children}
        <HelpField
          helpText={rawHelp}
          id={id}
          inline={semanticProps.inlineHelp}
        />
        <RawErrors errors={rawErrors} />
      </div>
    </Form.Field>
  );
}

export default FieldTemplate;
