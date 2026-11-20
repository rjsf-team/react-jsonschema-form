/** Used by the validator packages to name a property by the field a failed keyword applies to. Returns the `schemaPath`
 * with the branches the keyword sits in removed: each `allOf`, `anyOf` or `oneOf` option, `then`, `else`, and
 * `dependentSchemas` or `dependencies` schema, along with any `$ref` written into the path after one. A branch's own
 * `title` names that branch, not the field, and a branch that only lists `required` holds no `properties` to look one up
 * in.
 *
 * @param schemaPath - The URI fragment of the JSON Pointer to the keyword that failed, such as `#/properties/a/then/type`
 * @returns - The path the keyword would have if the field held it, such as `#/properties/a/type`, or the `schemaPath` as
 *          it is when the keyword sits in no branch
 */
export default function getFieldSchemaPath(schemaPath: string): string {
  // A key right after `properties`, `patternProperties`, `$defs` or `definitions` names a property or a definition, even
  // one named `then` or `else`
  return schemaPath.replace(
    /(?:(?<!\/(?:properties|patternProperties|\$defs|definitions))\/(?:(?:allOf|anyOf|oneOf)\/\d+|then|else|(?:dependentSchemas|dependencies)\/[^/]+)(?:\/\$ref)*)+(\/[^/]+)$/,
    '$1',
  );
}
