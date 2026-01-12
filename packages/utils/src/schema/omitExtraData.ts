import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { NAME_KEY, RJSF_ADDITIONAL_PROPERTIES_FLAG } from '../constants';
import { GenericObjectType, PathSchema, FormContextType, RJSFSchema, StrictRJSFSchema, ValidatorType } from '../types';
import retrieveSchema from './retrieveSchema';
import toPathSchema from './toPathSchema';

/** Returns the `formData` with only the elements specified in the `fields` list
 *
 * @param formData - The data for the `Form`
 * @param fields - The fields to keep while filtering
 * @deprecated - To be removed as an exported `@rjsf/utils` function in a future release
 */
export function getUsedFormData<T = any>(formData: T | undefined, fields: string[]): T | undefined {
  // For the case of a single input form
  if (fields.length === 0 && typeof formData !== 'object') {
    return formData;
  }

  const data: GenericObjectType = pick(formData, fields);
  if (Array.isArray(formData)) {
    return Object.keys(data).map((key: string) => data[key]) as unknown as T;
  }

  return data as T;
}

/** Returns the list of field names from inspecting the `pathSchema` as well as using the `formData`
 *
 * @param pathSchema - The `PathSchema` object for the form
 * @param [formData] - The form data to use while checking for empty objects/arrays
 * @deprecated - To be removed as an exported `@rjsf/utils` function in a future release
 */
export function getFieldNames<T = any>(pathSchema: PathSchema<T>, formData?: T): string[][] {
  const formValueHasData = (value: T, isLeaf: boolean) =>
    typeof value !== 'object' || isEmpty(value) || (isLeaf && !isEmpty(value));
  const getAllPaths = (_obj: GenericObjectType, acc: string[][] = [], paths: string[][] = [[]]) => {
    const objKeys = Object.keys(_obj);
    objKeys.forEach((key: string) => {
      const data = _obj[key];
      if (typeof data === 'object') {
        const newPaths = paths.map((path) => [...path, key]);
        // If an object is marked with additionalProperties, all its keys are valid
        if (data[RJSF_ADDITIONAL_PROPERTIES_FLAG] && data[NAME_KEY] !== '') {
          acc.push(data[NAME_KEY]);
        } else {
          getAllPaths(data, acc, newPaths);
        }
      } else if (key === NAME_KEY && data !== '') {
        paths.forEach((path) => {
          const formValue = get(formData, path);
          const isLeaf = objKeys.length === 1;
          // adds path to fieldNames if it points to a value or an empty object/array which is not a leaf
          if (
            formValueHasData(formValue, isLeaf) ||
            (Array.isArray(formValue) && formValue.every((val) => formValueHasData(val, isLeaf)))
          ) {
            acc.push(path);
          }
        });
      }
    });
    return acc;
  };

  return getAllPaths(pathSchema);
}

/** Takes a `schema` and `formData` and returns a copy of the formData with any fields not defined in the schema removed.
 * This is useful for ensuring that only data that is relevant to the schema is preserved. Objects with
 * `additionalProperties` keyword set to `true` will not have their extra fields removed.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema to use for filtering the formData
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [formData] - The data for the `Form`
 * @returns The `formData` after omitting extra data
 */
export default function omitExtraData<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(validator: ValidatorType<T, S, F>, schema: S, rootSchema: S = {} as S, formData?: T): T | undefined {
  const retrievedSchema = retrieveSchema(validator, schema, rootSchema, formData);
  const pathSchema = toPathSchema(validator, retrievedSchema, '', rootSchema, formData);
  const fieldNames = getFieldNames(pathSchema, formData);
  const lodashFieldNames = fieldNames.map((fieldPaths: string[]) =>
    Array.isArray(fieldPaths) ? fieldPaths.join('.') : fieldPaths,
  );
  return getUsedFormData(formData, lodashFieldNames);
}
