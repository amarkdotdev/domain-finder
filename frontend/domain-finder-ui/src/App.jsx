import { useState } from 'react';
import './App.css';

function App() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCopied('');
    setError('');
    setDomains([]);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/suggest-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });

      const data = await res.json();
      setDomains(data);
    } catch (err) {
      setError('Could not fetch suggestions. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (domain) => {
    navigator.clipboard.writeText(domain);
    setCopied(domain);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="app">
      <div className="card">
        <h1>🧠 Domain Finder</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Write your idea"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Find Domains'}
          </button>
        </form>

        {error && <p className="error">❌ {error}</p>}

        {domains.length > 0 && (
          <div className="results">
            {domains.map((name) => (
              <div className="domain-row" key={name}>
                <span className="domain-name">✅ {name}</span>
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(name)}
                >
                  {copied === name ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
