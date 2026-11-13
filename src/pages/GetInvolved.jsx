import { Link } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import RevealHeading from '../components/RevealHeading.jsx';
import { chapters } from '../data/chapters.js';
import rootsPhoto from '../assets/kids-3.jpg';
import solutionPhoto from '../assets/kids.jpg';
import chaptersPhoto from '../assets/chapters-1.jpg';
import campPhoto from '../assets/kids-2.jpg';
import somritPhoto from '../assets/team/somrit.png';
import tanayPhoto from '../assets/team/tanay.jpg';
import tukaPhoto from '../assets/team/tuka.jpg';
import haaniePhoto from '../assets/team/haanie.jpg';
import lucyPhoto from '../assets/team/lucy.jpg';
import { courseList } from '../data/courses.js';

const stats = [
  { number: '85% → 59%', text: 'interest in computer science from 5th grade to 12th grade' },
  { number: '1 in 2', text: 'schools teach computer science, though 9 in 10 parents want it taught' },
  {
    number: '18%',
    text: "of computer science bachelor's degrees in the United States are earned by women",
  },
];

const programs = [
  {
    title: 'Chapters',
    photo: chaptersPhoto,
    alt: 'Students following along with a Java lesson at a school year chapter',
    text: 'School year chapters are held every single week, and days and times vary by location. Chapters will always be free; costs are covered by us and our school partners.',
  },
  {
    title: 'Summer Camp',
    photo: campPhoto,
    alt: 'Smiling students at their desks during summer camp',
    text: 'Our camp is held during the summer, normally the first two weeks of June. Students spend an 8-hour day learning well-developed curriculums from high school mentors. All costs are covered by Steel City Codes Denver, including computers and lunch if needed.',
  },
];

const team = [
  {
    name: 'Ms. Somrit',
    photo: somritPhoto,
    // Source photo has empty space on the right, so zoom in on the left half.
    imgStyle: { width: '200%', height: 'auto', objectFit: 'unset' },
    bio: "Hi! I'm Ms. Somrit, the new CS teacher at CCHS and the teacher sponsor for SCC! I'm a Creek and Mines alum! Looking forward to working with you all!",
  },
  {
    name: 'Tanay Shah',
    photo: tanayPhoto,
    imgStyle: { objectPosition: '50% 30%' },
    bio: "Hi, my name is Tanay Shah and I am a rising senior at Grandview High School. In my free time I like to hike. I first learned to code at SCC and can't wait to teach your students as well!",
  },
  {
    name: 'Tuka Bayasgalan',
    photo: tukaPhoto,
    imgStyle: { objectPosition: '57% 15%' },
    bio: "Hey, I'm Tuka Bayasgalan! I'm a junior at Cherry Creek and am so excited to be a part of SCC for another year. I taught Intro to Java at our last summer camp and ran our Koelbel Library chapter this year! I'm looking forward to meeting all our students this year :)))",
  },
  {
    name: 'Haanie Mohammed',
    photo: haaniePhoto,
    imgStyle: { objectPosition: '50% 10%' },
    bio: "Hi, I'm Haanie, a rising senior at Grandview High School. I'm excited to teach this year!",
  },
  {
    name: 'Lucy Chen',
    photo: lucyPhoto,
    imgStyle: { objectPosition: '50% 20%' },
    bio: "Hi, my name is Lucy Chen! I'm a junior at Cherry Creek High School and am passionate about coding, piano and painting! I first learned to code at SCC and can't wait to teach other students about my passion!",
  },
];

export default function GetInvolved() {
  return (
    <>
      <section className="section section-offwhite">
        <div className="container split">
          <div>
            <RevealHeading as="h1" className="section-title">
              We're tackling problems in STEM at their roots.
            </RevealHeading>
            <FadeIn as="p" className="body-large" delay={500}>
              Steel City Codes is a student-run 501(c)(3) nonprofit. We teach computer science to
              elementary and middle school students for free, so any student from any background can
              take part.
            </FadeIn>
          </div>
          <img className="split-image" src={rootsPhoto} alt="A high school volunteer teaching a classroom of students" />
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <RevealHeading className="section-title">Inclusivity is Decreasing</RevealHeading>
          <ul className="fact-grid">
            {stats.map((stat, i) => (
              <FadeIn as="li" variant="zoom" key={stat.number} className="fact" delay={i * 200}>
                <span className="fact-number">{stat.number}</span>
                <p className="fact-text">{stat.text}</p>
              </FadeIn>
            ))}
          </ul>
          <p className="source-note">Statistics come from Education Week and ComputerScience.org</p>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container split split-reverse">
          <div>
            <RevealHeading className="section-title">Our Solution</RevealHeading>
            <FadeIn as="p" className="body-large" delay={300}>
              We host different educational events to ensure students who have demonstrated interest
              are mentored professionally.
            </FadeIn>
          </div>
          <img className="split-image" src={solutionPhoto} alt="An auditorium full of students at a Steel City Codes event" loading="lazy" />
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <RevealHeading className="section-title">We Host:</RevealHeading>
          <div className="program-grid">
            {programs.map((program, i) => (
              <FadeIn
                as="article"
                key={program.title}
                className="program"
                variant={i % 2 === 0 ? 'left' : 'right'}
              >
                <img src={program.photo} alt={program.alt} loading="lazy" />
                <h3>{program.title}</h3>
                <p>{program.text}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <RevealHeading className="section-title section-title-xl">Curriculums</RevealHeading>
          <FadeIn as="p" className="body-large section-intro" delay={300}>
            We offer a diverse spectrum of curriculums during summer camps &amp; school year chapters!
          </FadeIn>
          <ul className="course-grid">
            {courseList.map((course, i) => (
              <FadeIn as="li" key={course.title} className="course" variant="zoom" delay={(i % 3) * 150}>
                <div className="course-icons">
                  {course.icons.map((icon) => (
                    <img key={icon.alt} src={icon.src} alt={icon.alt} />
                  ))}
                </div>
                <h3>{course.title}</h3>
                <p>{course.text}</p>
                <p className={`course-level${course.required ? ' course-level-required' : ''}`}>
                  <strong>{course.levelLabel}:</strong> {course.level}
                </p>
              </FadeIn>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-cream" id="chapters">
        <div className="container">
          <RevealHeading className="section-title section-title-xl">Chapters</RevealHeading>
          <FadeIn as="p" className="body-large chapter-intro" delay={300}>
            Here are the four chapters that are active now. Each offers different curriculums based on the
            student majority’s needs, but if you have a special request, feel free to email us at{' '}
            <a href="mailto:denver@steelcitycodes.org">denver@steelcitycodes.org</a>.
          </FadeIn>
          <div className="chapter-showcase">
            {chapters.map((chapter, i) => (
              <FadeIn
                key={chapter.name}
                className={`chapter-block${i % 2 === 1 ? ' chapter-block-reverse' : ''}`}
                variant={i % 2 === 0 ? 'left' : 'right'}
              >
                <img className="chapter-photo" src={chapter.photo} alt={chapter.alt} loading="lazy" />
                <div className="chapter-copy">
                  <h3>{chapter.name}</h3>
                  <dl>
                    <dt>Schedule</dt>
                    <dd>{chapter.schedule}</dd>
                    <dt>Course</dt>
                    <dd>{chapter.course}</dd>
                    {chapter.location ? (
                      <>
                        <dt>Location</dt>
                        <dd>{chapter.location}</dd>
                      </>
                    ) : null}
                    <dt>Chapter Head{chapter.heads.length > 1 ? 's' : ''}</dt>
                    <dd>
                      {chapter.heads.map((head) => (
                        <span key={head.email} className="chapter-head">
                          {head.name} (<a href={`mailto:${head.email}`}>{head.email}</a>)
                        </span>
                      ))}
                    </dd>
                  </dl>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-offwhite">
        <div className="container">
          <RevealHeading className="section-title section-title-xl">Youth Led Organization</RevealHeading>
          <FadeIn as="p" className="body-large youth-intro" delay={300}>
            Steel City Codes also continues to focus on giving leadership opportunities to high school
            students. This includes regional director positions as well as chapter leader positions.
          </FadeIn>
          <FadeIn className="youth-cta" delay={450}>
            <Link to="/volunteers" className="arrow-button arrow-button-yellow">
              Get Involved <span aria-hidden="true">→</span>
            </Link>
          </FadeIn>
          <RevealHeading as="h3" className="subsection-title">Our Administration Team</RevealHeading>
          <ul className="team-grid">
            {team.map((member, i) => (
              <FadeIn
                as="li"
                variant="zoom"
                delay={(i % 3) * 150}
                key={member.name}
                className={`team-member ${i % 2 === 0 ? 'team-dark' : 'team-yellow'}`}
              >
                <div className="team-photo">
                  <img src={member.photo} alt={member.name} loading="lazy" style={member.imgStyle} />
                </div>
                <div className="team-card">
                  <h4>{member.name}</h4>
                  <p>{member.bio}</p>
                </div>
              </FadeIn>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
