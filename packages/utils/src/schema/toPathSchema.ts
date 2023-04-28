import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import set from 'lodash/set';

import {
  ALL_OF_KEY,
  ANY_OF_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  DEPENDENCIES_KEY,
  ITEMS_KEY,
  NAME_KEY,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  RJSF_ADDITONAL_PROPERTIES_FLAG,
} from '../constants';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema';
import { FormContextType, PathSchema, RJSFSchema, StrictRJSFSchema, ValidatorType } from '../types';
import getClosestMatchingOption from './getClosestMatchingOption';
import retrieveSchema from './retrieveSchema';

/** An internal helper that generates an `PathSchema` object for the `schema`, recursively with protection against
 * infinite recursion
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the `PathSchema` is desired
 * @param [name=''] - The base name for the schema
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [_recurseList=[]] - The list of retrieved schemas currently being recursed, used to prevent infinite recursion
 * @returns - The `PathSchema` object for the `schema`
 */
function toPathSchemaInternal<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  name: string,
  rootSchema?: S,
  formData?: T,
  _recurseList: S[] = []
): PathSchema<T> {
  if (REF_KEY in schema || DEPENDENCIES_KEY in schema || ALL_OF_KEY in schema) {
    const _schema = retrieveSchema<T, S, F>(validator, schema, rootSchema, formData);
    const sameSchemaIndex = _recurseList.findIndex((item) => isEqual(item, _schema));
    if (sameSchemaIndex === -1) {
      return toPathSchemaInternal<T, S, F>(
        validator,
        _schema,
        name,
        rootSchema,
        formData,
        _recurseList.concat(_schema)
      );
    }
  }

  let pathSchema: PathSchema = {
    [NAME_KEY]: name.replace(/^\./, ''),
  } as PathSchema;

  if (ONE_OF_KEY in schema || ANY_OF_KEY in schema) {
    const xxxOf: S[] = ONE_OF_KEY in schema ? (schema.oneOf as S[]) : (schema.anyOf as S[]);
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    const index = getClosestMatchingOption<T, S, F>(validator, rootSchema!, formData, xxxOf, 0, discriminator);
    const _schema: S = xxxOf![index] as S;
    pathSchema = {
      ...pathSchema,
      ...toPathSchemaInternal<T, S, F>(validator, _schema, name, rootSchema, formData, _recurseList),
    };
  }

  if (ADDITIONAL_PROPERTIES_KEY in schema && schema[ADDITIONAL_PROPERTIES_KEY] !== false) {
    set(pathSchema, RJSF_ADDITONAL_PROPERTIES_FLAG, true);
  }

  if (ITEMS_KEY in schema && Array.isArray(formData)) {
    formData.forEach((element, i: number) => {
      pathSchema[i] = toPathSchemaInternal<T, S, F>(
        validator,
        schema.items as S,
        `${name}.${i}`,
        rootSchema,
        element,
        _recurseList
      );
    });
  } else if (PROPERTIES_KEY in schema) {
    for (const property in schema.properties) {
      const field = get(schema, [PROPERTIES_KEY, property]);
      pathSchema[property] = toPathSchemaInternal<T, S, F>(
        validator,
        field,
        `${name}.${property}`,
        rootSchema,
        // It's possible that formData is not an object -- this can happen if an
        // array item has just been added, but not populated with data yet
        get(formData, [property]),
        _recurseList
      );
    }
  }
  return pathSchema as PathSchema<T>;
}

/** Generates an `PathSchema` object for the `schema`, recursively
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the `PathSchema` is desired
 * @param [name=''] - The base name for the schema
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @returns - The `PathSchema` object for the `schema`
 */
export default function toPathSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  name = '',
  rootSchema?: S,
  formData?: T
): PathSchema<T> {
  return toPathSchemaInternal(validator, schema, name, rootSchema, formData);
}
