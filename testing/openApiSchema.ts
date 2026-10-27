/** A schema with an OpenAPI `components` section for `$ref`s to reach into. No JSON Schema draft has the keyword, so a
 * test schema holding one declares it, the way a schema with keywords of its own does
 */
export type WithOpenApiComponents<S> = S & { components?: object };
