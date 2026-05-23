import customizeValidator from './customizeValidator';
import createPrecompiledValidator from './createPrecompiledValidator';

export { customizeValidator, createPrecompiledValidator };
export { default as ATAValidator } from './validator';
export * from './types';

export default customizeValidator();
