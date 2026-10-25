import describeUnresolvedComponent from './describeUnresolvedComponent.ts';
import type { TemplateWarnSource } from './getTemplate.ts';
import logOnce from './logOnce.ts';
import type { TemplatesType } from './types.ts';

/** The names of the templates `TemplatesType` declares that a field's options may override (every one but
 * `ButtonTemplates`, which `getTemplate()` reads from the registry alone), as an object checked against
 * `TemplatesType` so that a template added there without being listed here is a type error. The one list of these
 * names: `isTemplateName()` checks against it and `globalUiOptionsKeys.ts` spreads it into
 * `RESERVED_UI_OPTION_NAMES`, so a new template goes in here only. Exported for `globalUiOptionsKeys.ts` alone; this
 * module is internal (see below), so the map stays out of the public API.
 */
export const OVERRIDABLE_TEMPLATE_NAME_MAP = {
  ArrayFieldDescriptionTemplate: true,
  ArrayFieldItemButtonsTemplate: true,
  ArrayFieldItemTemplate: true,
  ArrayFieldTemplate: true,
  ArrayFieldTitleTemplate: true,
  BaseInputTemplate: true,
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
} satisfies Record<
  Exclude<keyof { [K in keyof TemplatesType as string extends K ? never : K]: unknown }, 'ButtonTemplates'>,
  true
>;

const TEMPLATE_NAME_SET: ReadonlySet<string> = new Set(Object.keys(OVERRIDABLE_TEMPLATE_NAME_MAP));

/** Whether `name` is one of the templates `TemplatesType` declares, rather than a custom template or an ordinary
 * option. The registry may also hold templates of a custom name, and `uiOptions` holds ordinary options such as
 * `help`, so a value under a name outside this list that is not a component is as likely an option as a mistake.
 * Internal to `@rjsf/utils`: `package.json` excludes this module from the `./lib/*.js` exports wildcard so it
 * can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 *
 * @param name - The name to check
 * @returns - True when `name` is a declared template name
 */
export function isTemplateName(name: string): boolean {
  return TEMPLATE_NAME_SET.has(name);
}

/** Logs the invalid-override warning once per message, naming the field's entry, so a changed value logs again */
export function warnOnInvalidOverride(
  name: string,
  override: unknown,
  template: unknown,
  warnSource: TemplateWarnSource,
): void {
  const target = `ui:${name} for ${warnSource.entryLabel()}`;
  const description = describeUnresolvedComponent(override, template, 'registered template', 'MyTemplate');
  logOnce(`${target} ${description}, so it is ignored.`);
}
