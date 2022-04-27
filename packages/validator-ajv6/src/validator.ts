import { Ajv, ErrorObject } from 'ajv';
import toPath from 'lodash/toPath';
import isObject from 'lodash/isObject';
import { AjvError, ErrorSchema, FormProps, utils } from '@rjsf/core';

import { CustomValidatorOptionsType, AjvErrorSchema, AjvFormValidation } from './types';
import createAjvInstance from './createAjvInstance';
import { ValidationError } from 'json-schema';

const ROOT_SCHEMA_PREFIX = "__rjsf_rootSchema";

const { getDefaultFormState, mergeObjects } = utils;

export default class AJV6Validator {
  private ajv: Ajv;

  constructor (options: CustomValidatorOptionsType) {
    const { additionalMetaSchemas, customFormats } = options;
    this.ajv = createAjvInstance(additionalMetaSchemas, customFormats);
  }

  private stackToAjvError(stack: string): AjvError {
    return {
      message: '',
      name: '',
      params: undefined,
      property: '',
      stack,
    }
  }

  private toErrorSchema(errors: ValidationError[]): AjvErrorSchema {
    // Transforms a ajv validation errors list:
    // [
    //   {property: ".level1.level2[2].level3", message: "err a"},
    //   {property: ".level1.level2[2].level3", message: "err b"},
    //   {property: ".level1.level2[4].level3", message: "err b"},
    // ]
    // Into an error tree:
    // {
    //   level1: {
    //     level2: {
    //       2: {level3: {errors: ["err a", "err b"]}},
    //       4: {level3: {errors: ["err b"]}},
    //     }
    //   }
    // };
    if (!errors.length) {
      return {};
    }
    return errors.reduce((errorSchema: AjvErrorSchema, error): AjvErrorSchema => {
      const { property, message } = error;
      const path = toPath(property);
      let parent = errorSchema;

      // If the property is at the root (.level1) then toPath creates
      // an empty array element at the first index. Remove it.
      if (path.length > 0 && path[0] === "") {
        path.splice(0, 1);
      }

      for (const segment of path.slice(0)) {
        if (!(segment in parent)) {
          parent[segment] = {};
        }
        parent = parent[segment];
      }

      if (Array.isArray(parent.__errors)) {
        // We store the list of errors for this node in a property named __errors
        // to avoid name collision with a possible sub schema field named
        // "errors" (see `validate.createErrorHandler`).
        parent.__errors = parent.__errors.concat(message);
      } else {
        if (message) {
          parent.__errors = [message];
        }
      }
      return errorSchema;
    }, {});
  }

  toErrorList(errorSchema?: AjvErrorSchema, fieldName = "root") {
    // XXX: We should transform fieldName as a full field path string.
    if (!errorSchema) {
      return [];
    }
    let errorList: AjvError[] = [];
    if ("__errors" in errorSchema) {
      errorList = errorList.concat(
        errorSchema.__errors!.map((stack: string) => this.stackToAjvError(`${fieldName}: ${stack}`))
      );
    }
    return Object.keys(errorSchema).reduce((acc, key) => {
      if (key !== "__errors") {
        acc = acc.concat(this.toErrorList(errorSchema[key], key));
      }
      return acc;
    }, errorList);
  }

  private createErrorHandler(formData: FormProps<any>['formData']): AjvFormValidation {
    const handler: AjvFormValidation = {
      // We store the list of errors for this node in a property named __errors
      // to avoid name collision with a possible sub schema field named
      // "errors" (see `utils.toErrorSchema`).
      __errors: [],
      addError(message: string) {
        this.__errors.push(message);
      },
    };
    if (isObject(formData)) {
      const formObject: { [k: string]: any } = formData;
      return Object.keys(formData).reduce((acc, key) => {
        return { ...acc, [key]: this.createErrorHandler(formObject[key]) };
      }, handler);
    }
    if (Array.isArray(formData)) {
      return formData.reduce((acc, value, key) => {
        return { ...acc, [key]: this.createErrorHandler(value) };
      }, handler);
    }
    return handler;
  }

  private unwrapErrorHandler(errorHandler: AjvFormValidation) {
    return Object.keys(errorHandler).reduce((acc, key) => {
      if (key === "addError") {
        return acc;
      } else if (key === "__errors") {
        return { ...acc, [key]: errorHandler[key] };
      }
      return { ...acc, [key]: this.unwrapErrorHandler(errorHandler[key]) };
    }, {});
  }

  /**
   * Transforming the error output from ajv to format used by jsonschema.
   * At some point, components should be updated to support ajv.
   */
  private transformAjvErrors(errors: Ajv['errors'] = []): AjvError[] {
    if (errors === null) {
      return [];
    }

    return errors.map((e: ErrorObject) => {
      const { dataPath, keyword, message = '', params, schemaPath } = e;
      let property = `${dataPath}`;

      // put data in expected format
      return {
        name: keyword,
        property,
        message,
        params, // specific to ajv
        stack: `${property} ${message}`.trim(),
        schemaPath,
      };
    });
  }


  /**
   * This function processes the formData with a user `validate` contributed
   * function, which receives the form data and an `errorHandler` object that
   * will be used to add custom validation errors for each field.
   */
  validateFormData(
    formData: FormProps<any>['formData'],
    schema: FormProps<any>['schema'],
    customValidate?: FormProps<any>['validate'],
    transformErrors?: FormProps<any>['transformErrors'],
  ): { errors: AjvError[]; errorSchema: ErrorSchema } {
    // Include form data with undefined values, which is required for validation.
    const rootSchema = schema;
    formData = getDefaultFormState(schema, formData, rootSchema, true);

    let validationError = null;
    try {
      this.ajv.validate(schema, formData);
    } catch (err) {
      validationError = err;
    }

    let errors = this.transformAjvErrors(this.ajv.errors);
    // Clear errors to prevent persistent errors, see #1104

    this.ajv.errors = null;

    const noProperMetaSchema =
      validationError &&
      validationError.message &&
      typeof validationError.message === "string" &&
      validationError.message.includes("no schema with key or ref ");

    if (noProperMetaSchema) {
      errors = [
        ...errors,
        this.stackToAjvError(validationError.message),
      ];
    }
    if (typeof transformErrors === "function") {
      errors = transformErrors(errors);
    }

    let errorSchema = this.toErrorSchema(errors);

    if (noProperMetaSchema) {
      errorSchema = {
        ...errorSchema,
        ...{
          $schema: {
            __errors: [validationError.message],
          },
        },
      };
    }

    if (typeof customValidate !== "function") {
      return { errors, errorSchema };
    }

    const errorHandler = customValidate(formData, this.createErrorHandler(formData));
    const userErrorSchema = this.unwrapErrorHandler(errorHandler);
    const newErrorSchema: AjvErrorSchema = mergeObjects(errorSchema, userErrorSchema, true);
    // XXX: The errors list produced is not fully compliant with the format
    // exposed by the jsonschema lib, which contains full field paths and other
    // properties.
    const newErrors = this.toErrorList(newErrorSchema);

    return {
      errors: newErrors,
      errorSchema: newErrorSchema as ErrorSchema,
    };
  }

  private withIdRefPrefixObject(node: object) {
    for (const key in node) {
      const realObj: { [k: string]: any } = node;
      const value = realObj[key];
      if (
        key === "$ref" &&
        typeof value === "string" &&
        value.startsWith("#")
      ) {
        realObj[key] = ROOT_SCHEMA_PREFIX + value;
      } else {
        realObj[key] = this.withIdRefPrefix(value);
      }
    }
    return node;
  }

  private withIdRefPrefixArray(node: object[]): FormProps<any>['schema'] {
    for (var i = 0; i < node.length; i++) {
      node[i] = this.withIdRefPrefix(node[i]);
    }
    return node as FormProps<any>['schema'];
  }

  /**
   * Recursively prefixes all $ref's in a schema with `ROOT_SCHEMA_PREFIX`
   * This is used in isValid to make references to the rootSchema
   */
  private withIdRefPrefix(schemaNode: FormProps<any>['schema']): FormProps<any>['schema'] {
    if (schemaNode.constructor === Object) {
      return this.withIdRefPrefixObject({ ...schemaNode });
    } else if (Array.isArray(schemaNode)) {
      return this.withIdRefPrefixArray([...schemaNode]);
    }
    return schemaNode;
  }

  /**
   * Validates data against a schema, returning true if the data is valid, or
   * false otherwise. If the schema is invalid, then this function will return
   * false.
   */
  isValid(schema: FormProps<any>['schema'], formData: FormProps<any>['formData'], rootSchema: FormProps<any>['schema']) {
    try {
      // add the rootSchema ROOT_SCHEMA_PREFIX as id.
      // then rewrite the schema ref's to point to the rootSchema
      // this accounts for the case where schema have references to models
      // that lives in the rootSchema but not in the schema in question.
      return this.ajv
        .addSchema(rootSchema, ROOT_SCHEMA_PREFIX)
        .validate(this.withIdRefPrefix(schema), formData);
    } catch (e) {
      return false;
    } finally {
      // make sure we remove the rootSchema from the global ajv instance
      this.ajv.removeSchema(ROOT_SCHEMA_PREFIX);
    }
  }
}
