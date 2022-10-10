import React from "react";
import { getTemplate, getUiOptions, FieldTemplateProps } from "@rjsf/utils";
import { Form } from "semantic-ui-react";
import { getSemanticProps, MaybeWrap } from "../util";

function FieldTemplate({
  id,
  children,
  classNames,
  displayLabel,
  label,
  errors,
  help,
  hidden,
  rawDescription,
  registry,
  schema,
  uiSchema,
  ...props
}: FieldTemplateProps) {
  const semanticProps = getSemanticProps(props);
  const { wrapLabel, wrapContent } = semanticProps;
  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<"WrapIfAdditionalTemplate">(
    "WrapIfAdditionalTemplate",
    registry,
    uiOptions
  );
  const DescriptionFieldTemplate = getTemplate<"DescriptionFieldTemplate">(
    "DescriptionFieldTemplate",
    registry,
    uiOptions
  );

  if (hidden) {
    return <div style={{ display: "none" }}>{children}</div>;
  }

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      id={id}
      label={label}
      registry={registry}
      schema={schema}
      uiSchema={uiSchema}
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
                  schema={schema}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              )}
            </MaybeWrap>
          )}
          {help}
          {errors}
        </MaybeWrap>
      </Form.Group>
    </WrapIfAdditionalTemplate>
  );
}

export default FieldTemplate;
