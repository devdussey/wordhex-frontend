"use client";

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import '@/styles/auth.css';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-loading">Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { user, loading, signInWithPassword, signUpWithPassword, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [pending, setPending] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get('next') || '/lobby';

  if (loading) {
    return <div className="auth-loading">Checking session...</div>;
  }

  if (user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-head">
            <p className="label">You are signed in</p>
            <h1>Welcome back</h1>
            <p>{user.email}</p>
          </div>
          <div className="auth-actions" style={{ marginTop: 18 }}>
            <button
              className="btn primary"
              onClick={() => router.replace(nextPath)}
            >
              Continue
            </button>
            <button className="btn secondary" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    const action = mode === 'signin' ? signInWithPassword : signUpWithPassword;
    const result = await action(email.trim(), password);

    setPending(false);
    if (result?.error) {
      setError(result.error.message);
      return;
    }

    if (mode === 'signup') {
      setMessage('Account created. Check your email for confirmation if required, then sign in.');
      setMode('signin');
      return;
    }

    router.replace(nextPath);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <div className="label">{mode === 'signin' ? 'Welcome' : 'Create account'}</div>
          <h1>{mode === 'signin' ? 'Sign in to play' : 'Sign up to play'}</h1>
          <p>Authenticate with Supabase to enter the lobby.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </label>
          <div className="auth-actions">
            <button className="btn primary" type="submit" disabled={pending}>
              {pending ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
            <button
              className="btn outline"
              type="button"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
              disabled={pending}
            >
              {mode === 'signin' ? 'Need an account?' : 'Have an account?'}
            </button>
          </div>
        </form>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <div className="auth-subtext">
          Password auth is enabled. You can also add OAuth providers later via Supabase settings.
        </div>
      </div>
    </div>
  );
}
