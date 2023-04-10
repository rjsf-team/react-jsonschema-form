import * as ReactDOMClient from 'react-dom/client';
import App from './app';
import { StrictMode } from 'react';

const container = document.getElementById('app') as Element;

const root = ReactDOMClient.createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
