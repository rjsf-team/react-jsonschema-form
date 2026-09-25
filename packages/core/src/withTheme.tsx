import type { ReactElement } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { FormProps } from './components/Form.tsx';
import Form from './components/Form.tsx';

/** The properties for the `withTheme` function, essentially a subset of properties from the `FormProps` that can be
 * overridden while creating a theme
 */
export type ThemeProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<FormProps<T, S, F>, 'fields' | 'templates' | 'widgets'>;

/** The `Form` returned by `withTheme()`. It stays generic over the form data like `Form` itself, so `T` is inferred
 * from `formData` or named per use (`<ThemedForm<MyData> />`) instead of being fixed when the theme is applied; a theme
 * written for `T` serves any data assignable to it.
 */
export type ThemedForm<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = <TT extends T = T>(props: FormProps<TT, S, F>) => ReactElement;

/** A Higher-Order component that creates a wrapper around a `Form` with the overrides from the `WithThemeProps`.
 *
 * Returns a plain function component, not a `forwardRef`-wrapped one. Don't pass the return value directly to
 * `useState()` or a state setter (e.g. `useState(withTheme(theme))`, `setForm(withTheme(theme))`) — React treats a
 * bare function passed there as a lazy initializer/updater and calls it immediately with no arguments, which crashes.
 * Wrap it in a lazy initializer instead: `useState(() => withTheme(theme))`.
 */
export default function withTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(themeProps: ThemeProps<T, S, F>): ThemedForm<T, S, F> {
  return function ThemedForm<TT extends T = T>({
    fields: propFields,
    widgets: propWidgets,
    templates: propTemplates,
    ref,
    ...directProps
  }: FormProps<TT, S, F>) {
    // The theme's components were typed for `T`; they render the narrower `TT` the form is given
    const theme = themeProps as ThemeProps<TT, S, F>;
    const fields = { ...theme?.fields, ...propFields };
    const widgets = { ...theme?.widgets, ...propWidgets };
    const templates = {
      ...theme?.templates,
      ...propTemplates,
      ButtonTemplates: {
        ...theme?.templates?.ButtonTemplates,
        ...propTemplates?.ButtonTemplates,
      },
    };

    return <Form<TT, S, F> {...directProps} fields={fields} widgets={widgets} templates={templates} ref={ref} />;
  };
}
