import { ChakraProvider, defaultSystem, EnvironmentProvider } from '@chakra-ui/react';
import type { FormProps } from '@rjsf/core';

import Form from '../src/index.ts';

export default function WrappedForm(props: FormProps) {
  return (
    <EnvironmentProvider>
      <ChakraProvider value={defaultSystem}>
        <Form {...props} />
      </ChakraProvider>
    </EnvironmentProvider>
  );
}
