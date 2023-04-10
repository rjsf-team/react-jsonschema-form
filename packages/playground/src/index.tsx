import * as ReactDOMClient from 'react-dom/client';
import App from './app';

const container = document.getElementById('app') as Element;

const root = ReactDOMClient.createRoot(container);
root.render(<App />);
