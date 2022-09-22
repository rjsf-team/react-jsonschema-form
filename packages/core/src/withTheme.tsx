import React, { ForwardedRef, forwardRef } from "react";

import Form, { FormProps } from "./components/Form";

/** The properties for the `withTheme` function, essentially a subset of properties from the `FormProps` that can be
 * overridden while creating a theme
 */
export type ThemeProps<T = any, F = any> = Pick<
  FormProps<T, F>,
  "fields" | "templates" | "widgets" | "_internalFormWrapper"
>;

/** A Higher-Order component that creates a wrapper around a `Form` with the overrides from the `WithThemeProps` */
export default function withTheme<T = any, F = any>(
  themeProps: ThemeProps<T, F>
) {
  return forwardRef(
    (
      { fields, widgets, templates, ...directProps }: FormProps<T, F>,
      ref: ForwardedRef<Form<T, F>>
    ) => {
      fields = { ...themeProps.fields, ...fields };
      widgets = { ...themeProps.widgets, ...widgets };
      templates = {
        ...themeProps.templates,
        ...templates,
        ButtonTemplates: {
          ...themeProps?.templates?.ButtonTemplates,
          ...templates?.ButtonTemplates,
        },
      };

      return (
        <Form<T, F>
          {...themeProps}
          {...directProps}
          fields={fields}
          widgets={widgets}
          templates={templates}
          ref={ref}
        />
      );
    }
  );
}
