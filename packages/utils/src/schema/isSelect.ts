import isConstant from "../isConstant";
import { RJSFSchema, ValidatorType } from "../types";
import retrieveSchema from "./retrieveSchema";

/** Checks to see if the `schema` combination represents a select
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param theSchema - The schema for which check for a select flag is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if schema contains a select, otherwise false
 */
export default function isSelect<T = any>(
  validator: ValidatorType,
  theSchema: RJSFSchema,
  rootSchema: RJSFSchema = {}
) {
  const schema = retrieveSchema<T>(validator, theSchema, rootSchema, undefined);
  const altSchemas = schema.oneOf || schema.anyOf;
  if (Array.isArray(schema.enum)) {
    return true;
  }
  if (Array.isArray(altSchemas)) {
    return altSchemas.every(
      (altSchemas) => typeof altSchemas !== "boolean" && isConstant(altSchemas)
    );
  }
  return false;
}
