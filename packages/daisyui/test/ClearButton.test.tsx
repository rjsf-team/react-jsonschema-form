import { callerInputPropsTests, clearButtonTests } from '@rjsf/snapshot-tests';

import Form from '../src/index.ts';

clearButtonTests(Form);
callerInputPropsTests(Form);
