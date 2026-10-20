import Form, { generateTemplates, generateTheme, generateWidgets } from '@rjsf/core';

import { checkboxLabelTests, formTests, themeTests } from '../src/index.ts';

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });
checkboxLabelTests(Form, { generateTemplates, generateWidgets });
