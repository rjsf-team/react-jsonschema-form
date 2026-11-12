import describeUnresolvedComponent from './describeUnresolvedComponent.ts';
import logOnce from './logOnce.ts';
import type { DeclaredTemplatesType } from './types.ts';

/** The names of the templates `DeclaredTemplatesType` declares that a field's options may override (every one but
 * `ButtonTemplates`, which `getTemplate()` reads from the registry alone), as an object checked against
 * `DeclaredTemplatesType` so that a template declared there without being listed here is a type error. The one list of these
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
} satisfies Record<Exclude<keyof DeclaredTemplatesType, 'ButtonTemplates'>, true>;

const TEMPLATE_NAME_SET: ReadonlySet<string> = new Set(Object.keys(OVERRIDABLE_TEMPLATE_NAME_MAP));

/** Whether `name` is one of the templates `TemplatesType` declares, rather than a custom template or an ordinary
 * option. The registry may also hold templates of a custom name, and `uiOptions` holds ordinary options such as
 * `help`, so a value under a name outside this list that is not a component is as likely an option as a mistake.
 *
 * @param name - The name to check
 * @returns - True when `name` is a declared template name
 */
export function isTemplateName(name: string): boolean {
  return TEMPLATE_NAME_SET.has(name);
}

/** The message last built for each entry label and template name, with the override and the template it resolved to
 * that it was built for. A field passes the same label function on every render, so a warning still raised for an
 * unchanged override reuses the message instead of rebuilding the label and description only for `logOnce()` to drop
 * it. Keyed weakly, so an unmounted field's entry is let go
 */
const builtMessages = new WeakMap<
  () => string,
  Map<string, { override: unknown; template: unknown; message: string }>
>();

/** Logs the invalid-override warning once per message, naming the field's entry, so a changed value logs again. The
 * message still goes through `logOnce()` when it is reused, so `resetLogOnce()` lets it log again as it would any other
 */
export function warnOnInvalidOverride(
  name: string,
  override: unknown,
  template: unknown,
  entryLabel: () => string,
): void {
  let byName = builtMessages.get(entryLabel);
  if (!byName) {
    byName = new Map();
    builtMessages.set(entryLabel, byName);
  }
  const built = byName.get(name);
  if (built && Object.is(built.override, override) && Object.is(built.template, template)) {
    logOnce(built.message);
    return;
  }
  // The value may sit under `ui:${name}` or under `ui:options`, so the warning names both rather than send the
  // user looking for a key that isn't there
  const target = `${name} (ui:${name} or ui:options) for ${entryLabel()}`;
  const description = describeUnresolvedComponent(override, template, 'registered template', 'MyTemplate');
  const message = `${target} ${description}, so it is ignored.`;
  byName.set(name, { override, template, message });
  logOnce(message);
}
