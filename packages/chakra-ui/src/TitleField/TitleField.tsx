import { Box, Flex, Heading, Separator, Spacer } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';

import { RequiredMarker } from '../components/ui/field.tsx';

/** The `TitleField` is the template to use to render the title of a field. Its `id` goes on the title's text alone, as
 * an option selector beside a container's options is named by it, and the required marker and the optional data control
 * aren't part of that name
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, title, required, optionalDataControl }: TitleFieldProps<T, S, F>) {
  let heading = (
    <Heading as='h5'>
      <span id={id}>{title}</span>
      {/* Spaced as a `Field`'s label spaces its own marker, by its gap, which a heading has none of */}
      {required && <RequiredMarker ms={1} />}
    </Heading>
  );
  if (optionalDataControl) {
    heading = (
      <Flex>
        {heading}
        <Spacer />
        {optionalDataControl}
      </Flex>
    );
  }
  return (
    <Box mt={1} mb={4}>
      {heading}
      <Separator />
    </Box>
  );
}
