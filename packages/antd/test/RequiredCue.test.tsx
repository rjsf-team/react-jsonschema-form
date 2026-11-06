import { requiredCueTests } from '@rjsf/snapshot-tests';

import Form from '../src/index.ts';

// antd draws a label's marker through CSS, and `CheckboxWidget` the marker of the label it draws itself as text
requiredCueTests(
  Form,
  (container) =>
    container.querySelectorAll('.ant-form-item-required').length + container.textContent.split('*').length - 1,
);
