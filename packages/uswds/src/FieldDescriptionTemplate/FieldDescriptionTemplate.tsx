import React from 'react';
import { DescriptionFieldProps } from '@rjsf/utils';

export default function FieldDescriptionTemplate<T = any, S = any, F = any>(
  props: DescriptionFieldProps<T, S, F>
) {
  const { id, description } = props;

  // simple **bold** / *italic* → <strong>/<em>
  const html = description
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  return (
    <div 
      id={id}
      className="usa-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}