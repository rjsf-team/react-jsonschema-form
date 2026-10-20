import { CONST_KEY, DEFAULT_KEY, PROPERTIES_KEY, REF_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import { isSchemaObject } from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Finds the option inside the `schema['any/oneOf']` list which has the `properties[selectorField].default` or
 * `properties[selectorField].const` that matches the `formData[selectorField]` value. For the purposes of this
 * function, `selectorField` is either `schema.discriminator.propertyName` or `fallbackField`. The `LayoutGridField`
 * works directly with schemas in a recursive manner, making this faster than `getFirstMatchingOption()`.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param schema - The schema element in which to search for the selected anyOf/oneOf option
 * @param fallbackField - The field to use as a backup selector field if the schema does not have a required field
 * @param xxx - Either `anyOf` or `oneOf`, defines which value is being sought
 * @param [formData={}] - The form data that is used to determine which anyOf/oneOf option to descend
 * @returns - The anyOf/oneOf option that matches the selector field in the schema or undefined if nothing is selected
 */
export default function findSelectedOptionInXxxOf<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S,
  fallbackField: string,
  xxx: 'anyOf' | 'oneOf',
  formData: T = {} as T,
): S | undefined {
  if (Array.isArray(schema[xxx])) {
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    const selectorField = discriminator || fallbackField;
    const xxxOfs = schema[xxx].map((xxxOf) => retrieveSchema<T, S, F>(context, xxxOf as S, rootSchema, formData));
    const data = getByPath(formData, selectorField);
    if (data !== undefined) {
      return xxxOfs.find((xxxOfOption) => {
        const property: unknown = xxxOfOption[PROPERTIES_KEY]?.[selectorField];
        if (!isSchemaObject<S>(property)) {
          return false;
        }
        // An option hands its properties out as written, so a selector written as a `$ref` is retrieved to be read. One
        // written in place already holds its value, and an option without one has none to match: retrieving a schema the
        // root does not hold, such as a stand-in for the missing property, would parse it anew on every render
        const selector =
          typeof property[REF_KEY] === 'string'
            ? retrieveSchema<unknown, S, F>(context, property, rootSchema, data)
            : property;
        const constValue = getByPath(selector, CONST_KEY);
        return deepEquals(getByPath(selector, DEFAULT_KEY, constValue), data);
      });
    }
  }
  return undefined;
}
