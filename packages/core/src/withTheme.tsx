import type { ComponentType } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { FormProps } from './components/Form.tsx';
import Form from './components/Form.tsx';

/** The properties for the `withTheme` function, essentially a subset of properties from the `FormProps` that can be
 * overridden while creating a theme
 */
export type ThemeProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> = Pick<
  FormProps<T, S, F>,
  'fields' | 'templates' | 'widgets' | '_internalFormWrapper'
>;

/** A Higher-Order component that creates a wrapper around a `Form` with the overrides from the `WithThemeProps`.
 *
 * Returns a plain function component, not a `forwardRef`-wrapped one. Don't pass the return value directly to
 * `useState()` or a state setter (e.g. `useState(withTheme(theme))`, `setForm(withTheme(theme))`) — React treats a
 * bare function passed there as a lazy initializer/updater and calls it immediately with no arguments, which crashes.
 * Wrap it in a lazy initializer instead: `useState(() => withTheme(theme))`.
 */
export default function withTheme<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  themeProps: ThemeProps<T, S, F>,
): ComponentType<FormProps<T, S, F>> {
  return function ThemedForm({
    fields: propFields,
    widgets: propWidgets,
    templates: propTemplates,
    ref,
    ...directProps
  }: FormProps<T, S, F>) {
    const fields = { ...themeProps?.fields, ...propFields };
    const widgets = { ...themeProps?.widgets, ...propWidgets };
    const templates = {
      ...themeProps?.templates,
      ...propTemplates,
      ButtonTemplates: {
        ...themeProps?.templates?.ButtonTemplates,
        ...propTemplates?.ButtonTemplates,
      },
    };

    return (
      <Form<T, S, F>
        {...themeProps}
        {...directProps}
        fields={fields}
        widgets={widgets}
        templates={templates}
        ref={ref}
      />
    );
  };
}
