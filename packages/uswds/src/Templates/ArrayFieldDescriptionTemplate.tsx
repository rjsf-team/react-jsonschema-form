import {
  ArrayFieldDescriptionProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  descriptionId,
} from '@rjsf/utils';

/** The `ArrayFieldDescriptionTemplate` component renders a description for an array field
 *
 * @param props - The `ArrayFieldDescriptionProps` for the component
 */
export default function ArrayFieldDescriptionTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldDescriptionProps<T, S, F>) {
  // Remove unused schema, uiSchema, registry
  const { description, idSchema } = props;
  const id = descriptionId<T>(idSchema);

  if (!description) {
    return null;
  }

  return (
    <p id={id} className="field-description">
      {description}
    </p>
  );
}
