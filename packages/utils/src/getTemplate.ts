import isComponentType from './isComponentType.ts';
import { isTemplateName, warnOnInvalidOverride } from './templateOverrideWarnings.ts';
import type { FormContextType, TemplatesType, Registry, UIOptionsType, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** The field a template-override warning should name, passed by the one caller that renders every field
 * (`SchemaField`) so each warning is logged once, labelled, from there rather than once per `getTemplate()` caller.
 * Both parts are read only when an override is actually invalid, so a form without one never pays for them.
 */
export interface TemplateWarnSource<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** Builds the label of the uiSchema entry the field is rendered from, such as `"root_tasks_[]_title"
   * (tasks[].title)`, so one entry warns once however many rows render it */
  entryLabel: () => string;
  /** The field's own UI options before `ui:globalOptions` is merged in, so an own mistake is told apart from one the
   * field inherits */
  ownUiOptions: UIOptionsType<T, S, F>;
}

/** Returns the registry template `name` refers to, or `undefined` when the registry holds nothing under it */
function lookupTemplate(customTemplates: Record<string, unknown>, name: string): unknown {
  return Object.hasOwn(customTemplates, name) ? customTemplates[name] : undefined;
}

/** Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
 * otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.
 *
 * An override that is not a component is ignored, warning when a `warnSource` is given: a string naming no registered
 * template, a React element, or any other non-component value falls back to a valid `ui:globalOptions` template before
 * the registry's own, as `resolveUiField()` does for `ui:field`. An explicit own `null` is not a mistake: it opts the
 * field out of any override, `ui:globalOptions` included, so the registry's own template renders without a warning.
 *
 * @param name - The name of the template to fetch, restricted to the keys of `TemplatesType`
 * @param registry - The `Registry` from which to read the template
 * @param [uiOptions={}] - The `UIOptionsType` from which to read an alternate template
 * @param [warnSource] - Names the field for the override warnings and tells an own option apart from an inherited
 * one; omitted by callers that only resolve, which stay silent
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
  warnSource?: TemplateWarnSource<T, S, F>,
): TemplatesType<T, S, F>[Name] {
  const { templates, globalUiOptions } = registry;
  if (name === 'ButtonTemplates') {
    return templates[name];
  }
  const customTemplates: Record<string, unknown> = templates;
  const uiOverrides: Record<string, unknown> = uiOptions;
  const override = uiOverrides[name] ?? undefined;
  // No override, or an explicit own `null` that opts out of any override (including `ui:globalOptions`, as an own
  // `null` `ui:field` does, though here `''`, `0` and `false` still warn): the registry's own template renders
  if (override === undefined) {
    return templates[name];
  }
  // Allow templates to be customized per-field by using string keys from the registry; a string naming no registered
  // template is not a component, so it falls through to the fallback below
  let template: unknown = override;
  if (typeof override === 'string') {
    template = lookupTemplate(customTemplates, override);
  }
  if (isComponentType(template)) {
    // Indexing templates or uiOptions by a generic key results in TS2590: Expression produces a union type that is too
    // complex to represent, so both are read through string-keyed views. Nothing checks the props a `ui:options` or
    // registry entry accepts, so this is the one place the found component is asserted to be the template type
    return template as TemplatesType<T, S, F>[Name];
  }
  // Only the declared templates warn: a custom template can share its name with an ordinary option such as `help`
  if (warnSource && isTemplateName(name)) {
    warnOnInvalidOverride(name, override, template, registry, warnSource);
  }
  // An invalid own override falls back to a valid `ui:globalOptions` template before the registry's own
  const globalOverride: unknown = globalUiOptions?.[name];
  if (globalOverride !== undefined && globalOverride !== override) {
    let globalTemplate: unknown = globalOverride;
    if (typeof globalOverride === 'string') {
      globalTemplate = lookupTemplate(customTemplates, globalOverride);
    }
    if (isComponentType(globalTemplate)) {
      return globalTemplate as TemplatesType<T, S, F>[Name];
    }
  }
  return templates[name];
}
