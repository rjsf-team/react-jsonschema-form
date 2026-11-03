import { clearButtonTests } from '@rjsf/snapshot-tests';

import Form from '../src/index.ts';

// The icon's own `aria-label` names antd's clear button, ahead of the button's `title`
clearButtonTests(Form, /^close$/);
