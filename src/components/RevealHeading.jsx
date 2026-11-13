import { Fragment } from 'react';
import { useInView } from './FadeIn.jsx';

export default function RevealHeading({ as: Tag = 'h2', className = '', children }) {
  const [ref, visible] = useInView(0.5);
  const words = String(children).split(' ');

  return (
    <Tag ref={ref} className={`reveal-heading ${visible ? 'is-visible' : ''} ${className}`} aria-label={children}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="reveal-word" aria-hidden="true">
            <span style={{ transitionDelay: `${i * 90}ms` }}>{word}</span>
          </span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  );
}
