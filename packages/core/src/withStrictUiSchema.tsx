import type { ComponentType } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiOptions, UiSchema } from '@rjsf/utils';

import type { FormProps } from './components/Form.tsx';

/** The props of a component returned by `withStrictUiSchema`: identical to `FormProps`, except `uiSchema` is typed
 * as `UiOptions<T, S, F, Checks>` instead of `UiSchema<T, S, F>`.
 */
export type StrictUiSchemaFormProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
  Checks = never,
> = Omit<FormProps<T, S, F>, 'uiSchema'> & {
  /** The uiSchema for the form, type-checked against `T` via `UiOptions` instead of `UiSchema`'s permissive
   * `Record<string, any>`.
   */
  uiSchema?: UiOptions<T, S, F, Checks>;
};

/** A Higher-Order Component that wraps a `Form` (or a themed `Form` returned by `withTheme()`) and returns a
 * version of it whose `uiSchema` prop is checked against `UiOptions<T, S, F, Checks>` instead of `UiSchema<T, S, F>`.
 *
 * A plain `UiSchema<T,S,F> | UiOptions<T,S,F,Checks>` union on `uiSchema` would not catch anything extra: as long as
 * `UiSchema`'s permissive `Record<string, any>` remains an accepted alternative, an inline `uiSchema` literal that
 * fails `UiOptions`'s stricter check simply matches the permissive member instead, with no error. Only exposing
 * `UiOptions` - with no permissive fallback for a mistake to slip through - actually catches it, which is what this
 * wrapper is for.
 *
 * `UiOptions` is a compile-time-only construct with no runtime representation, so this wrapper does no runtime
 * validation or transformation of its own - it renders `FormComponent` with the exact same props it was given, and
 * the extra type safety exists only at compile time, for consumers that render through this wrapper instead of
 * `FormComponent` directly.
 */
export default function withStrictUiSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
  Checks = never,
>(FormComponent: ComponentType<FormProps<T, S, F>>): ComponentType<StrictUiSchemaFormProps<T, S, F, Checks>> {
  return function StrictUiSchemaForm({ uiSchema, ref, ...directProps }: StrictUiSchemaFormProps<T, S, F, Checks>) {
    return (
      <FormComponent
        {...(directProps as Omit<FormProps<T, S, F>, 'uiSchema' | 'ref'>)}
        uiSchema={uiSchema as UiSchema<T, S, F> | undefined}
        ref={ref}
      />
    );
  };
}
