import React from "react";

/**
 * Extract props meant for semantic UI components from props that are
 * passed to Widgets, Templates and Fields.
 * @param {Object} params
 * @param {Object?} params.formContext
 * @param {Object?} params.uiSchema
 * @param {Object?} params.options
 * @param {Object?} params.defaultSchemaProps
 * @param {Object?} params.defaultContextProps
 * @returns {any}
 */
export function getSemanticProps({
  formContext = {},
  uiSchema = {},
  options = {},
  defaultSchemaProps = { fluid: true , inverted: false },
  defaultContextProps= { }
}) {

   const formContextProps = formContext.semantic;
   let schemaProps = uiSchema["ui:options"] && uiSchema["ui:options"].semantic;
   let optionProps = options.semantic;
   // formContext props should overide other props
   return Object.assign(
    {},
    { ...(defaultSchemaProps && defaultSchemaProps) },
    { ...(defaultContextProps && defaultContextProps) },
    schemaProps,
    optionProps,
    formContextProps,
  );
}

/**
 * Extract error props meant for semantic UI components from props that are
 * passed to Widgets, Templates and Fields.
 * @param {Object} params
 * @param {Object?} params.formContext
 * @param {Object?} params.uiSchema
 * @param {Object?} params.defaultProps
 * @returns {any}
 */
export function getSemanticErrorProps({
  formContext = {},
  uiSchema = {},
  options = {},
  defaultProps = { size: 'small', pointing:'above' }
}) {

  const formContextProps = formContext.semantic && formContext.semantic.errorOptions;
  const schemaProps = uiSchema["ui:options"] && uiSchema["ui:options"].semantic && uiSchema["ui:options"].semantic.errorOptions;
  const optionProps = options.semantic && options.semantic.errorOptions;

  return Object.assign(
    {},
    { ...(defaultProps && defaultProps) },
    schemaProps,
    optionProps,
    formContextProps,
  );
}

/**
 * Combine multiple strings containing class names into a single string,
 * removing duplicates. E.g.
 * cleanClassNames('bar', 'baz bar', 'x y ', undefined)
 * // 'bar baz x y'
 * @param {Array} classNameArr
 * @param {Array} omit
 * @returns {string}
 */
export function cleanClassNames(classNameArr, omit = []) {
  // Split each arg on whitespace, and add it to an array. Skip false-y args
  // like "" and undefined.
  const classList = classNameArr
    .filter(Boolean)
    .reduce(
      (previous, current) => previous.concat(current.trim().split(/\s+/)),
      []
    );

  // Remove any class names from omit, and make the rest unique before
  // returning them as a string
  return [...new Set(classList.filter(cn => !omit.includes(cn)))].join(" ");
}

/**
 *
 * @param {boolean} wrap
 * @param Component
 * @param {Object} props
 * @returns {*}
 * @constructor
 */
export function MaybeWrap({ wrap, component: Component = "div", ...props }) {
  return wrap ? <Component {...props} /> : props.children;
}
