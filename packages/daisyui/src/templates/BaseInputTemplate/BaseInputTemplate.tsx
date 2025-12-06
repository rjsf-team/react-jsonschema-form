import { ChangeEvent, FocusEvent, useCallback } from 'react';
import {
  WidgetProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  getInputProps,
  ariaDescribedByIds,
  examplesId,
} from '@rjsf/utils';
import { X } from 'lucide-react';

/** The `BaseInputTemplate` component is a template for rendering basic input elements
 * with DaisyUI styling. It's used as the foundation for various input types in forms.
 *
 * Features:
 * - Wraps input in DaisyUI's form-control for proper spacing
 * - Uses DaisyUI's input and input-bordered classes for styling
 * - Includes a hidden label for accessibility
 * - Handles common input properties like disabled and readonly states
 * - Processes input props based on schema type and options
 * - Supports schema examples with datalist
 * - Handles onChange, onBlur, and onFocus events
 *
 * @param props - The `WidgetProps` for the component
 */
export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    multiple,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    onChangeOverride,
    options,
    schema,
    type,
    label,
    placeholder,
  } = props;

  const inputProps = getInputProps<T, S, F>(schema, type, options);
  let className = 'input input-bordered w-full';
  let isMulti = multiple;
  if (type === 'file') {
    isMulti = schema.type === 'array' || Boolean(options.multiple);
    className = 'file-input';
  }
  // Extract step, min, max, accept from inputProps
  const { step, min, max, accept, ...rest } = inputProps;
  const htmlInputProps = { step, min, max, accept, ...(schema.examples ? { list: examplesId(id) } : undefined) };

  const _onChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => onChange(value === '' ? options.emptyValue : value),
    [onChange, options],
  );

  const _onBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => onBlur && onBlur(id, target.value),
    [onBlur, id],
  );

  const _onFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => onFocus && onFocus(id, target.value),
    [onFocus, id],
  );

  return (
    <>
      <div className='form-control'>
        <label htmlFor={id} className='label hidden' style={{ display: 'none' }}>
          <span className='label-text'>{label}</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id={id}
            name={htmlName || id}
            value={value || value === 0 ? value : ''}
            placeholder={placeholder}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            className={className}
            multiple={isMulti}
            {...rest}
            {...htmlInputProps}
            onChange={onChangeOverride || _onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
          />
          {options.allowClear && !readonly && !disabled && value && (
            <button
              type='button'
              onClick={() => onChange('')}
              aria-label='Clear input'
              style={{
                backgroundColor: 'transparent',
                cursor: 'pointer',
                border: '2px solid #ccc',
                position: 'absolute',
                left: '97%',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                borderRadius: '50%',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      {Array.isArray(schema.examples) && (
        <datalist id={examplesId(id)}>
          {(schema.examples as string[])
            .concat(schema.default && !schema.examples.includes(schema.default) ? ([schema.default] as string[]) : [])
            .map((example: any) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      )}
    </>
  );
}
