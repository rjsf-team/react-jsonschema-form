import Form, { generateTemplates, generateTheme, generateWidgets } from '@rjsf/core';

import {
  checkboxLabelTests,
  fallbackDescriptionTests,
  formTests,
  submitPendingTests,
  themeTests,
} from '../src/index.ts';

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });
checkboxLabelTests(Form, { generateTemplates, generateWidgets, descriptionBy: 'self' });
fallbackDescriptionTests(Form, true);
submitPendingTests(Form);
