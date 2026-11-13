import { Link } from 'react-router-dom';
import CountUp from '../components/CountUp.jsx';
import FadeIn from '../components/FadeIn.jsx';
import RevealHeading from '../components/RevealHeading.jsx';
import { useAuth } from '../data/auth.js';
import { homePathFor } from '../auth/permissions.js';
import heroPhoto from '../assets/volunteer-2.jpg';
import inclusivityPhoto from '../assets/volunteer-3.jpg';

const stats = [
  { end: 200, suffix: '+', label: 'students served' },
  { end: 50, suffix: '+', label: 'volunteers' },
  { end: 4, suffix: '', label: 'active school year chapters' },
];

const pillars = [
  {
    title: 'Taught by high schoolers',
    text: 'Our volunteers are in grades 9-12, only a few years older than the students they teach.',
  },
  {
    title: 'Always free',
    text: 'Sponsors and donors cover the cost of every chapter, camp, and hackathon. Families never pay.',
  },
  {
    title: 'Relevant coding languages simplified',
    text: 'Students learn Python and Java with a curriculum we have refined since 2018.',
  },
];

const involvement = [
  {
    title: 'Parents',
    text: 'Sign up kids to learn Python, Java, or project-based curriculums!',
    to: '/parents',
  },
  {
    title: 'Volunteers',
    text: "Sign up to volunteer! Teach whatever you are professional at. Whether it's Python or Java, Steel City Codes always has a place for you!",
    to: '/volunteers',
  },
];

export default function Home() {
  const { user, profile } = useAuth();
  return (
    <>
      <section className="hero" aria-label="Welcome">
        <img className="hero-image" src={heroPhoto} alt="Steel City Codes Denver volunteers group photo" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-line">Welcome to Steel City Codes!</span>
            <span className="hero-line">
              <span className="hero-underline">STEM education for all backgrounds.</span>
            </span>
          </h1>
          <Link to={user ? homePathFor(profile) : '/signup'} className="arrow-button arrow-button-yellow hero-cta">
            {user ? 'Go to my dashboard' : 'Sign up'} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="section section-cream stats-section">
        <div className="container">
          <RevealHeading className="section-title">Since 2018.</RevealHeading>
          <ul className="stats">
            {stats.map((stat, i) => (
              <FadeIn as="li" variant="zoom" delay={i * 150} key={stat.label} className="stat">
                <span className="stat-number">
                  <CountUp end={stat.end} suffix={stat.suffix} />
                </span>
                <span className="stat-label">{stat.label}</span>
              </FadeIn>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container inclusivity">
          <div className="inclusivity-text">
            <RevealHeading className="section-title">Inclusivity in STEM</RevealHeading>
            <FadeIn as="p" className="lead" delay={300}>
              We teach young students computer science to make STEM more inclusive.
            </FadeIn>
            {pillars.map((pillar, i) => (
              <FadeIn key={pillar.title} className="pillar" variant={i % 2 === 0 ? 'left' : 'right'}>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </FadeIn>
            ))}
          </div>
          <img
            className="inclusivity-image"
            src={inclusivityPhoto}
            alt="Students coding on laptops during a Steel City Codes session"
            loading="lazy"
          />
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <RevealHeading className="section-title">Get Involved</RevealHeading>
          <div className="involve-grid">
            {involvement.map((item, i) => (
              <FadeIn key={item.title} className="involve-card" delay={i * 150}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link to={item.to} className="arrow-button">
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
