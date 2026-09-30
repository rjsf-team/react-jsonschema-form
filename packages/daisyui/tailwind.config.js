import daisyui from 'daisyui';

import config from './tailwind.config.json' with { type: 'json' };

// Add plugins that require JavaScript functions
export default { ...config, plugins: [daisyui] };
