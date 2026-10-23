/** The markers the schemas `retrieveSchema()` and `getRenderedOptionSchema()` build carry for the form's own readers,
 * kept out of `constants.ts` so they stay off the package's exports, and in a module of their own, importing nothing,
 * so that `parseSchemaGraph()` can list them among the markers a schema's content is keyed by without an import cycle
 */

/** The object schema and the option selected beside it that a schema joins the extra-key keywords of, which only
 * `withJoinedSchemas()` and `copyJoinedSchemas()` write
 */
export const JOINED_SCHEMAS_KEY = Symbol('__rjsf_joined_schemas');

/** The names of the properties the fields above declare, which `getRenderedOptionSchema()` hands an option taking the
 * extra keys of the field above in its place, so that it renders none of them a second time
 */
export const DECLARED_ABOVE_KEY = Symbol('__rjsf_declared_above');
