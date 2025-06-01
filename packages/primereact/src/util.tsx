export function Label({ id, text, required }: { id: string; text?: string; required?: boolean }) {
  if (!text) {
    return null;
  }

  return (
    <label htmlFor={id}>
      {text} {required ? '*' : ''}
    </label>
  );
}
