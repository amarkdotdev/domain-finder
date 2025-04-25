import { useState } from 'react';
// Importing icons remains the same
import { FaLightbulb, FaSearch, FaCopy, FaCheckCircle, FaTimesCircle, FaSpinner, FaCheck } from 'react-icons/fa';
// Importing the refined CSS
import './App.css';

function App() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState('');
  const [copiedDomain, setCopiedDomain] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false); // Keep track if a search was initiated

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idea.trim()) return; // Prevent submission if idea is only whitespace

    // Reset states before new search
    setCopiedDomain('');
    setError('');
    setDomains([]);
    setLoading(true);
    setSearchAttempted(true); // Mark that a search has been tried

    try {
      // Basic client-side validation
      if (idea.length < 5) {
        throw new Error("Idea description is too short. Please be more descriptive!");
      }

      // Fetch suggestions from the backend
      const res = await fetch('http://127.0.0.1:8000/suggest-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });

      // Handle non-successful responses
      if (!res.ok) {
        // Try to parse error detail from backend, provide fallback
        const errorData = await res.json().catch(() => ({ detail: `Network error! Status: ${res.status}` }));
        throw new Error(errorData.detail || `An unexpected error occurred (Status: ${res.status})`);
      }

      // Process successful response
      const data = await res.json();
      // Ensure data is an array before setting state
      setDomains(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("Fetch or processing error:", err);
      // Display user-friendly error message
      setError(err.message || 'Could not fetch suggestions. Please check your connection and try again.');
      setDomains([]); // Clear domains on error
    } finally {
      // Ensure loading is set to false regardless of success or error
      setLoading(false);
    }
  };

  // Handle copying domain to clipboard
  const handleCopy = (domain) => {
    navigator.clipboard.writeText(domain)
      .then(() => {
        setCopiedDomain(domain); // Set which domain was copied for feedback
        // Reset copied feedback after a short delay
        setTimeout(() => setCopiedDomain(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy domain: ', err);
        setError('Failed to copy domain to clipboard. Please try again.'); // Show error if copy fails
      });
  };

  // Determine which state message/content to display
  const showPlaceholder = !loading && !error && !searchAttempted;
  const showNoResults = !loading && !error && searchAttempted && domains.length === 0;
  const showResults = !loading && domains.length > 0;

  return (
    // Main container with background and centering
    <div className="app-container">
      {/* Content card */}
      <main className="content-wrapper">
        {/* Header Section */}
        <header className="app-header">
          <FaLightbulb className="header-icon" aria-hidden="true" />
          <h1>Domain Idea Generator</h1>
          <p className="subtitle">Let's find the perfect domain for your next big thing!</p>
        </header>

        {/* Search Form Section */}
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="textarea-container">
            <label htmlFor="idea-input" className="sr-only">Describe your idea</label>
            <textarea
              id="idea-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Enter keywords or describe your business, project, or app..."
              required
              disabled={loading} // Disable textarea while loading
              rows={5} // Slightly increased default rows
            />
          </div>
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !idea.trim()} // Disable button if loading or idea is empty/whitespace
          >
            {loading ? (
              <>
                <FaSpinner className="spinner-icon" aria-hidden="true" /> Generating Ideas...
              </>
            ) : (
              <>
                <FaSearch aria-hidden="true" /> Find Domains
              </>
            )}
          </button>
        </form>

        {/* Results Section */}
        <div className="results-section">
          {/* Loading Indicator */}
          {loading && (
            <div className="status-message loading">
              <FaSpinner className="spinner-icon" aria-hidden="true" /> Searching for available domains... Hang tight!
            </div>
          )}

          {/* Error Message Display */}
          {error && (
            <div className="status-message error">
              <FaTimesCircle aria-hidden="true" /> {error}
            </div>
          )}

          {/* Initial Placeholder Message */}
          {showPlaceholder && (
            <div className="status-message placeholder">
              <p>Type your idea above and click "Find Domains" to get started.</p>
              <p className="placeholder-tip">Tip: Be descriptive for better results!</p>
            </div>
          )}

          {/* No Results Found Message */}
          {showNoResults && (
            <div className="status-message info">
              <p>No domain suggestions found for that idea.</p>
              <p className="info-tip">Try rephrasing, adding more keywords, or being more specific.</p>
            </div>
          )}

          {/* Display Domain Results */}
          {showResults && (
            <div className="results-list">
              <h2>Suggested Domains:</h2>
              <ul>
                {domains.map((name) => (
                  <li key={name} className="domain-item">
                    <span className="domain-name">
                      {/* Using a checkmark for visual confirmation */}
                      <FaCheckCircle className="icon-available" aria-hidden="true" />
                      {name}
                    </span>
                    <button
                      className={`copy-button ${copiedDomain === name ? 'copied' : ''}`}
                      onClick={() => handleCopy(name)}
                      title={`Copy ${name} to clipboard`}
                      aria-label={`Copy domain name ${name}`}
                    >
                      {/* Show Check icon when copied, Copy icon otherwise */}
                      {copiedDomain === name ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />}
                      {/* Tooltip text changes based on state */}
                      <span className="copy-tooltip">
                        {copiedDomain === name ? 'Copied!' : 'Copy'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="results-note">Note: Domain availability needs final verification with a registrar.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Section */}
      <footer className="app-footer">
        © {new Date().getFullYear()} Domain Idea Generator. Powered by AI.
      </footer>
    </div>
  );
}

export default App;