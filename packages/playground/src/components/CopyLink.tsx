import { useRef } from 'react';

interface CopyLinkProps {
  shareURL: string | null;
  onShare: () => void;
}

export default function CopyLink({ shareURL, onShare }: CopyLinkProps) {
  const input = useRef<HTMLInputElement>(null);

  function onCopyClick() {
    input.current?.select();
    navigator.clipboard.writeText(input.current?.value ?? '').catch((e) => {
      // oxlint-disable-next-line no-console
      console.error('clipboard write failed', e);
    });
  }

  const style = { maxWidth: '21.525rem', margin: '5px 0' };
  if (!shareURL) {
    return (
      <button className='btn btn-default' type='button' onClick={onShare} style={style}>
        Share Playground
      </button>
    );
  }

  return (
    <div className='input-group' style={style}>
      <input type='text' ref={input} className='form-control' defaultValue={shareURL} />
      <span className='input-group-btn'>
        <button aria-label='Copy link' className='btn btn-default' type='button' onClick={onCopyClick}>
          <i className='glyphicon glyphicon-copy' />
        </button>
      </span>
    </div>
  );
}
