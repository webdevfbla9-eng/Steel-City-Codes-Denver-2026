import { useEffect, useState } from 'react';

export default function Typewriter({ text, as: Tag = 'h1', className = '', startDelay = 600, speed = 120 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length);
      return;
    }

    let typed = 0;
    let timer;
    const tick = () => {
      typed += 1;
      setCount(typed);
      if (typed < text.length) timer = setTimeout(tick, speed);
    };
    timer = setTimeout(tick, startDelay);

    return () => clearTimeout(timer);
  }, [text, speed, startDelay]);

  return (
    <Tag className={`typewriter ${className}`} aria-label={text}>
      <span className="typewriter-ghost" aria-hidden="true">
        {text}
        <span className="typewriter-caret" />
      </span>
      <span className="typewriter-typed" aria-hidden="true">
        {text.slice(0, count)}
        <span className="typewriter-caret" />
      </span>
    </Tag>
  );
}
