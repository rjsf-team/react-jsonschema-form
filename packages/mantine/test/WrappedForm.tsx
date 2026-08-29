import { MantineProvider } from '@mantine/core';

import Form from '../src/index.js';

export default function WrappedForm(props: any) {
  return (
    <MantineProvider>
      <Form {...props} />
    </MantineProvider>
  );
}
