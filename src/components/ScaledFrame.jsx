import { useEffect, useRef, useState } from 'react';

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;

export default function ScaledFrame({ src, title }) {
  const frameRef = useRef(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const frame = frameRef.current;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / PAGE_WIDTH);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="reference-frame" ref={frameRef}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${scale})` }}
      />
    </div>
  );
}
