import { requiredCueTests } from '@rjsf/snapshot-tests';

import Form from '../src/index.ts';

// antd draws its marker through CSS
requiredCueTests(Form, (container) => container.querySelectorAll('.ant-form-item-required').length);
