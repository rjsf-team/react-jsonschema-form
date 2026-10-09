import { use, useInsertionEffect, useMemo, useRef } from 'react';
import type { FieldPath } from '@rjsf/utils';

import { useReadsFormData } from '../components/fields/RawFormDataContext.ts';
import FormDataContext from '../components/FormDataContext.ts';
import type { ItemMove } from '../components/formState.ts';

/** What a container field's event handlers read instead of render-time props. Each committed render installs the
 * field's view from an insertion Effect, so an abandoned render never publishes one, and a layout Effect of the same
 * commit that calls a handler, a child's included, reads the view that commit rendered. Callers keep `value` the same
 * while the view is unchanged, so the Effect runs only when it changed.
 *
 * `self` is the field's own component, by which `RawFormDataContext` declares whether it was rendered with the form's
 * own data at `fieldPath`. Only then is `Form`'s latest edit at that path the field's data; a field a custom parent
 * handed a view of it (a sorted copy, say) keeps to its own view. The answer is handed back as `readsFormData`, for the
 * field to declare the same of what it renders.
 */
export default function useFieldView<V>(fieldPath: FieldPath, value: V, self: unknown) {
  const access = use(FormDataContext);
  const readsFormData = useReadsFormData(self);
  const rendered = useRef(value);
  // The view a handler proposed since the form last rendered, valid until the form drops its own record of a proposal
  // (see `FormDataAccess.epoch()`)
  const advanced = useRef<{ view: V; epoch: number } | undefined>(undefined);
  useInsertionEffect(() => {
    rendered.current = value;
  }, [value]);
  return useMemo(() => {
    const read = () =>
      advanced.current && advanced.current.epoch === access?.epoch() ? advanced.current.view : rendered.current;
    return {
      readsFormData,
      read,
      /** The field's current data: `Form`'s latest edit, or `fallback`, the view's own data, when the field shows a
       * view of the form's data or renders outside a `Form`
       */
      readData: <D>(fallback: D) => (access && readsFormData ? access.readField<D>(fieldPath) : fallback),
      /** Proposes the view `next` by calling `send`, recording it first so a second handler before the form's next
       * commit builds on it, as `Form` builds on the proposal itself. A custom parent may flush a render from `send`,
       * committing the form before the proposal has gone anywhere, so the record is dated once `send` has returned,
       * and only then is the form told. It is told when `send` throws too: nothing else would end the record.
       *
       * `newIndexOf` says where the proposal put each item of the field's array, for the form to move their errors
       * along. The indexes are those of the `formData` the field was given, which a custom parent passing the form's
       * data on leaves as they are; one that reorders or filters the items it shows moves the errors by its own
       * indexes.
       */
      propose: (next: V, send: () => void, newIndexOf?: ItemMove) => {
        const record = access && { view: next, epoch: access.epoch() };
        advanced.current = record;
        const proposed = access?.proposing(newIndexOf && { fieldPath, newIndexOf });
        const settle = () => {
          if (access && advanced.current === record) {
            advanced.current = { view: next, epoch: access.epoch() };
          }
          proposed?.();
        };
        try {
          send();
        } catch (error) {
          settle();
          throw error;
        }
        settle();
      },
    };
  }, [access, fieldPath, readsFormData]);
}
