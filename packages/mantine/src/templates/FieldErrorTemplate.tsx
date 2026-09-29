import { useLayoutEffect, useRef } from 'react';
import { Box, List } from '@mantine/core';
import type { FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { errorId } from '@rjsf/utils';

/** The hidden copy of a field's errors, given the field's `errorId` only while no other element has it */
function HiddenErrors({ id, errors }: { id: string; errors: NonNullable<FieldErrorProps['errors']> }) {
  const ref = useRef<HTMLDivElement>(null);
  // Without dependencies, since another element can take or give up the id without this one rendering again
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box?.isConnected) {
      return;
    }
    // Scoped to the form, since another form on the page can use the same ids
    const scope = box.closest('form') ?? (box.getRootNode() as Document | ShadowRoot);
    const taken = Array.from(scope.querySelectorAll(`#${CSS.escape(id)}`)).some((element) => element !== box);
    if (taken && box.id) {
      box.removeAttribute('id');
    } else if (!taken && box.id !== id) {
      box.id = id;
    }
  });
  return (
    <Box ref={ref} c='red' display='none'>
      <List>
        {errors.map((error, index) => (
          // oxlint-disable-next-line react/no-array-index-key
          <List.Item key={`field-error-${index}`}>{error}</List.Item>
        ))}
      </List>
    </Box>
  );
}

/** The `FieldErrorTemplate` component renders a hidden copy of the errors local to the particular field, for a custom
 * widget or field that is described by the field's `errorId` but doesn't render its errors itself. Each Mantine widget,
 * and an object's or array's template, renders the errors through Mantine's own error element with that id, which the
 * copy would otherwise duplicate. Which component renders a field can't be told from here, so the rendered document
 * decides.
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ errors, id }: FieldErrorProps<T, S, F>) {
  return errors?.length ? <HiddenErrors id={errorId(id)} errors={errors} /> : null;
}
