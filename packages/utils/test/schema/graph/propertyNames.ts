import { PROPERTIES_KEY } from '../../../src/index.ts';
import type { Seeding } from '../../../src/schema/graph/mergePlan.ts';

/** The names a plan's chains declare under `properties`, each listed once, in merge order */
export default function propertyNames({ graph, chains }: Seeding): string[] {
  const names = chains.flatMap((chain) => {
    const provider = chain.get(PROPERTIES_KEY);
    return provider === undefined
      ? []
      : graph.subschemas(provider.node.id, PROPERTIES_KEY).flatMap(([name]) => (name === provider.drops ? [] : [name]));
  });
  return [...new Set(names)];
}
