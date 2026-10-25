import isComponentType from './isComponentType.ts';
import { isTemplateName, warnOnInvalidOverride } from './templateOverrideWarnings.ts';
import type { FormContextType, TemplatesType, Registry, UIOptionsType, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** The field a template-override warning should name, passed by the callers that render a field (`SchemaField`, and
 * `CyclicSchemaField` for its expand template) so each warning is logged once, labelled, from there rather than once
 * per `getTemplate()` caller. The label is read only when an override is actually invalid, so a form without one
 * never pays for it.
 */
export interface TemplateWarnSource {
  /** Builds the label of the uiSchema entry the field is rendered from, such as `"root_tasks_[]_title"
   * (tasks[].title)`, so one entry warns once however many rows render it */
  entryLabel: () => string;
}

/** Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
 * otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.
 *
 * An override for one of the declared templates that is not a component is ignored, warning when a `warnSource` is
 * given: a string naming no registered template, a React element, or any other non-component value falls back to the
 * registry's own template. Templates are per-field options, not `ui:globalOptions`. An explicit own `null` renders
 * the registry's own template without a warning. An override under a custom name can't be told apart from an
 * ordinary option, so it is returned the way it always has been, with no warning: a truthy value (a component or a
 * `Record` of them) as-is, a string looked up among the registry's templates, a falsy one falling back.
 *
 * @param name - The name of the template to fetch, restricted to the keys of `TemplatesType`
 * @param registry - The `Registry` from which to read the template
 * @param [uiOptions={}] - The `UIOptionsType` from which to read an alternate template
 * @param [warnSource] - Names the field for the override warnings; omitted by callers that only resolve, which
 * stay silent
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
  warnSource?: TemplateWarnSource,
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
  // A custom name can't be told apart from an ordinary option such as `help`, so an override under one keeps the
  // behavior it had before the override check: a truthy value (a component or a group of them) is returned as-is, a
  // string is looked up among the registry's templates, a falsy one falls back, and nothing warns
  if (!isTemplateName(name)) {
    let customTemplate: unknown = override;
    if (typeof override === 'string') {
      customTemplate = Object.hasOwn(customTemplates, override) ? customTemplates[override] : undefined;
    }
    if (!customTemplate) {
      return templates[name];
    }
    // Read through the same string-keyed views as the declared templates below, against TS2590
    return customTemplate as TemplatesType<T, S, F>[Name];
  }
  // Allow templates to be customized per-field by using string keys from the registry; a string naming no registered
  // template is not a component, so it falls through to the fallback below
  let template: unknown = override;
  if (typeof override === 'string') {
    template = Object.hasOwn(customTemplates, override) ? customTemplates[override] : undefined;
  }
  if (isComponentType(template)) {
    // Indexing templates or uiOptions by a generic key results in TS2590: Expression produces a union type that is too
    // complex to represent, so both are read through string-keyed views. Nothing checks the props a `ui:options` or
    // registry entry accepts, so this is the one place the found component is asserted to be the template type
    return template as TemplatesType<T, S, F>[Name];
  }
  if (warnSource) {
    warnOnInvalidOverride(name, override, template, warnSource);
  }
  return templates[name];
}
