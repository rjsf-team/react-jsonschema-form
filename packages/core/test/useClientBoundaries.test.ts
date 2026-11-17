/** @vitest-environment node */
import { globSync, readFileSync } from 'node:fs';

const packages = `${import.meta.dirname}/../..`;

// A server component imports a package's root, which loads these modules on the server; each one creates a context,
// calls a client-only function or library as it loads, or is a value `Form` needs as a client reference
const BOUNDARIES = [
  'core/src/components/Form.tsx',
  'core/src/withTheme.tsx',
  'core/src/components/FormDataContext.ts',
  'core/src/components/UiStateContext.ts',
  'core/src/components/fields/AdditionalEntryContext.ts',
  'core/src/components/fields/NamedFieldContext.ts',
  'core/src/components/fields/OptionalControlsBesideContext.ts',
  'core/src/components/fields/PresentationContext.ts',
  'core/src/components/fields/SelectorsAboveContext.ts',
  'core/src/components/fields/ShownOptionContext.ts',
  'core/src/components/fields/TemplateWarnEntryContext.ts',
  'antd/src/Form.tsx',
  'antd/src/templates/ErrorList/index.tsx',
  'antd/src/templates/FieldTemplate/index.tsx',
  'antd/src/templates/IconButton/index.tsx',
  'bootstrap3/src/Form.tsx',
  'chakra-ui/src/index.ts',
  'daisyui/src/DaisyUIForm.tsx',
  'daisyui/src/theme/frameTheme.ts',
  'daisyui/src/widgets/DatePickerCalendar.tsx',
  'fluentui-rc/src/index.ts',
  'mantine/src/Form/index.ts',
  'mantine/src/GroupSuccessIdContext.ts',
  'mui/src/MuiForm/MuiForm.tsx',
  'react-bootstrap/src/Form/Form.tsx',
  'shadcn/src/Form/Form.tsx',
  'validator-ajv8/src/defaultValidator.ts',
  'validator-ata/src/defaultValidator.ts',
  'validator-cfworker/src/defaultValidator.ts',
];

describe("'use client' boundaries", () => {
  it.each(BOUNDARIES)('%s starts with the directive', (path) => {
    const source = readFileSync(`${packages}/${path}`, 'utf8');
    expect(source.startsWith("'use client';\n")).toBe(true);
  });

  it('lists every source module that creates a context', () => {
    const creators = globSync('*/src/**/*.{ts,tsx}', { cwd: packages }).filter((path) =>
      /createContext[<(]/.test(readFileSync(`${packages}/${path}`, 'utf8')),
    );
    expect(BOUNDARIES).toEqual(expect.arrayContaining(creators));
  });
});
