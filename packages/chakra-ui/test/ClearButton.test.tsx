import { callerInputPropsTests, clearButtonTests } from '@rjsf/snapshot-tests';

import WrappedForm from './WrappedForm.tsx';

clearButtonTests(WrappedForm);
callerInputPropsTests(WrappedForm);
