/* eslint-disable react/prop-types */
import React from "react";
import { getTemplate, getUiOptions } from "@rjsf/utils";
import { Form } from "semantic-ui-react";
import WrapIfAdditional from "./WrapIfAdditional";
import { getSemanticProps, MaybeWrap } from "../util";

function FieldTemplate({
  id,
  children,
  className, // pass className for styling libs (like styled-components)
  classNames,
  displayLabel,
  label,
  errors,
  help,
  hidden,
  rawDescription,
  registry,
  uiSchema,
  ...props
}) {
  const semanticProps = getSemanticProps(props);
  const { wrapLabel, wrapContent } = semanticProps;
  const uiOptions = getUiOptions(uiSchema);
  const DescriptionFieldTemplate = getTemplate(
    "DescriptionFieldTemplate",
    registry,
    uiOptions
  );

  if (hidden) {
    return <div style={{ display: "none" }}>{children}</div>;
  }

  return (
    <WrapIfAdditional
      classNames={classNames}
      id={id}
      label={label}
      registry={registry}
      {...props}
    >
      <Form.Group key={id} widths="equal" grouped>
        <MaybeWrap wrap={wrapContent} className="sui-field-content">
          {children}
          {displayLabel && rawDescription && (
            <MaybeWrap wrap={wrapLabel} className="sui-field-label">
              {rawDescription && (
                <DescriptionFieldTemplate
                  id={`${id}-description`}
                  description={rawDescription}
                />
              )}
            </MaybeWrap>
          )}
          {help}
          {errors}
        </MaybeWrap>
      </Form.Group>
    </WrapIfAdditional>
  );
}

export default FieldTemplate;
