import type { ComponentProps } from 'react';
import { MantineProvider } from '@mantine/core';

import Form from '../src/index.ts';

export default function WrappedForm(props: ComponentProps<typeof Form>) {
  return (
    <MantineProvider>
      <Form {...props} />
    </MantineProvider>
  );
}
