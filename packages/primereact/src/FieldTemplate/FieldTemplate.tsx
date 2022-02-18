import { FieldTemplateProps } from "@rjsf/core";
import cn from "clsx";
import React from "react";

const FieldTemplate = ({
  id,
  hidden,
  children,
  displayLabel,
  rawErrors = [],
  rawHelp,
  rawDescription,
}: FieldTemplateProps) => {
  if (hidden) {
    return <>{children}</>;
  }

  return (
    <div>
      {children}
      {displayLabel && rawDescription && (
        <div className={rawErrors.length > 0 ? "text-color-danger" : "text-color-muted"}>
          {rawDescription}
        </div>
      )}
      {rawErrors.length > 0 && (
        <ul>
          {rawErrors.map((error: string) => (
            <li key={error} className="m-0 p-0">
              <small className="m-0 text-color-danger">
                {error}
              </small>
            </li>
          ))}
        </ul>
      )}
      {rawHelp && (
        <small
          id={id}
          className={cn("block", rawErrors.length > 0 ? "text-color-danger" : "text-color-muted")}
        >
          {rawHelp}
        </small>
      )}
    </div>
  );
};

export default FieldTemplate;
