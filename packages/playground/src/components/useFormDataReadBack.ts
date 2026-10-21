import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { FormRef } from '@rjsf/core';
import { deepEquals } from '@rjsf/utils';

/** Keeps the playground's copy of the form data in step with the form, which fills in the defaults a schema, uiSchema
 * or default-state setting brings without calling `onChange`, also for the data it mounts with. The form's data lives
 * in its own model, outside the playground's state, so it is read once the commit that mounts the form, or passes it
 * one of those props, is done, the way an Effect synchronizes with an external system. Every mount counts, whatever
 * caused it (a load, an edit in the formData editor, a theme switch, a frame that renders the form once it is ready),
 * because each one hands over a new `FormRef`. Data that `onChange` already reported is kept as it is.
 *
 * @param setFormData - Sets the playground's copy of the form data
 * @param schema - The schema the form derives its data under
 * @param uiSchema - The uiSchema the form derives its data under
 * @param liveSettings - The settings the form derives its data under
 * @returns The callback ref to hand the form, and a ref the rest of the playground reaches the mounted form through
 */
export default function useFormDataReadBack(
  setFormData: Dispatch<SetStateAction<unknown>>,
  schema: unknown,
  uiSchema: unknown,
  liveSettings: unknown,
): { attachForm: (form: FormRef | null) => void; formRef: RefObject<FormRef | null> } {
  const formRef = useRef<FormRef | null>(null);
  const [form, setForm] = useState<FormRef | null>(null);
  const attachForm = useCallback((attached: FormRef | null) => {
    formRef.current = attached;
    setForm(attached);
  }, []);
  useEffect(() => {
    if (!form) {
      return;
    }
    const derived = form.getFormData();
    setFormData((previous: unknown) => (deepEquals(previous, derived) ? previous : derived));
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the props the form re-derives its data from, after whose commit the Effect re-reads it
  }, [form, setFormData, schema, uiSchema, liveSettings]);
  return { attachForm, formRef };
}
