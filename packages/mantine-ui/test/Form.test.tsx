import formTests from '@rjsf/core/testSnap/formTests';

import Form from '../src';

jest.mock('@mantine/hooks', () => ({
  ...jest.requireActual('@mantine/hooks'),
  useMove: jest.fn,
}));

formTests(Form);
