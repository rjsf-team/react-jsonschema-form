import isComponentType from './isComponentType.ts';
import { isTemplateName, warnOnInvalidOverride } from './templateOverrideWarnings.ts';
import type { FormContextType, TemplatesType, Registry, UIOptionsType, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
 * otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.
 *
 * An override for one of the declared templates that is not a component is ignored, warning when an `entryLabel` is
 * given: a string naming no registered template, a React element, or any other non-component value falls back to the
 * registry's own template. Templates are per-field options, not `ui:globalOptions`. An explicit own `null` renders
 * the registry's own template without a warning. An override under a custom name can't be told apart from an
 * ordinary option, so it is returned unchecked and without a warning: a truthy value (a component or a `Record` of
 * them) as-is, a string looked up among the registry's templates, a falsy one falling back.
 *
 * @param name - The name of the template to fetch, restricted to the keys of `TemplatesType`
 * @param registry - The `Registry` from which to read the template
 * @param [uiOptions={}] - The `UIOptionsType` from which to read an alternate template
 * @param [entryLabel] - Builds the label of the uiSchema entry the field is rendered from, such as
 * `"root_tasks_[]_title" (tasks[].title)`, so one entry warns once however many rows render it; read only when an
 * override is actually invalid, and omitted by callers that only resolve, which stay silent
 * @returns - The template from either the `uiSchema` or `registry` for the `name`
 */
export default function getTemplate<
  Name extends keyof TemplatesType<T, S, F>,
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  name: Name,
  registry: Registry<T, S, F>,
  uiOptions: UIOptionsType<T, S, F> = {},
  entryLabel?: () => string,
): TemplatesType<T, S, F>[Name] {
  const { templates } = registry;
  if (name === 'ButtonTemplates') {
    return templates[name];
  }
  const customTemplates: Record<string, unknown> = templates;
  const uiOverrides: Record<string, unknown> = uiOptions;
  const override = uiOverrides[name] ?? undefined;
  // No override, or an explicit own `null`: the registry's own template renders silently.
  // Other falsy values (`''`, `0` and `false`) still warn for the declared templates.
  if (override === undefined) {
    return templates[name];
  }
  // A string names a template in the registry; a name nothing is registered under resolves to undefined. Resolved
  // once here so the custom-name and declared-name branches below read the same resolved value
  let template: unknown = override;
  if (typeof override === 'string') {
    template = Object.hasOwn(customTemplates, override) ? customTemplates[override] : undefined;
  }
  // A custom name can't be told apart from an ordinary option such as `help`, so an override under one is returned
  // unchecked and without a warning: a truthy value (a component or a group of them) as-is, a falsy one falling
  // back to the registry's own template
  if (!isTemplateName(name)) {
    return (template || templates[name]) as TemplatesType<T, S, F>[Name];
  }
  // A string naming no registered template is not a component, so it falls through to the fallback below
  if (isComponentType(template)) {
    // Indexing templates or uiOptions by a generic key results in TS2590: Expression produces a union type that is too
    // complex to represent, so both are read through string-keyed views. Nothing checks the props a `ui:options` or
    // registry entry accepts, so this is the one place the found component is asserted to be the template type
    return template as TemplatesType<T, S, F>[Name];
  }
  if (entryLabel) {
    warnOnInvalidOverride(name, override, template, entryLabel);
  }
  return templates[name];
}
