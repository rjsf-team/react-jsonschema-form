import type { ErrorSchema, ErrorSchemaChange, FieldChange, FieldPath, FieldProps } from '../src/index.ts';
import { isFieldUpdater, mapFieldChange, resolveFieldChange, ROOT_FIELD_PATH } from '../src/index.ts';

describe('resolveFieldChange()', () => {
  it('returns a value as is', () => {
    expect(resolveFieldChange<number[]>([1], [2])).toEqual([1]);
  });
  it('applies an updater to the current value and any further arguments', () => {
    expect(resolveFieldChange((current: number, add: number) => current + add, 1, 2)).toBe(3);
  });
});

describe('mapFieldChange()', () => {
  const double = (value: number) => value * 2;
  it('transforms a value', () => {
    expect(mapFieldChange(3, double)).toBe(6);
  });
  it('transforms what an updater returns', () => {
    const mapped = mapFieldChange((current: number) => current + 1, double);
    expect(resolveFieldChange(mapped, 3)).toBe(8);
  });
});

describe('isFieldUpdater()', () => {
  it('tells an updater from a value', () => {
    expect(isFieldUpdater<number>((current) => current + 1)).toBe(true);
    expect(isFieldUpdater<number>(1)).toBe(false);
  });
});

describe("FieldProps['onChange']", () => {
  interface Data {
    a: string;
  }
  const handled: unknown[] = [];

  it('accepts a handler that takes updaters for the value and the errors', () => {
    const handler = (value: FieldChange<Data | undefined>, path: FieldPath, es?: ErrorSchemaChange<Data>) =>
      handled.push(value, path, es);
    const props: Pick<FieldProps<Data>, 'onChange'> = { onChange: handler };
    props.onChange({ a: 'x' }, ROOT_FIELD_PATH);
    props.onChange(
      (current) => current,
      ROOT_FIELD_PATH,
      (errors) => errors,
    );
    expect(handled).toHaveLength(6);
  });

  it('rejects a handler that takes only plain values or only plain errors', () => {
    const valuesOnly = (value: Data | undefined, path: FieldPath, es?: ErrorSchemaChange<Data>) =>
      handled.push(value, path, es);
    const errorsOnly = (value: FieldChange<Data | undefined>, path: FieldPath, es?: ErrorSchema<Data>) =>
      handled.push(value, path, es);
    // @ts-expect-error a handler written for plain values receives updaters too
    const withValuesOnly: Pick<FieldProps<Data>, 'onChange'> = { onChange: valuesOnly };
    // @ts-expect-error a handler written for plain errors receives error updaters too
    const withErrorsOnly: Pick<FieldProps<Data>, 'onChange'> = { onChange: errorsOnly };
    expect([withValuesOnly, withErrorsOnly]).toHaveLength(2);
  });

  it('types an inline handler with the updaters, and keeps FieldProps covariant in its data', () => {
    const props: Pick<FieldProps<Data>, 'onChange'> = {
      onChange: (value) => {
        // @ts-expect-error the value may be an updater
        handled.push(value?.a);
      },
    };
    const widened: Pick<FieldProps, 'onChange'> = props;
    expect(widened).toBe(props);
  });
});
