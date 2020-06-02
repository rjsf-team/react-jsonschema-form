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
  const { wrapLabel, wrapContent, inlineHelp, errorOptions } = semanticProps;
  // console.info('inlineHelp', inlineHelp);
  // console.info('semanticProps', semanticProps);
  // console.info('props', props);
  return (
    <Form.Field
      className={cleanClassNames([className, classNames], ["field"])}
      key={id}
      style={{ position: "relative" }}>
      {displayLabel && rawDescription && (
        <MaybeWrap wrap={wrapLabel} className="sui-field-label">
          {rawDescription && <DescriptionField description={rawDescription} />}
        </MaybeWrap>
      )}
      <MaybeWrap wrap={wrapContent} className="sui-field-content">
        {children}
        <HelpField helpText={rawHelp} id={id} inline={inlineHelp} />
        <RawErrors errors={rawErrors} options={errorOptions} />
      </MaybeWrap>
    </Form.Field>
  );
}

export default FieldTemplate;
