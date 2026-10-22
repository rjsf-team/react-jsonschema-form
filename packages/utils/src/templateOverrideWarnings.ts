import describeUnresolvedComponent from './describeUnresolvedComponent.ts';
import type { TemplateWarnSource } from './getTemplate.ts';
import logOnce from './logOnce.ts';
import type { FormContextType, TemplatesType, Registry, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** The names `getTemplate()` warns about: the templates `TemplatesType` declares. The registry may also hold templates
 * of a custom name, and `uiOptions` holds ordinary options such as `help`, so a value under a name outside this list
 * that is not a component is as likely an option as a mistake. The record is keyed by the declared keys alone (the
 * index signature's `string` is remapped out), so a template added to `TemplatesType` fails to compile until it is
 * listed here.
 */
const TEMPLATE_NAMES: Record<keyof { [K in keyof TemplatesType as string extends K ? never : K]: unknown }, true> = {
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

/** Whether `name` is one of the templates `TemplatesType` declares, rather than a custom template or an ordinary
 * option. Internal to `@rjsf/utils`: `package.json` excludes this module from the `./lib/*.js` exports wildcard so it
 * can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 *
 * @param name - The name to check
 * @returns - True when `name` is a declared template name
 */
export function isTemplateName(name: string): boolean {
  return Object.hasOwn(TEMPLATE_NAMES, name);
}

/** Logs the invalid-override warning once per message, naming the field's entry for an own `ui:` option and
 * `ui:globalOptions` for an inherited one, so a changed value logs again */
export function warnOnInvalidOverride<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  name: string,
  override: unknown,
  template: unknown,
  registry: Registry<T, S, F>,
  warnSource: TemplateWarnSource<T, S, F>,
): void {
  const globalOverrides: Record<string, unknown> = registry.globalUiOptions ?? {};
  // The merged options spread the field's own entries last, so a key the field set itself is its own mistake even
  // when it repeats the global value
  const fromGlobal = !Object.hasOwn(warnSource.ownUiOptions, name) && Object.hasOwn(globalOverrides, name);
  // `entryLabel()` runs only for an own override, so the label of a field without one is never built
  const target = fromGlobal ? `ui:globalOptions.${name}` : `ui:${name} for ${warnSource.entryLabel()}`;
  const description = describeUnresolvedComponent(override, template, 'registered template', 'MyTemplate');
  logOnce(`${target} ${description}, so it is ignored.`);
}
