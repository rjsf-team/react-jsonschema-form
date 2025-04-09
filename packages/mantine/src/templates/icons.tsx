import React from 'react';

interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

export function Plus({ size, style, ...others }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='icon icon-tabler icons-tabler-outline icon-tabler-plus'
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M12 5l0 14' />
      <path d='M5 12l14 0' />
    </svg>
  );
}

export function Copy({ size, style, ...others }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='icon icon-tabler icons-tabler-outline icon-tabler-copy'
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z' />
      <path d='M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1' />
    </svg>
  );
}

export function ChevronDown({ size, style, ...others }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='icon icon-tabler icons-tabler-outline icon-tabler-chevron-down'
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M6 9l6 6l6 -6' />
    </svg>
  );
}

export function ChevronUp({ size, style, ...others }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='icon icon-tabler icons-tabler-outline icon-tabler-chevron-up'
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M6 15l6 -6l6 6' />
    </svg>
  );
}

export function X({ size, style, ...others }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='icon icon-tabler icons-tabler-outline icon-tabler-x'
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M18 6l-12 12' />
      <path d='M6 6l12 12' />
    </svg>
  );
}

export function ExclamationCircle({ size, style, ...others }: IconProps) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='icon icon-tabler icons-tabler-outline icon-tabler-exclamation-circle'
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path d='M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' />
      <path d='M12 9v4' />
      <path d='M12 16v.01' />
    </svg>
  );
}
