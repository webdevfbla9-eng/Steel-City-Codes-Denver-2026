export default function ShiftHeading({ text, as: Tag = 'h1', className = '' }) {
  return (
    <Tag className={`shift-heading ${className}`} aria-label={text}>
      {[...text].map((letter, i) => (
        <span key={i} aria-hidden="true" style={{ animationDelay: `${200 + i * 70}ms` }}>
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </Tag>
  );
}
