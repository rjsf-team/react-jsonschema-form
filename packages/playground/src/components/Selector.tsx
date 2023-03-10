import { memo, useState, type MouseEvent } from 'react';
// @ts-ignore
import { samples } from '../samples';

export const Selector: React.FC<{ onSelected: (data: any) => void }> = memo(({ onSelected }) => {
  const [current, setCurrent] = useState<string>('Simple');

  function onLabelClick(label: string) {
    return (event: MouseEvent) => {
      event.preventDefault();
      setCurrent(label);
      setTimeout(() => onSelected(samples[label]), 0);
    };
  }

  return (
    <ul className='nav nav-pills'>
      {Object.keys(samples).map((label, i) => {
        return (
          <li key={i} role='presentation' className={current === label ? 'active' : ''}>
            <a href='#' onClick={onLabelClick(label)}>
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
});
