import { useRef } from 'react';

interface CopyLinkProps {
  shareURL: string | null;
  onShare: () => void;
}

export default function CopyLink({ shareURL, onShare }: CopyLinkProps) {
  const input = useRef<HTMLInputElement>(null);

  function onCopyClick() {
    input.current?.select();
    navigator.clipboard.writeText(input.current?.value ?? '');
  }

  if (!shareURL) {
    return (
      <button className='btn btn-default' type='button' onClick={onShare}>
        Share
      </button>
    );
  }

  return (
    <div className='input-group'>
      <input type='text' ref={input} className='form-control' defaultValue={shareURL} />
      <span className='input-group-btn'>
        <button className='btn btn-default' type='button' onClick={onCopyClick}>
          <i className='glyphicon glyphicon-copy' />
        </button>
      </span>
    </div>
  );
}
