import type {
  FormContextType,
  GlobalUISchemaOptions,
  RJSFSchema,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
  UiSchemaDefinitions,
} from '@rjsf/utils';
import { getXxxOfKey, isPlainObject, mergeSchemas } from '@rjsf/utils';

import { clearsIn, keepRecordedClears } from '../keepClears.ts';
import { asFieldValue } from '../uiState.ts';
import { withGlobalUiOptions } from './fieldWidgetUtils.ts';

/** The uiSchema the defaults of an option are computed with, and the registry's `ui:definitions` and global UI options,
 * which an option's uiSchema never carries itself
 */
interface OptionUiSchema<T, S extends StrictRJSFSchema, F extends FormContextType> {
  optionUiSchema?: UiSchema<T, S, F>;
  uiSchemaDefinitions?: UiSchemaDefinitions<S, F>;
  globalUiOptions?: GlobalUISchemaOptions;
}

/** What a field holds once `option` is picked for it: `carried`, what the field held that the option can take, filled
 * as on a first render with the option's defaults, so a `ui:initialValue` of the option reaches the fields the option
 * brings. Nothing `carried` holds is taken out or replaced here, and each `undefined` it holds is handed back: the form
 * judges each value against the option, gives a value the old option's defaults filled in the new option's, and keeps
 * the clears it recorded.
 *
 * A field that carries nothing to an option whose defaults are an object gets the defaults of the field with that
 * option as its only one, so a `default` the field itself declares lies beneath the option's own, as it does on mount
 * ([#5368](https://github.com/rjsf-team/react-jsonschema-form/issues/5368)).
 *
 * The defaults are computed from the option carrying the `required` its parent declares, which decides whether a key is
 * filled at all under a `defaultFormStateBehavior` keyed off `required`, and from none of the parent's other keywords:
 * a type the option never stated would build a value the option does not describe.
 *
 * @param schemaUtils - The schema utilities to compute the defaults with
 * @param parentSchema - The schema holding the `oneOf`/`anyOf`
 * @param option - The option switched to
 * @param carried - What the field held, undefined where it held nothing the option can take
 * @param [uiSchemas] - The option's own uiSchema, the registry's `ui:definitions` and the form's global UI options
 * @returns - The filled data, undefined when the option gives nothing and nothing was carried
 */
export default function defaultsForOption<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  parentSchema: S,
  option: S,
  carried: T | undefined,
  { optionUiSchema, uiSchemaDefinitions, globalUiOptions }: OptionUiSchema<T, S, F> = {},
): T | undefined {
  const uiSchema = withGlobalUiOptions<T, S, F>(optionUiSchema, globalUiOptions);
  const optionWithRequired = parentSchema.required
    ? (mergeSchemas({ required: parentSchema.required }, option) as S)
    : option;
  const filled = schemaUtils.getDefaultFormState(
    optionWithRequired,
    carried,
    'excludeObjectChildren',
    undefined,
    uiSchema,
    uiSchemaDefinitions,
  ) as T | undefined;
  if (carried !== undefined) {
    return isPlainObject(filled) ? asFieldValue<T>(keepRecordedClears(filled, carried, clearsIn(carried, []))) : filled;
  }
  const xxxOfKey = getXxxOfKey<S>(parentSchema);
  if (!xxxOfKey || !isPlainObject(filled)) {
    return filled;
  }
  // A uiSchema holding the option's own under the field's `anyOf`/`oneOf`, which TypeScript can't relate to the
  // `UiSchema<T>` of a generic `T`
  const ownUiSchema = optionUiSchema && ({ [xxxOfKey]: [optionUiSchema] } as UiSchema<T, S, F>);
  const ofField = schemaUtils.getDefaultFormState(
    { ...parentSchema, [xxxOfKey]: [option] },
    asFieldValue<T>({}),
    false,
    undefined,
    withGlobalUiOptions<T, S, F>(ownUiSchema, globalUiOptions),
    uiSchemaDefinitions,
  );
  return isPlainObject(ofField) ? ofField : filled;
}
