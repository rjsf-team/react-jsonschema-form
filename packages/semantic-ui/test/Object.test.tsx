import { objectTests } from '@rjsf/snapshot-tests';

import Form from '../src';

/** Mock the `react-component-ref` component used by semantic-ui to simply render the children, otherwise tests fail */
vi.mock('@fluentui/react-component-ref', async () => ({
  ...(await vi.importActual<typeof import('@fluentui/react-component-ref')>('@fluentui/react-component-ref')),
  Ref: vi.fn().mockImplementation(({ children }) => children),
}));

objectTests(Form);
