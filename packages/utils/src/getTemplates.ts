import getTemplate from './getTemplate.ts';
import type { FormContextType, TemplatesType, Registry, UIOptionsType, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** Returns every template in the `registry`, with each one that `uiOptions` overrides resolved the way `getTemplate`
 * resolves it. Only templates the registry already holds are resolved: an override for a name the registry lacks is
 * left out, since `uiOptions` also holds non-template options. Destructure the templates a component renders from the
 * result: React's static-components rule doesn't follow a destructure, so it accepts them where it reports the result
 * of a `getTemplate()` call. It can't check them either, so this relies on the registry and `uiOptions` holding
 * components defined at module scope.
 *
 * @param registry - The `Registry` from which to read the templates
 * @param [uiOptions={}] - The `UIOptionsType` from which to read alternate templates
 * @returns - The templates from either the `uiSchema` or `registry`
 */
export default function getTemplates<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(registry: Registry<T, S, F>, uiOptions: UIOptionsType<T, S, F> = {}): TemplatesType<T, S, F> {
  const overridden = Object.keys(uiOptions).filter((name) => Object.hasOwn(registry.templates, name));
  // Every field and widget calls this on each render, so the registry's own map is returned as-is unless an override
  // actually applies
  if (overridden.length === 0) {
    return registry.templates;
  }
  const templates = { ...registry.templates };
  for (const name of overridden) {
    templates[name] = getTemplate(name, registry, uiOptions);
  }
  return templates;
}
