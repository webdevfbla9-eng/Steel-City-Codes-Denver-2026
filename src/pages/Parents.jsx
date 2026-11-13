import { QRCodeSVG } from 'qrcode.react';
import FadeIn from '../components/FadeIn.jsx';
import RevealHeading from '../components/RevealHeading.jsx';
import ShiftHeading from '../components/ShiftHeading.jsx';
import FormGrid from '../components/FormGrid.jsx';
import { parentForms } from '../data/curriculum.js';
import { learningPaths } from '../data/courses.js';
import Faq from '../components/Faq.jsx';
import MessageForm from '../components/MessageForm.jsx';
import { logActivity } from '../data/activity.js';
import { faqs } from '../data/faq.jsx';
import { useAuth } from '../data/auth.js';
import { submitParentInquiry } from '../lib/inquiries.js';
import { useInquiries } from '../lib/InquiriesProvider.jsx';

const donateUrl = 'https://www.paypal.com/donate/?hosted_button_id=BUSQB9VD7UGSQ';

function scrollToForms(event) {
  event.preventDefault();
  document.getElementById('forms').scrollIntoView({ behavior: 'smooth' });
}

export default function Parents() {
  const { profile } = useAuth();
  const { refresh } = useInquiries();

  const sendQuestion = async (data) => {
    await submitParentInquiry(
      {
        name: data.name,
        email: data.email,
        question: data.message,
      },
      profile,
    );
    logActivity('parent_question', {
      name: data.name,
      email: data.email,
      message: data.message,
      role: 'parent',
      audience: 'Parents',
    });
    await refresh().catch(() => {});
  };

  return (
    <>
      <section className="section section-dark parents-hero">
        <div className="container">
          <ShiftHeading text="Parents" className="page-hero-title" />
          <FadeIn as="p" className="body-large section-intro" delay={900}>
            Parents are our strongest supporters! They continue to believe and trust in our mission, shown
            through their generous donations! Thank you so much!
          </FadeIn>
          <FadeIn delay={1100}>
            <a className="arrow-button arrow-button-yellow" href="#forms" onClick={scrollToForms}>
              Sign my kid up <span aria-hidden="true">↓</span>
            </a>
          </FadeIn>
        </div>
      </section>

      <section className="section section-offwhite">
        <div className="container split">
          <div>
            <RevealHeading className="section-title section-title-xl">Donations!</RevealHeading>
            <FadeIn as="p" className="body-large" delay={300}>
              Steel City Codes relies heavily on donations to continue providing free coding classes for
              students from all backgrounds. So if you can, please give what you can! Great thanks!
            </FadeIn>
          </div>
          <FadeIn variant="zoom" className="donate-card">
            <QRCodeSVG value={donateUrl} size={220} fgColor="#1a1613" bgColor="#ffffff" marginSize={2} title="QR code for the Steel City Codes PayPal donation page" />
            <p className="donate-caption">Scan to donate with PayPal</p>
            <a
              className="arrow-button"
              href={donateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logActivity('donation_click')}
            >
              Donate <span aria-hidden="true">↗</span>
            </a>
          </FadeIn>
        </div>
      </section>

      <section className="section section-dark" id="curriculums">
        <div className="container">
          <RevealHeading className="section-title section-title-xl">Curriculums</RevealHeading>
          <FadeIn as="p" className="body-large section-intro" delay={300}>
            We offer a diverse spectrum of curriculums during summer camps &amp; school year chapters!
          </FadeIn>
          <div className="paths">
            {learningPaths.map((path) => (
              <FadeIn key={path.name} className="path">
                <div className="path-header">
                  <img src={path.icon.src} alt="" />
                  <h3>{path.name}</h3>
                </div>
                <ol className="path-steps">
                  {path.steps.map((course, i) => (
                    <FadeIn as="li" key={course.title} className="path-step" variant="left" delay={i * 200}>
                      <span className={`path-badge${course.required ? ' path-badge-required' : ''}`}>
                        {course.badge}
                      </span>
                      <div className="path-step-icons">
                        {course.icons.map((icon) => (
                          <img key={icon.alt} src={icon.src} alt={icon.alt} />
                        ))}
                      </div>
                      <h4>{course.title}</h4>
                      <p>{course.text}</p>
                      <p className="path-level">
                        <strong>{course.levelLabel}:</strong> {course.level}
                      </p>
                    </FadeIn>
                  ))}
                </ol>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-cream" id="forms">
        <div className="container">
          <RevealHeading className="section-title">Forms</RevealHeading>
          <FadeIn as="p" className="body-large forms-intro" delay={300}>
            Here's a collection of forms to sign up your student for the different events Steel City Codes
            offers!
          </FadeIn>
          <FormGrid forms={parentForms} audience="Parents" />
        </div>
      </section>

      <section className="section section-dark" id="faq">
        <div className="container">
          <RevealHeading className="section-title section-title-xl">FAQ</RevealHeading>
          <FadeIn as="p" className="body-large section-intro" delay={300}>
            Frequently asked questions from parents. Click on a question to see the answer!
          </FadeIn>
          <FadeIn>
            <Faq items={faqs} />
          </FadeIn>

          <h3 className="subsection-title faq-ask-title" id="ask">
            Still have a question?
          </h3>
          <MessageForm
            type="parent_question"
            className="message-form-dark"
            fields={[
              { name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
              { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
              { name: 'message', label: 'Your question', multiline: true, required: true },
            ]}
            submitLabel="Ask our team"
            successMessage="Thanks for reaching out! When an administrator replies, you will see it on your dashboard."
            onSubmit={sendQuestion}
          />
        </div>
      </section>
    </>
  );
}
