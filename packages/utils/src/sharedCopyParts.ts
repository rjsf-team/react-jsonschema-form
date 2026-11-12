import { ID_KEY, SHARED_COPY_ID } from './constants.ts';
import isObject from './isObject.ts';
import { CONTAINER_KEYWORDS } from './schema/schemaKeywords.ts';
import type { GenericObjectType } from './types.ts';

/** A part an option's scoring target holds once, see `SHARED_COPY_ID`, with its `$id` and where the target holds it */
export interface SharedCopyPart {
  /** The keyword at the target's top holding the part, `definitions` or `$defs` */
  readonly container: string;
  /** The object that keyword holds */
  readonly held: GenericObjectType;
  /** The name the container holds the part under */
  readonly name: string;
  /** The part's `$id`, starting with `SHARED_COPY_ID` */
  readonly id: string;
  readonly part: GenericObjectType;
}

/** Returns the parts an option's scoring target holds once, see `SHARED_COPY_ID`: each entry of the `definitions` or
 * `$defs` at its top whose `$id` starts with `SHARED_COPY_ID`. A target holds them nowhere else, so a validator reads
 * them from here alone, and finds none in a schema that is no such target.
 *
 * @param schema - A schema handed to a validator, such as one `getValidationSchemas()` lists
 * @returns - The parts the schema holds once, none where it holds none
 */
export default function sharedCopyParts(schema: unknown): SharedCopyPart[] {
  if (!isObject(schema)) {
    return [];
  }
  return CONTAINER_KEYWORDS.flatMap((container) => {
    const held: unknown = schema[container];
    if (!isObject(held)) {
      return [];
    }
    return Object.entries(held).flatMap(([name, part]) => {
      const id: unknown = isObject(part) ? part[ID_KEY] : undefined;
      return isObject(part) && typeof id === 'string' && id.startsWith(SHARED_COPY_ID)
        ? [{ container, held, name, id, part }]
        : [];
    });
  });
}
