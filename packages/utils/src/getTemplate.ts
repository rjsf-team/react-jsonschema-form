import { TemplatesType, Registry, UIOptionsType } from "./types";

/** Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
 * otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.
 *
 * @param name - The name of the template to fetch, restricted to the keys of `TemplatesType`
 * @param registry - The `Registry` from which to read the template
 * @param [uiOptions={}] - The `UIOptionsType` from which to read an alternate template
 * @returns - The template from either the `uiSchema` or `registry` for the `name`
 */
export default function getTemplate<
  Name extends keyof TemplatesType<T, F>,
  T = any,
  F = any
>(
  name: Name,
  registry: Registry<T, F>,
  uiOptions: UIOptionsType<T, F> = {}
): TemplatesType<T, F>[Name] {
  const { templates } = registry;
  if (name === "ButtonTemplates") {
    return templates[name];
  }
  return (uiOptions[name] as TemplatesType<T, F>[Name]) || templates[name];
}
