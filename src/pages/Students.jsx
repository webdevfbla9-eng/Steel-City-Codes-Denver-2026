import FadeIn from '../components/FadeIn.jsx';
import RevealHeading from '../components/RevealHeading.jsx';
import ScaledFrame from '../components/ScaledFrame.jsx';
import MessageForm from '../components/MessageForm.jsx';
import DailyChallenge from '../components/ide/DailyChallenge.jsx';
import studentsPhoto from '../assets/kids-3.jpg';
import codingBackground from '../assets/coding-bg.jpg';
import idePreview from '../assets/ide-preview.jpg';

const doc = (id) => ({
  embedUrl: `https://docs.google.com/document/d/e/${id}/pub?embedded=true`,
  openUrl: `https://docs.google.com/document/d/e/${id}/pub`,
});

const references = [
  { title: 'Java', ...doc('2PACX-1vTBFqchAWA1EIdq-hwM8rfGvK-PFkUrlL_f7QXDky1BZiYVxQwo6gKrIonLGxtymy-oYzt0gH6GjK03') },
  { title: 'Python', ...doc('2PACX-1vQnXO-uCIkjaP_UM5gz87yOEmh3mcXAl83bJxLEJWFhoEXr-ngAJ3gmmDcD3RSGL7pGgMUU4O2ek-DP') },
  {
    title: 'Web Development',
    ...doc('2PACX-1vRW-vH6M8d2Yx1vmc9Zdmoi5CVUWFf4WPc0U0LVT64k_fD7pBSxh-PAVIi-vJIw6eWYpLDwFmUhszJP'),
  },
];

const ideSteps = [
  <>
    Email your school year chapter instructors or{' '}
    <a href="mailto:denver@steelcitycodes.org">denver@steelcitycodes.org</a> to request an account
  </>,
  'Click on "Start coding"',
  'Enter your class code',
  'Log into your account',
  'Start a project and code away!',
];

export default function Students() {
  return (
    <>
      <section className="section section-cream">
        <div className="container split">
          <div>
            <RevealHeading as="h1" className="section-title section-title-xl">
              Students
            </RevealHeading>
            <FadeIn as="p" className="body-large" delay={300}>
              Steel City Codes hosts over 250+ students year round. We offer coding summer camps as well as
              school year chapters.
            </FadeIn>
          </div>
          <FadeIn variant="right">
            <img className="split-image" src={studentsPhoto} alt="A high school volunteer teaching a classroom of students" />
          </FadeIn>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <RevealHeading className="section-title section-title-xl">Syntax Reference</RevealHeading>
          <FadeIn as="p" className="body-large section-intro" delay={300}>
            This is for you to reference throughout your coding journey! We hope this can help with the
            frustration of coding. Don't give up, you got it!
          </FadeIn>
          <div className="reference-grid">
            {references.map((ref, i) => (
              <FadeIn key={ref.title} className="reference-card" variant="zoom" delay={i * 150}>
                <h3>{ref.title}</h3>
                <ScaledFrame src={ref.embedUrl} title={`${ref.title} syntax reference`} />
                <a className="arrow-button arrow-button-yellow" href={ref.openUrl} target="_blank" rel="noopener noreferrer">
                  Open full guide <span aria-hidden="true">↗</span>
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-offwhite" id="challenge">
        <div className="container">
          <RevealHeading className="section-title section-title-xl">Everyday Coding Challenge!</RevealHeading>
          <FadeIn as="p" className="body-large section-intro" delay={300}>
            The best engineers practice every day to master their skills! Here is one practice every day for
            you to master your computer skills and understand every concept in depth. Enjoy, and don't be
            afraid to make mistakes!
          </FadeIn>
          <FadeIn variant="zoom">
            <DailyChallenge />
          </FadeIn>
        </div>
      </section>

      <section className="section ide-promo" style={{ '--promo-bg': `url(${codingBackground})` }}>
        <div className="container ide-promo-inner">
          <RevealHeading className="section-title section-title-xl">Try our IDE!</RevealHeading>
          <FadeIn as="p" className="body-large section-intro" delay={300}>
            You want to have more practice? Or you're becoming a serious coder? Access the National Steel City
            Codes IDE!
          </FadeIn>

          <h3 className="subsection-title">Steps</h3>
          <ol className="ide-steps">
            {ideSteps.map((step, i) => (
              <FadeIn as="li" key={i} delay={i * 120}>
                <span className="ide-step-number" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{step}</span>
              </FadeIn>
            ))}
          </ol>

          <FadeIn variant="zoom">
            <img
              className="ide-promo-image"
              src={idePreview}
              alt="The Steel City Codes IDE home page with Start coding and Try the editor buttons"
              loading="lazy"
            />
          </FadeIn>

          <h3 className="subsection-title">Request an IDE account</h3>
          <MessageForm
            type="ide_request"
            className="message-form-dark"
            fields={[
              { name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
              { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
              { name: 'chapter', label: 'Chapter or camp', placeholder: 'e.g. Koelbel Library' },
              {
                name: 'message',
                label: 'Message',
                multiline: true,
                placeholder: 'Anything our admins should know?',
              },
            ]}
            submitLabel="Send request"
            successMessage="Thanks! Your request was sent to our admins. We'll email you your account details soon."
          />

          <a
            className="arrow-button arrow-button-yellow ide-promo-button"
            href="https://code.steelcitycodes.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            IDE <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </>
  );
}
