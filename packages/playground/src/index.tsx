import { createRoot } from 'react-dom/client';

import App from './app.js';

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
