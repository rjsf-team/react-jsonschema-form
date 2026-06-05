import { Box, Flex, Heading, Separator, Spacer } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  optionalDataControl,
}: TitleFieldProps<T, S, F>) {
  let heading = <Heading as='h5'>{title}</Heading>;
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
    <Box id={id} mt={1} mb={4}>
      {heading}
      <Separator />
    </Box>
  );
}
