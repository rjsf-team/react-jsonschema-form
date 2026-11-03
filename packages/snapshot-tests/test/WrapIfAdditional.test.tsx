import Form from '@rjsf/core';

import { wrapIfAdditionalCallbackTests, wrapIfAdditionalFlagTests } from '../src/index.ts';

wrapIfAdditionalFlagTests(Form);
wrapIfAdditionalCallbackTests(Form);
