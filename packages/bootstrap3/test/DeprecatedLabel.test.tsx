import { deprecatedLabelTests } from '@rjsf/snapshot-tests';

import Form from '../src/index.ts';

// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
deprecatedLabelTests(Form);
