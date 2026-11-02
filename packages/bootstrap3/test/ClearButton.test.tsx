import { callerInputPropsTests, clearButtonTests } from '@rjsf/snapshot-tests';

import Form from '../src/index.ts';

// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
clearButtonTests(Form);
// oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
callerInputPropsTests(Form);
