import { arrayTests } from '@rjsf/snapshot-tests';
import { MantineProvider } from '@mantine/core';

import Form from '../src';

const WrappedForm = (props: any) => {
  return (
    <MantineProvider>
      <Form {...props} />
    </MantineProvider>
  );
};

arrayTests(WrappedForm);
