import customizeValidator from './customizeValidator';
import compileSchemaValidators from './compileSchemaValidators';
import createPrecompiledValidator from './createPrecompiledValidator';

export { customizeValidator, compileSchemaValidators, createPrecompiledValidator };
export * from './types';

export default customizeValidator();
