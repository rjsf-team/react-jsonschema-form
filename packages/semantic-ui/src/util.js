import React from "react";

/**
 * Extract props meant for semantic UI components from props that are
 * passed to Widgets, Templates and Fields.
 * @param {Object} params
 * @param {Object} params.formContext
 * @param {Object} params.uiSchema
 * @param {Object} params.options
 * @returns {any}
 */
export function getSemanticProps({
  formContext = {},
  uiSchema = {},
  options = {},
}) {
  return Object.assign(
    {},
    formContext.semantic || {},
    uiSchema["ui:options"] ? uiSchema["ui:options"].semantic : {},
    options.semantic || {}
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
 * @param wrap
 * @param Component
 * @param props
 * @returns {*}
 * @constructor
 */
export function MaybeWrap({ wrap, component: Component = "div", ...props }) {
  return wrap ? <Component {...props} /> : props.children;
}
