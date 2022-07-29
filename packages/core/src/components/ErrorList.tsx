import React from "react";
import { ErrorListProps, RJSFValidationError } from "@rjsf/utils";

/** The `ErrorList` component renders the all of the errors associated with the fields in the `Form` */
export default function ErrorList<T = any>({ errors }: ErrorListProps<T>) {
  return (
    <div className="panel panel-danger errors">
      <div className="panel-heading">
        <h3 className="panel-title">Errors</h3>
      </div>
      <ul className="list-group">
        {errors.map((error: RJSFValidationError, i: number) => {
          return (
            <li key={i} className="list-group-item text-danger">
              {error.stack}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
