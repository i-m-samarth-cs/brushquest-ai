import { useState } from 'react';
import { loginUser, registerUser } from '../services/api.js';

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await loginUser(username, password);
      } else {
        data = await registerUser(username, password);
      }
      onAuthSuccess(data); // Pass user data to App
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bq-base relative px-4">
      <div className="w-full max-w-md bg-bq-card border border-bq-border/50 rounded-2xl shadow-xl p-8 z-10">
        <h1 className="text-3xl font-display font-bold text-center text-bq-text mb-2">
          BrushQuest AI
        </h1>
        <p className="text-center text-bq-muted mb-8">
          {isLogin ? 'Welcome back! Login to continue your journey.' : 'Create an account to start learning.'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bq-muted mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-bq-surface/50 border border-bq-border rounded-xl px-4 py-3 text-bq-text outline-none focus:border-bq-accent transition-colors"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bq-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bq-surface/50 border border-bq-border rounded-xl px-4 py-3 text-bq-text outline-none focus:border-bq-accent transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-bq-accent to-bq-accent2 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-bq-muted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-bq-accent hover:underline font-semibold"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
