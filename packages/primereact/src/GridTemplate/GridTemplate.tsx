import { GridTemplateProps } from '@rjsf/utils';
import { useEffect, useState } from 'react';

/** Renders a grid using `display: grid` using `span` to determine the number of columns to span.
 *
 * @param props - The GridTemplateProps, including the extra props containing the mui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, span } = props;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (column) {
    return <div style={{ gridColumn: `span ${span}` }}>{children}</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(12, 1fr)', gap: '16px' }}>
      {children}
    </div>
  );
}
