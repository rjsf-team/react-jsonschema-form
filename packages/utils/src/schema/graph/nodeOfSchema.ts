import type { RJSFSchema, StrictRJSFSchema } from '../../types.ts';
import { isHandedOut } from './handedOut.ts';
import parseSchemaGraph from './parseSchemaGraph.ts';
import type { AdoptedSchema } from './parseSchemaGraph.ts';
import { readProvenance } from './provenance.ts';

/** Returns the node `schema` stands for: the subschema of `rootSchema` it is, or the field `retrieveSchema()` handed it
 * out as, or, for a schema with no place in the root, the schema itself, parsed beside the root
 *
 * @param schema - The schema
 * @param rootSchema - The root schema
 * @returns - The node and the graph holding it
 */
export default function nodeOfSchema<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S,
): AdoptedSchema<S> {
  const graph = parseSchemaGraph<S>(rootSchema);
  const stamped = readProvenance<S>(schema, graph);
  if (stamped !== undefined && isHandedOut(schema) && stamped.seeds.length === 1) {
    return { graph: stamped.graph, node: stamped.seeds[0].node };
  }
  return graph.adopt(schema);
}
