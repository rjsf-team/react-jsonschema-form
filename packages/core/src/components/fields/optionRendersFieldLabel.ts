import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { rendersOwnFieldBesideOption, uiBooleanOption } from '@rjsf/utils';

/** Whether the field of the selected `anyOf`/`oneOf` option of `schema` renders the title and description of the field
 * holding the options. A field its own template leaves unlabelled, such as an array or a checkbox, has them rendered
 * nowhere else, so they go to the option's field, unless the uiSchema turns the label off, which a JSON uiSchema may
 * spell `null`, `0` or `''` as well as `false`. An object's own `ObjectField` renders them beside the option.
 * `MultiSchemaField` hands them to the option's field, the description only to an option that declares none of its own,
 * and `SchemaField` withholds the description from the field's own template, since a template that renders the
 * description of a field it leaves unlabelled, as antd's does, would otherwise render it a second time.
 *
 * @param schema - The schema holding the options
 * @param label - The `label` ui option of the field holding the options, the form's global one included
 * @param displayLabel - Whether the field's own template labels it, as `getDisplayLabel()` decides
 * @returns - True when the option's field renders the field's title, and its description where the option has none
 */
export default function optionRendersFieldLabel<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  label: unknown,
  displayLabel: boolean,
): boolean {
  return !displayLabel && uiBooleanOption(label) !== false && !rendersOwnFieldBesideOption<S>(schema);
}
