import React from "react";
import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from "@rjsf/utils";

/** The `ErrorListTemplate` component renders the errors in the form
 *
 * @param props - The `ErrorListProps` for the component
 */
const ErrorListTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) => {
  const { translateString } = registry;
  return (
    <div className="usa-alert usa-alert--error" role="alert">
      <div className="usa-alert__body">
        <h4 className="usa-alert__heading">
          {translateString(TranslatableString.ErrorsLabel)}
        </h4>
        <ul className="usa-list usa-list--unstyled">
          {errors.map((error, i: number) => {
            return (
              <li key={i} className="usa-alert__text">
                {error.stack}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ErrorListTemplate;
