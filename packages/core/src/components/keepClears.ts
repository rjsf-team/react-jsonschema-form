import type { GenericObjectType } from '@rjsf/utils';
import { isPlainObject, setOwn } from '@rjsf/utils';

/** Whether `container` holds `key` as its own, without a value */
function holdsUndefined(container: GenericObjectType, key: string): boolean {
  return Object.hasOwn(container, key) && container[key] === undefined;
}

/** `derived` with each clear that both `written` and `cleared` hold kept: a field cleared, in this change or an earlier
 * one, stays cleared whatever defaults the derivation merged in (#5125), such as under
 * `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`. A cleared property is an own key holding `undefined`,
 * and a cleared array item is `null`, as a cleared item is written. Only the containers whose references differ are
 * walked, and an array index by index, as `written` holds it in the order the change left it
 *
 * @param derived - The data the derivation filled
 * @param written - The data the derivation filled it from
 * @param cleared - The data whose clears are kept, laid out as `written` is
 * @returns - `derived`, sharing every subtree the walk cleared nothing in
 */
export default function keepClears<V>(derived: V, written: unknown, cleared: unknown): V;
export default function keepClears(derived: unknown, written: unknown, cleared: unknown): unknown {
  if (derived === written) {
    return derived;
  }
  if (Array.isArray(derived) && Array.isArray(written)) {
    const items: readonly unknown[] = derived;
    const writtenItems: readonly unknown[] = written;
    const clearedItems: readonly unknown[] = Array.isArray(cleared) ? cleared : [];
    let kept: unknown[] | undefined;
    items.forEach((item, index) => {
      const wasCleared = writtenItems[index] === null && clearedItems[index] === null;
      const next = wasCleared ? null : keepClears(item, writtenItems[index], clearedItems[index]);
      if (next !== item) {
        kept ??= [...items];
        kept[index] = next;
      }
    });
    return kept ?? items;
  }
  if (isPlainObject(derived) && isPlainObject(written)) {
    const clearedKeys = isPlainObject(cleared) ? cleared : {};
    let kept: GenericObjectType | undefined;
    for (const [key, value] of Object.entries(derived)) {
      const wasCleared = holdsUndefined(written, key) && holdsUndefined(clearedKeys, key);
      const next = wasCleared ? undefined : keepClears(value, written[key], clearedKeys[key]);
      if (next !== value) {
        kept ??= { ...derived };
        setOwn(kept, key, next);
      }
    }
    return kept ?? derived;
  }
  return derived;
}
