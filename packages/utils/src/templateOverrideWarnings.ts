import { isValidElement } from 'react';

import describeUnresolvedComponent from './describeUnresolvedComponent.ts';
import type { TemplateWarnSource } from './getTemplate.ts';
import isComponentType from './isComponentType.ts';
import { rememberLogged } from './loggedMessages.ts';
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

/** `isComponentType()` results for each registry's `templates` object. The registry is static for the form's
 * lifetime, so its templates are checked once each rather than on every override-free render. */
const registryTemplateChecks = new WeakMap<Record<string, unknown>, Map<string, boolean>>();

/** Logs once when the registry's own `name` template is not a component, checking each registry template at most once */
export function warnOnInvalidRegistryTemplate(name: string, customTemplates: Record<string, unknown>): void {
  if (!isTemplateName(name)) {
    return;
  }
  let perName = registryTemplateChecks.get(customTemplates);
  if (perName === undefined) {
    perName = new Map();
    registryTemplateChecks.set(customTemplates, perName);
  }
  let valid = perName.get(name);
  if (valid === undefined) {
    valid = isComponentType(customTemplates[name]);
    perName.set(name, valid);
  }
  if (!valid) {
    const fallback = customTemplates[name];
    // A registry entry is used as given, never looked up by name, so a string one is described as the value it is
    const description = describeUnresolvedComponent(
      typeof fallback === 'string' ? undefined : fallback,
      fallback,
      'registered template',
      'MyTemplate',
    );
    logOnce(`The registry's ${name} ${description}.`);
  }
}

/** Logs the invalid-override warning once per uiSchema entry, naming the field's entry for an own `ui:` option and
 * `ui:globalOptions` for an inherited one */
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
  // The key keeps the distinctions the message makes (a string's text, an element, null, the type) so a changed value
  // logs again, and is remembered alongside `logOnce()`'s own messages so `resetLogOnce()` clears it and it is capped the
  // same way, while the message is still built only the first time
  const source = fromGlobal ? 'global' : warnSource.entryLabel();
  const valueTag = typeof override === 'string' ? override : '';
  const key = [name, source, typeof override, valueTag, isValidElement(override), override === null].join('\u0000');
  if (!rememberLogged(key)) {
    return;
  }
  const description = describeUnresolvedComponent(override, template, 'registered template', 'MyTemplate');
  const target = fromGlobal ? `ui:globalOptions.${name}` : `ui:${name} for ${source}`;
  // oxlint-disable-next-line no-console
  console.warn(`${target} ${description}, so it is ignored.`);
}
