/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "semantic-ui-react";
import DescriptionField from "../DescriptionField";
import HelpField from "../HelpField";
import RawErrors from "../RawErrors";
import { getSemanticProps, MaybeWrap } from "../util";

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
  const { wrapLabel, wrapContent, errorOptions } = semanticProps;
  return (
    <Form.Group key={id} widths="equal" grouped>
      <MaybeWrap wrap={wrapContent} className="sui-field-content">
        {children}
        {displayLabel && rawDescription && (
          <MaybeWrap wrap={wrapLabel} className="sui-field-label">
            {rawDescription && (
              <DescriptionField description={rawDescription} />
            )}
          </MaybeWrap>
        )}
        <HelpField helpText={rawHelp} id={id + "__help"} />
        <RawErrors errors={rawErrors} options={errorOptions} />
      </MaybeWrap>
    </Form.Group>
  );
}

export default FieldTemplate;
