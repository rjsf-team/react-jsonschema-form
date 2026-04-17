import '@testing-library/jest-dom';
import { MessageChannel } from 'worker_threads';

// required by antd v6
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// required by react 18
global.MessageChannel = MessageChannel as unknown as typeof global.MessageChannel;
