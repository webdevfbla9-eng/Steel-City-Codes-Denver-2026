import { curriculum } from '../data/curriculum.js';

export default function CurriculumLibrary() {
  return (
    <ul className="m-0 mx-auto flex max-w-6xl list-none flex-wrap justify-center gap-6 p-0">
      {curriculum.map((course) => (
        <li
          key={course.title}
          className="group relative w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-ink/10 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:w-[calc(50%-12px)] lg:w-[calc((100%-48px)/3)]"
        >
          <div className="relative aspect-video w-full overflow-hidden bg-cream">
            <iframe
              src={course.embedUrl}
              title={`${course.title} slides preview`}
              loading="lazy"
              tabIndex={-1}
              className="pointer-events-none absolute inset-0 h-full w-full border-0"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <h3 className="m-0 font-heading text-xl font-extrabold text-ink">{course.title}</h3>
              <p className="m-0 font-body text-sm text-ink/60">{course.level}</p>
            </div>
            <span
              className="shrink-0 rounded-full bg-charcoal px-4 py-2 font-heading text-sm font-semibold text-white transition group-hover:bg-brand-yellow group-hover:text-charcoal"
              aria-hidden="true"
            >
              Open ↗
            </span>
          </div>
          <a
            href={course.openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 rounded-2xl focus-visible:outline-4 focus-visible:outline-brand-yellow"
            aria-label={`Open ${course.title} slides in Google Slides`}
          />
        </li>
      ))}
    </ul>
  );
}
