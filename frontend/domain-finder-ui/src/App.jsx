import { useState } from 'react';
import './App.css';

function App() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDomains([]);

    try {
      const res = await fetch('http://localhost:8000/suggest-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Something went wrong');
      }

      const data = await res.json();
      setDomains(data);  // simplified: just list of strings
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>🧠 Domain Finder</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Describe your startup idea..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Find Domains'}
        </button>
      </form>

      {error && <p className="error">❌ {error}</p>}

      {domains.length > 0 && (
        <ul className="results">
          {domains.map((name) => (
            <li key={name}>✅ <strong>{name}</strong></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
