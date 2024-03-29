import { FormContextType, GenericObjectType, PathSchema, RJSFSchema, StrictRJSFSchema, ValidatorType } from '../types';
import _pick from 'lodash/pick';

import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import toPathSchema from './toPathSchema';
import { NAME_KEY, RJSF_ADDITONAL_PROPERTIES_FLAG } from '../constants';

/**
 * A helper function that extracts all the existing paths from the given `pathSchema` and `formData`.
 *
 * @param pathSchema - The `PathSchema` from which to extract the field names
 * @param [formData] - The formData to use to determine which fields are valid
 * @returns A list of paths represented as string arrays
 */
export function getFieldNames<T = any>(pathSchema: PathSchema<T>, formData?: T): string[][] {
  const getAllPaths = (_obj: GenericObjectType, acc: string[][] = [], paths: string[][] = [[]]) => {
    Object.keys(_obj).forEach((key: string) => {
      if (typeof _obj[key] === 'object') {
        const newPaths = paths.map((path) => [...path, key]);
        // If an object is marked with additionalProperties, all its keys are valid
        if (_obj[key][RJSF_ADDITONAL_PROPERTIES_FLAG] && _obj[key][NAME_KEY] !== '') {
          acc.push(_obj[key][NAME_KEY]);
        } else {
          getAllPaths(_obj[key], acc, newPaths);
        }
      } else if (key === NAME_KEY && _obj[key] !== '') {
        paths.forEach((path) => {
          const formValue = _get(formData, path);
          // adds path to fieldNames if it points to a value
          // or an empty object/array
          if (
            typeof formValue !== 'object' ||
            _isEmpty(formValue) ||
            (Array.isArray(formValue) && formValue.every((val) => typeof val !== 'object'))
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

/**
 * A helper function to keep only the fields in the `formData` that are defined in the `fields` array.
 *
 * @param formData - The formData to extract the fields from
 * @param fields - The fields to keep in the `formData`
 */
export function getUsedFormData<T = any>(formData: T | undefined, fields: string[][]): T | undefined {
  // For the case of a single input form
  if (fields.length === 0 && typeof formData !== 'object') {
    return formData;
  }

  // _pick has incorrect type definition, it works with string[][], because lodash/hasIn supports it
  const data: GenericObjectType = _pick(formData, fields as unknown as string[]);
  if (Array.isArray(formData)) {
    return Object.keys(data).map((key: string) => data[key]) as unknown as T;
  }

  return data as T;
}

/**
 * The function takes a `schema` and `formData` and returns a copy of the formData with any fields not defined in the schema removed.
 * This is useful for ensuring that only data that is relevant to the schema is preserved. Objects with `additionalProperties`
 * keyword set to `true` will not have their extra fields removed.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema to use for filtering the formData
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [formData] - The formData to filter
 * @returns The new form data, with any fields not defined in the schema removed
 */
export default function omitExtraData<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(validator: ValidatorType<T, S, F>, schema: S, rootSchema: S = {} as S, formData?: T): T | undefined {
  const pathSchema = toPathSchema(validator, schema, '', rootSchema, formData);
  const fieldNames = getFieldNames(pathSchema, formData);

  return getUsedFormData(formData, fieldNames);
}
