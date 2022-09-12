import React from "react";
import { FieldErrorProps } from "@rjsf/utils";

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<T = any, F = any>(
  props: FieldErrorProps<T, F>
) {
  const { errors = [], idSchema } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = `${idSchema.$id}__error`;

  return (
    <div>
      <ul id={id} className="error-detail bs-callout bs-callout-info">
        {errors
          .filter((elem: string) => !!elem)
          .map((error: string, index: number) => {
            return (
              <li className="text-danger" key={index}>
                {error}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
