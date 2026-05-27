import { arrayTests } from '@rjsf/snapshot-tests';

import Form from '../src';

// Mock PrimeReact components that use parentElement or real DOM
vi.mock('primereact/dropdown', () => ({
  Dropdown: (props: Record<string, any>) => <select {...props} />,
}));

vi.mock('primereact/multiselect', () => ({
  MultiSelect: (props: Record<string, any>) => <select multiple {...props} />,
}));

vi.mock('primereact/slider', () => ({
  Slider: (props: Record<string, any>) => <input type='range' {...props} />,
}));

arrayTests(Form);
