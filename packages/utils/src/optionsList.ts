import { CONST_KEY, DEFAULT_KEY, PROPERTIES_KEY } from './constants.ts';
import enumOptionClaimer from './enumOptionClaimer.ts';
import enumOptionValueLabel from './enumOptionValueLabel.ts';
import getDiscriminatorFieldFromSchema from './getDiscriminatorFieldFromSchema.ts';
import getPropertySchema from './getPropertySchema.ts';
import getUiOptions from './getUiOptions.ts';
import getXxxOfKey from './getXxxOfKey.ts';
import isConstantOptionList from './isConstantOptionList.ts';
import isContainerValue from './isContainerValue.ts';
import { getByPath } from './pathUtils.ts';
import toConstant from './toConstant.ts';
import type { RJSFSchema, EnumOptionsType, EnumValue, StrictRJSFSchema, FormContextType, UiSchema } from './types.ts';

/** Reorders `options` according to `order`, which may contain a `'*'` wildcard representing all
 * remaining options in their original order, listed at the first `'*'` only. Options not listed in `order` (and not
 * covered by a wildcard) are dropped. An `order` that isn't a list leaves them as they are.
 */
function applyEnumOrder<S extends StrictRJSFSchema = RJSFSchema>(
  options: EnumOptionsType<S>[],
  order?: EnumValue[],
): EnumOptionsType<S>[] {
  if (!Array.isArray(order)) {
    return options;
  }
  const { claim, unclaimed } = enumOptionClaimer(options);
  const claimedOptions = order.map((entry) => (entry === '*' ? undefined : claim(entry)));
  const wildcardIndex = order.indexOf('*');

  return claimedOptions.flatMap((option, index) => (index === wildcardIndex ? unclaimed() : (option ?? [])));
}

/** Gets the list of options from the `schema`. If the schema has an enum list, then those enum values are returned,
 * reordered by the `ui:enumOrder` of the `uiSchema` when it has one.
 *
 * If the schema has a `oneOf` or `anyOf` (`anyOf` wins when it has both, as it does in `isSelect()`), then the value is
 * the list of either:
 * - The `const` values from the schema if present, except for an option that declares the property a selector names
 * - If the schema has a discriminator (or the uiSchema a `ui:optionsSchemaSelector`), the value of that property, read
 * from every option when they aren't all constants, and otherwise from each constant option that declares it
 *
 * Options that are all constants are reordered by the `ui:enumOrder` of the `uiSchema` as `enum` values are, unless
 * any of them is read through a selector
 *
 * An option is labelled with the first of its names. One with no name is labelled by `fallbackLabel`, or with its value
 * (as JSON for an object or array) when there is no `fallbackLabel` or it returns `undefined`:
 * - An `enum` value's name is its non-empty `ui:enumNames` entry in the `uiSchema`
 * - A `oneOf`/`anyOf` option's name is the `ui:title` of its entry in `uiSchema.anyOf`/`uiSchema.oneOf`, then the
 * `title` of its selector property when there is one, then its own `title`. An empty title is kept as the label
 *
 * @param schema - The schema from which to extract the options list
 * @param [uiSchema] - The optional uiSchema from which to get alternate labels for the options
 * @param [fallbackLabel] - Labels an option that has no name. It is called once for each such option, before
 *        `ui:enumOrder` drops any, and for no other option. An option it returns `undefined` for is labelled with its
 *        value
 * @returns - The list of options from the schema, or `undefined` when it has none, including when its `anyOf`/`oneOf`
 *        options are not all constants and no selector field names where their values are
 */
export default function optionsList<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema?: UiSchema<T, S, F>,
  fallbackLabel?: (value: unknown) => string | undefined,
): EnumOptionsType<S>[] | undefined {
  const unnamedLabel = (value: unknown) => fallbackLabel?.(value) ?? enumOptionValueLabel(value);
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  if (schema.enum) {
    const { enumNames, enumOrder } = uiOptions;
    const options: EnumOptionsType<S>[] = schema.enum.map((value, i) => {
      // A map is keyed by strings, which can't name an object or array value
      const name = Array.isArray(enumNames) ? enumNames[i] : !isContainerValue(value) && enumNames?.[String(value)];
      return { label: name || unnamedLabel(value), value };
    });
    return applyEnumOrder(options, enumOrder);
  }
  const xxxOfKey = getXxxOfKey<S>(schema);
  const altSchemas: S['anyOf'] | S['oneOf'] = xxxOfKey && schema[xxxOfKey];
  const altUiSchemas: UiSchema<T, S, F>[] | undefined = xxxOfKey && uiSchema?.[xxxOfKey];
  // See if there is a discriminator path specified in the schema, and if so, use it as the selectorField, otherwise
  // pull one from the uiSchema
  const discriminatorField = getDiscriminatorFieldFromSchema<S>(schema);
  const { optionsSchemaSelector: selectorField = discriminatorField, enumOrder } = uiOptions;
  const isConstantList = isConstantOptionList<S>(altSchemas);
  // Without a selector, each option's value is its constant, which `toConstant()` throws for when there isn't one, so a
  // list that isn't made of constants has no options to offer rather than taking down the render
  if (!isConstantList && !selectorField && altSchemas) {
    return undefined;
  }
  // A selector names a property of object options, so a constant that doesn't declare it is read by its constant. An
  // object constant that does keeps its property's value, which is what `LayoutMultiSchemaField` matches a pick by
  const readsSelector = (aSchema: S) =>
    !!selectorField && (!isConstantList || getByPath(aSchema[PROPERTIES_KEY], selectorField) !== undefined);
  const options = altSchemas?.map((aSchemaDef, index) => {
    const { title } = getUiOptions<T, S, F>(altUiSchemas?.[index]);
    const aSchema = aSchemaDef as S;
    let value: EnumOptionsType<S>['value'];
    let label = title;
    const field = readsSelector(aSchema) ? selectorField : undefined;
    if (field) {
      const innerSchema = getPropertySchema<S>(aSchema, field);
      value = getByPath(innerSchema, DEFAULT_KEY, getByPath(innerSchema, CONST_KEY));
      // Use nullish coalescing so that an explicitly empty string title is preserved
      label = label ?? innerSchema?.title ?? aSchema.title ?? unnamedLabel(value);
    } else {
      value = toConstant(aSchema);
      label = label ?? aSchema.title ?? unnamedLabel(value);
    }
    return {
      schema: aSchema,
      label,
      value,
    };
  });
  // Constant options are each one value, as `enum` values are, so the order names them the same way. It is applied
  // after the labels are read, since `uiSchema.anyOf`/`uiSchema.oneOf` match options by their position in the schema.
  // Options none of which is read through a selector got this far only because they are all constants.
  // shortcut: not applied once an option is read through a selector, since `LayoutMultiSchemaField` reads an option's
  // uiSchema at its position in this list; drop the `readsSelector` check once it looks the option up by its position
  // in the schema instead
  return options && !altSchemas?.some((option) => readsSelector(option as S))
    ? applyEnumOrder(options, enumOrder)
    : options;
}
