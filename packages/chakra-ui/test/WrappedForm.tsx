import { ChakraProvider, defaultSystem, EnvironmentProvider } from '@chakra-ui/react';
import { FormProps } from '@rjsf/core';

import Form from '../src';

export default function WrappedForm(props: FormProps) {
  return (
    <EnvironmentProvider environment={{ document, window }}>
      <ChakraProvider value={defaultSystem}>
        <Form {...props} />
      </ChakraProvider>
    </EnvironmentProvider>
  );
}
