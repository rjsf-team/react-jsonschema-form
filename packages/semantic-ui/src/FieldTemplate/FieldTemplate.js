/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "semantic-ui-react";
import DescriptionField from "../DescriptionField";
import HelpField from "../HelpField";
import RawErrors from "../RawErrors";
import { cleanClassNames, getSemanticProps, MaybeWrap } from "../util";

function FieldTemplate({
  id,
  children,
  className, // pass className for styling libs (like styled-components)
  classNames,
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
      className={cleanClassNames([className, classNames], ["field"])}
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
      <MaybeWrap wrap={wrapInput} className="sui-field-content">
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
