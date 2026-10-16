import describeUnresolvedComponent from './describeUnresolvedComponent.ts';
import isComponentType from './isComponentType.ts';
import logOnce from './logOnce.ts';
import type { FormContextType, TemplatesType, Registry, UIOptionsType, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** The names `getTemplate()` warns about: the templates `TemplatesType` declares. The registry may also hold templates
 * of a custom name, and `uiOptions` holds ordinary options such as `help`, so a value under a name outside this list
 * that is not a component is as likely an option as a mistake. Typed as a record so a template added to
 * `TemplatesType` fails to compile until it is listed here.
 */
const TEMPLATE_NAMES: Record<keyof TemplatesType, true> = {
  ArrayFieldDescriptionTemplate: true,
  ArrayFieldItemButtonsTemplate: true,
  ArrayFieldItemTemplate: true,
  ArrayFieldTemplate: true,
  ArrayFieldTitleTemplate: true,
  BaseInputTemplate: true,
  ButtonTemplates: true,
  CyclicSchemaExpandTemplate: true,
  DescriptionFieldTemplate: true,
  ErrorListTemplate: true,
  FallbackFieldTemplate: true,
  FieldErrorTemplate: true,
  FieldHelpTemplate: true,
  FieldTemplate: true,
  GridTemplate: true,
  MarkdownTemplate: true,
  MultiSchemaFieldTemplate: true,
  ObjectFieldTemplate: true,
  OptionalDataControlsTemplate: true,
  TitleFieldTemplate: true,
  UnsupportedFieldTemplate: true,
  WrapIfAdditionalTemplate: true,
};

/** Whether `name` is one of the templates `TemplatesType` declares, rather than a custom template or an ordinary option
 *
 * @param name - The name to check
 * @returns - True when `name` is a declared template name
 */
export function isTemplateName(name: string): boolean {
  return Object.hasOwn(TEMPLATE_NAMES, name);
}

/** Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
 * otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.
 *
 * An override that is not a component is ignored with a warning, as is a registry template that is not one.
 *
 * @param name - The name of the template to fetch, restricted to the keys of `TemplatesType`
 * @param registry - The `Registry` from which to read the template
 * @param [uiOptions={}] - The `UIOptionsType` from which to read an alternate template
 * @param [fieldLabel] - Names the field the options belong to, such as `"root_name" (name)`, for the warnings
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
  fieldLabel?: string,
): TemplatesType<T, S, F>[Name] {
  return resolveTemplate<Name, T, S, F>(name, registry, uiOptions, isTemplateName(name), fieldLabel);
}

/** Resolves the template `name` as `getTemplate()` does, warning about a value that is not a component only when `warn`
 * is set. `getTemplates()` resolves custom-named templates too, and clears `warn` for those.
 *
 * @param name - The name of the template to fetch
 * @param registry - The `Registry` from which to read the template
 * @param uiOptions - The `UIOptionsType` from which to read an alternate template
 * @param warn - Whether to warn about an override or registry template that is not a component
 * @param [fieldLabel] - Names the field the options belong to, for the warnings
 * @returns - The template from either the `uiSchema` or `registry` for the `name`
 */
export function resolveTemplate<
  Name extends keyof TemplatesType<T, S, F>,
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  name: Name,
  registry: Registry<T, S, F>,
  uiOptions: UIOptionsType<T, S, F>,
  warn: boolean,
  fieldLabel?: string,
): TemplatesType<T, S, F>[Name] {
  const { templates } = registry;
  if (name === 'ButtonTemplates') {
    return templates[name];
  }
  const customTemplates: Record<string, unknown> = templates;
  const uiOverrides: Record<string, unknown> = uiOptions;
  const override = uiOverrides[name];
  // Allow templates to be customized per-field by using string keys from the registry; a string naming no registered
  // template is not a component, so warn and use the registry's own template instead
  let template = override;
  if (typeof override === 'string') {
    template = Object.hasOwn(customTemplates, override) ? customTemplates[override] : undefined;
  }
  if (!isComponentType(template)) {
    if (warn && override !== undefined) {
      // Only reached for an override that is already wrong, and `logOnce()` shows each distinct message once, so the
      // message is built on this path alone
      const globalOverrides: Record<string, unknown> = registry.globalUiOptions ?? {};
      const fromGlobal = Object.hasOwn(globalOverrides, name) && globalOverrides[name] === override;
      const option = fromGlobal ? `ui:globalOptions.${name}` : `ui:${name}`;
      const where = fieldLabel && !fromGlobal ? ` for ${fieldLabel}` : '';
      const description = describeUnresolvedComponent(override, template, 'registered template', 'MyTemplate');
      logOnce(`${option}${where} ${description}, so it is ignored.`);
    }
    const fallback = customTemplates[name];
    if (warn && !isComponentType(fallback)) {
      const description = describeUnresolvedComponent(fallback, fallback, 'registered template', 'MyTemplate');
      logOnce(`The registry's ${name} ${description}.`);
    }
    return templates[name];
  }
  // Indexing templates or uiOptions by a generic key results in TS2590: Expression produces a union type that is too
  // complex to represent, so both are read through string-keyed views. Nothing checks the props a `ui:options` or
  // registry entry accepts, so this is the one place the found component is asserted to be the template type
  return template as TemplatesType<T, S, F>[Name];
}
