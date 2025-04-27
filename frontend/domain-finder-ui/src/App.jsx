import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaLightbulb, FaSearch, FaCopy, FaCheckCircle, FaTimesCircle, FaSpinner, FaCheck } from 'react-icons/fa';
import './App.css';

function App() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState('');
  const [copiedDomain, setCopiedDomain] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!idea.trim() || loading) return;

    setCopiedDomain('');
    setError('');
    setDomains([]);
    setLoading(true);
    setSearchAttempted(true);

    try {
      if (idea.length < 5) {
        throw new Error("Idea description is too short. Please be more descriptive!");
      }

      const res = await fetch('http://127.0.0.1:8000/suggest-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `Network error! Status: ${res.status}` }));
        throw new Error(errorData.detail || `An unexpected error occurred (Status: ${res.status})`);
      }

      const data = await res.json();
      setDomains(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("Fetch or processing error:", err);
      setError(err.message || 'Could not fetch suggestions. Please check your connection and try again.');
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (domain) => {
    navigator.clipboard.writeText(domain)
      .then(() => {
        setCopiedDomain(domain);
        setTimeout(() => setCopiedDomain(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy domain: ', err);
        setError('Failed to copy domain to clipboard. Please try again.');
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const showPlaceholder = !loading && !error && !searchAttempted;
  const showNoResults = !loading && !error && searchAttempted && domains.length === 0;
  const showResults = !loading && domains.length > 0;

  return (
    <div className="app-container">
      {/* --- Top Navigation --- */}
      <div className="top-nav">
        {/* Desktop About link */}
        <Link to="/about" className="about-link">About</Link>

        {/* Mobile Hamburger */}
        <div className="mobile-menu">
          <button
            className="menu-button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
          >
            ☰
          </button>

          {/* Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className="dropdown-menu">
              <Link to="/about" className="dropdown-link" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* --- Main Content --- */}
      <main className="content-wrapper">
        <header className="app-header">
          <FaLightbulb className="header-icon" aria-hidden="true" />
          <h1>Domain Idea Generator</h1>
          <p className="subtitle">Let's find the perfect domain for your next big thing!</p>
        </header>

        <form className="search-form" onSubmit={handleSubmit}>
          <div className="textarea-container">
            <label htmlFor="idea-input" className="sr-only">Describe your idea</label>
            <textarea
              id="idea-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter keywords or describe your business, project, or app..."
              required
              disabled={loading}
              rows={4}
            />
            <p className="submit-hint">
              Press Enter to submit (Shift+Enter for new line)
            </p>
          </div>
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !idea.trim()}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner-icon" aria-hidden="true" /> Generating...
              </>
            ) : (
              <>
                <FaSearch aria-hidden="true" /> Find Domains
              </>
            )}
          </button>
        </form>

        {/* --- Results --- */}
        <div className="results-section">
          {loading && (
            <div className="status-message loading">
              <FaSpinner className="spinner-icon" aria-hidden="true" /> Searching... Hang tight!
            </div>
          )}
          {error && (
            <div className="status-message error">
              <FaTimesCircle aria-hidden="true" /> {error}
            </div>
          )}
          {showPlaceholder && (
            <div className="status-message placeholder">
              <p>Type your idea above to get started.</p>
              <p className="placeholder-tip">Tip: Be descriptive for better results!</p>
            </div>
          )}
          {showNoResults && (
            <div className="status-message info">
              <p>No domain suggestions found.</p>
              <p className="info-tip">Try rephrasing or adding more keywords.</p>
            </div>
          )}
          {showResults && (
            <div className="results-list">
              <h2>Suggested Domains:</h2>
              <ul>
                {domains.map((name) => (
                  <li key={name} className="domain-item">
                    <span className="domain-name">
                      <FaCheckCircle className="icon-available" aria-hidden="true" />
                      {name}
                    </span>
                    <button
                      className={`copy-button ${copiedDomain === name ? 'copied' : ''}`}
                      onClick={() => handleCopy(name)}
                      title={`Copy ${name} to clipboard`}
                      aria-label={`Copy domain name ${name}`}
                    >
                      {copiedDomain === name ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />}
                      <span className="copy-tooltip">
                        {copiedDomain === name ? 'Copied!' : 'Copy'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="results-note">Note: Domain availability needs final verification.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        © {new Date().getFullYear()} Domain Idea Generator - Powered by AI
      </footer>
    </div>
  );
}

export default App;
