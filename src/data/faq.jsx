import { chapters } from './chapters.js';

function ChapterSchedule() {
  return (
    <>
      <p>
        Here is the schedule as well as what curriculum is offered during the 2026-2027 school year
        chapters:
      </p>
      <ul className="chapter-list">
        {chapters.map((chapter) => (
          <li key={chapter.name} className="chapter">
            <h4>{chapter.name}</h4>
            <dl>
              <dt>Schedule</dt>
              <dd>{chapter.schedule}</dd>
              <dt>Course</dt>
              <dd>{chapter.course}</dd>
              {chapter.location && (
                <>
                  <dt>Location</dt>
                  <dd>{chapter.location}</dd>
                </>
              )}
              <dt>Chapter Head{chapter.heads.length > 1 ? 's' : ''}</dt>
              <dd>
                {chapter.heads.map((head) => (
                  <span key={head.email} className="chapter-head">
                    {head.name} (<a href={`mailto:${head.email}`}>{head.email}</a>)
                  </span>
                ))}
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export const faqs = [
  {
    question: 'Does Steel City Codes provide computers?',
    answer: (
      <p>
        Yes, we do! This is often offered more during the summer camps, where you can indicate in an email
        to reserve one for your student. During school year chapters, we prefer that the student has a
        working computer, but if not, volunteers will provide extra computers for the students.
      </p>
    ),
  },
  {
    question: 'What is the schedule for school year chapters?',
    answer: <ChapterSchedule />,
  },
  {
    question: 'How old does a student need to be?',
    answer: (
      <p>
        We prefer students from grades 4–8. But if a student is younger and is able to understand concepts
        well, we will consider it as well. Please{' '}
        <a href="mailto:denver@steelcitycodes.org">email us</a> if there is an exception!
      </p>
    ),
  },
  {
    question: 'How old does a volunteer need to be?',
    answer: (
      <p>
        A volunteer needs to be at least an incoming 9th grader. We range from 9th graders to even college
        freshmen!
      </p>
    ),
  },
  {
    question: 'Do your teachers have qualifications?',
    answer: (
      <p>
        All teachers are high schoolers who have learned at least a basic level of computer science or
        taken some college-level classes (Advanced Placement). Then, they go through a strict process of
        applications and interviews. This ensures our volunteers are professionally trained and ready for
        the job!
      </p>
    ),
  },
];
