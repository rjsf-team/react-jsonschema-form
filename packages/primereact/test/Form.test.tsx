import { formTests } from '@rjsf/snapshot-tests';

import Form from '../src';

// Mock PrimeReact components that use parentElement or real DOM
jest.mock('primereact/dropdown', () => ({
  Dropdown: (props: Record<string, any>) => <select {...props} />,
}));

jest.mock('primereact/multiselect', () => ({
  MultiSelect: (props: Record<string, any>) => <select multiple {...props} />,
}));

jest.mock('primereact/slider', () => ({
  Slider: (props: Record<string, any>) => <input type='range' {...props} />,
}));

formTests(Form);
