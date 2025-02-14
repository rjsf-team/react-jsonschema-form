import { formTests } from '@rjsf/snapshot-tests';
import { MantineProvider } from '@mantine/core';

import Form from '../src';

jest.mock('@mantine/hooks', () => ({
  ...jest.requireActual('@mantine/hooks'),
  useMove: jest.fn,
}));

const WrappedForm = (props: any) => {
  return (
    <MantineProvider>
      <Form {...props} />
    </MantineProvider>
  );
};

formTests(WrappedForm);
