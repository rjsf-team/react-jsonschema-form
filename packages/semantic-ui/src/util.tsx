import { ElementType } from 'react';
import {
  UiSchema,
  GenericObjectType,
  getUiOptions,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
} from '@rjsf/utils';

export type SemanticPropsTypes<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> = {
  formContext?: F;
  uiSchema?: UiSchema<T, S, F>;
  options?: UIOptionsType<T, S, F>;
  defaultSchemaProps?: GenericObjectType;
  defaultContextProps?: GenericObjectType;
};

export type SemanticErrorPropsType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  formContext?: F;
  uiSchema?: UiSchema<T, S, F>;
  options?: UIOptionsType<T, S, F>;
  defaultProps?: GenericObjectType;
};

export type WrapProps = GenericObjectType & {
  wrap: boolean;
  component?: ElementType;
};

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
export function getSemanticProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  formContext = {} as F,
  uiSchema = {},
  options = {},
  defaultSchemaProps = { fluid: true, inverted: false },
  defaultContextProps = {},
}: SemanticPropsTypes<T, S, F>) {
  const formContextProps = formContext.semantic;
  const schemaProps = getUiOptions<T, S, F>(uiSchema).semantic;
  const optionProps = options.semantic;
  // formContext props should overide other props
  return Object.assign(
    {},
    { ...defaultSchemaProps },
    { ...defaultContextProps },
    schemaProps,
    optionProps,
    formContextProps
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
export function getSemanticErrorProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  formContext = {} as F,
  uiSchema = {},
  options = {},
  defaultProps = { size: 'small', pointing: 'above' },
}: SemanticErrorPropsType<T, S, F>) {
  const formContextProps = formContext.semantic && formContext.semantic.errorOptions;
  const semanticOptions: GenericObjectType = getUiOptions<T, S, F>(uiSchema).semantic as GenericObjectType;
  const schemaProps = semanticOptions && semanticOptions.errorOptions;
  const optionProps = options.semantic && (options.semantic as GenericObjectType).errorOptions;

  return Object.assign({}, { ...defaultProps }, schemaProps, optionProps, formContextProps);
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
export function cleanClassNames(classNameArr: Array<string | undefined>, omit: string[] = []) {
  // Split each arg on whitespace, and add it to an array. Skip false-y args
  // like "" and undefined.
  const classList = classNameArr
    .filter(Boolean)
    .reduce<string[]>((previous, current) => previous.concat(current!.trim().split(/\s+/)), []);

  // Remove any class names from omit, and make the rest unique before
  // returning them as a string
  return [...new Set(classList.filter((cn) => !omit.includes(cn)))].join(' ');
}

/**
 *
 * @param {boolean} wrap
 * @param Component
 * @param {Object} props
 * @returns {*}
 * @constructor
 */
export function MaybeWrap({ wrap, component: Component = 'div', ...props }: WrapProps) {
  return wrap ? <Component {...props} /> : props.children;
}
