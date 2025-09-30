import { ID_KEY } from './constants';
import { FieldPathId, FieldPathList, GlobalFormOptions } from './types';

/** Constructs the `FieldPathId` for `fieldPath`. If `parentPathId` is provided, the `fieldPath` is appended to the end
 * of the parent path. Then the `ID_KEY` of the resulting `FieldPathId` is constructed from the `idPrefix` and
 * `idSeparator` contained within the `globalFormOptions`
 *
 * @param fieldPath - The property name or array index of the current field element
 * @param globalFormOptions - The `GlobalFormOptions` used to get the `idPrefix` and `idSeparator`
 * @param [parentPath] - The optional `FieldPathId` or `FieldPathList` of the parent element for this field element
 * @returns - The `FieldPathId` for the given `fieldPath` and the optional `parentPathId`
 */
export default function toFieldPathId(
  fieldPath: string | number,
  globalFormOptions: GlobalFormOptions,
  parentPath?: FieldPathId | FieldPathList,
): FieldPathId {
  if (fieldPath === '') {
    return { path: [], [ID_KEY]: globalFormOptions.idPrefix };
  }

  const basePath = Array.isArray(parentPath) ? parentPath : parentPath?.path;
  const path = basePath ? basePath.concat(fieldPath) : [fieldPath];
  const id = [globalFormOptions.idPrefix, ...path].join(globalFormOptions.idSeparator);
  return { path, [ID_KEY]: id };
}
