import { MessageChannel } from 'worker_threads';

// required by react 18 for antd
global.MessageChannel = MessageChannel as unknown as typeof global.MessageChannel;
