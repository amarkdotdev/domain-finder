import { Link } from 'react-router-dom';
import './About.css';

function About() {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About Domain Finder</h1>
        <p className="subtitle">Your idea deserves the perfect domain — let's make it happen!</p>
      </div>

      <div className="about-content">
        <p>
          <strong>Domain Finder</strong> was built to bridge the gap between creativity and opportunity.
          Powered by AI, we help entrepreneurs, developers, and dreamers turn their rough ideas into
          polished, brandable domain names — without wasting hours brainstorming.
        </p>

        <p>
          Whether you're launching a startup, a personal blog, or the next big app,
          <em>finding the right name</em> is crucial. Our goal is simple:
          give you fresh, available domain ideas in seconds.
        </p>

        <p>
          This project is proudly made with ❤️by Aharon Mark using
          <span className="highlight"> React</span>,
          <span className="highlight"> FastAPI</span>,
          <span className="highlight"> Gemini's AI content generation API</span>,
          and <span className="highlight">GoDaddy's domain availability API</span>.
        </p>

        <p className="quote">
          "The best way to predict the future is to invent it."
        </p>

        <Link to="/" className="back-home-button">← Back to Search</Link>
      </div>
    </div>
  );
}

export default About;
