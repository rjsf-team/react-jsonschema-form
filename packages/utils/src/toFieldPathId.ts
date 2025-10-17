import { ID_KEY } from './constants';
import { FieldPathId, FieldPathList, GlobalFormOptions } from './types';

/** Constructs the `FieldPathId` for `fieldPath`. If `parentPathId` is provided, the `fieldPath` is appended to the end
 * of the parent path. Then the `ID_KEY` of the resulting `FieldPathId` is constructed from the `idPrefix` and
 * `idSeparator` contained within the `globalFormOptions`. If `fieldPath` is passed as an empty string, it will simply
 * generate the path from the `parentPath` (if provided) and the `idPrefix` and `idSeparator`. If a `nameGenerator`
 * is provided in `globalFormOptions`, it will also generate the HTML `name` attribute.
 *
 * @param fieldPath - The property name or array index of the current field element
 * @param globalFormOptions - The `GlobalFormOptions` used to get the `idPrefix` and `idSeparator`
 * @param [parentPath] - The optional `FieldPathId` or `FieldPathList` of the parent element for this field element
 */
export default function toFieldPathId(
  fieldPath: string | number,
  globalFormOptions: GlobalFormOptions,
  parentPath?: FieldPathId | FieldPathList,
): FieldPathId {
  const basePath = Array.isArray(parentPath) ? parentPath : parentPath?.path;
  const childPath = fieldPath === '' ? [] : [fieldPath];
  const path = basePath ? basePath.concat(...childPath) : childPath;
  const id = [globalFormOptions.idPrefix, ...path].join(globalFormOptions.idSeparator);

  // Generate name attribute if nameGenerator is provided
  let name: string | undefined;
  if (globalFormOptions.nameGenerator && path.length > 0) {
    // Determine element type based on the last element in the path
    const lastPathElement = path[path.length - 1];
    const elementType = typeof lastPathElement === 'number' ? 'array' : 'object';
    name = globalFormOptions.nameGenerator(path, elementType);
  }

  return { path, [ID_KEY]: id, ...(name !== undefined && { name }) };
}
