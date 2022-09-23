import React from "react";
import {
  ADDITIONAL_PROPERTY_FLAG,
  WrapIfAdditionalTemplateProps,
} from "@rjsf/utils";

import Label from "./FieldTemplate/Label";

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<T = any, F = any>(
  props: WrapIfAdditionalTemplateProps<T, F>
) {
  const {
    id,
    classNames,
    disabled,
    label,
    onKeyChange,
    onDropPropertyClick,
    readonly,
    required,
    schema,
    children,
    uiSchema,
    registry,
  } = props;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = registry.templates.ButtonTemplates;
  const keyLabel = `${label} Key`; // i18n ?
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return <div className={classNames}>{children}</div>;
  }

  return (
    <div className={classNames}>
      <div className="row">
        <div className="col-xs-5 form-additional">
          <div className="form-group">
            <Label label={keyLabel} required={required} id={`${id}-key`} />
            <input
              className="form-control"
              type="text"
              id={`${id}-key`}
              onBlur={(event) => onKeyChange(event.target.value)}
              defaultValue={label}
            />
          </div>
        </div>
        <div className="form-additional form-group col-xs-5">{children}</div>
        <div className="col-xs-2">
          <RemoveButton
            className="array-item-remove btn-block"
            style={{ border: "0" }}
            disabled={disabled || readonly}
            onClick={onDropPropertyClick(label)}
            uiSchema={uiSchema}
          />
        </div>
      </div>
    </div>
  );
}
