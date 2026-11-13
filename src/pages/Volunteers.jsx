import FadeIn from '../components/FadeIn.jsx';
import RevealHeading from '../components/RevealHeading.jsx';
import Typewriter from '../components/Typewriter.jsx';
import CurriculumLibrary from '../components/CurriculumLibrary.jsx';
import FormGrid from '../components/FormGrid.jsx';
import EvaluationIDE from '../components/ide/EvaluationIDE.jsx';
import { forms } from '../data/curriculum.js';
import heroPhoto from '../assets/volunteers-hero.jpg';

export default function Volunteers() {
  return (
    <>
      <section className="page-hero" aria-label="Volunteers">
        <img className="page-hero-image" src={heroPhoto} alt="" />
        <div className="page-hero-overlay" />
        <Typewriter text="Volunteers" className="page-hero-title" />
      </section>

      <section className="section section-offwhite" id="forms">
        <div className="container">
          <RevealHeading className="section-title">Forms</RevealHeading>
          <FadeIn as="p" className="body-large forms-intro" delay={300}>
            Sign up to become a part of Steel City Codes, where you can earn leadership positions and
            volunteering hours!
          </FadeIn>
          <FormGrid forms={forms} audience="Volunteers" />
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <RevealHeading className="section-title">Curriculum</RevealHeading>
          <FadeIn as="p" className="body-large curriculum-intro" delay={300}>
            Steel City Codes offers different programs due to different interests from students. Choose
            the language you want to teach, and the following curriculum will pop up.
          </FadeIn>
          <CurriculumLibrary />
        </div>
      </section>

      <section className="section section-dark" id="evaluation">
        <div className="container">
          <RevealHeading className="section-title">Evaluation</RevealHeading>
          <FadeIn as="p" className="body-large evaluation-intro" delay={300}>
            This challenge is to evaluate if you actually understand the language or not. This ensures
            that Steel City Codes is professional and well trained.
          </FadeIn>
          <FadeIn variant="zoom">
            <EvaluationIDE />
          </FadeIn>
        </div>
      </section>
    </>
  );
}
