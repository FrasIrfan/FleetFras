import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle } from '../../lib/firebase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      console.log('[Login] Firebase Auth user:', user);
      // Get ID token
      const idToken = await user.getIdToken();
      console.log('[Login] Got ID token:', idToken);
      // Call sessionLogin API
      const apiRes = await fetch('/api/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      console.log('[Login] sessionLogin API response:', apiRes.status);
      // Reload the page or redirect to home (server will handle role-based redirect)
      window.location.href = '/';
    } catch (err) {
      console.error('[Login] Error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const user = await signInWithGoogle();
      console.log('[Login] Google Auth user:', user);
      // Get ID token
      const idToken = await user.getIdToken();
      console.log('[Login] Got Google ID token:', idToken);
      // Call sessionLogin API
      const apiRes = await fetch('/api/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      console.log('[Login] sessionLogin API response:', apiRes.status);
      window.location.href = '/';
    } catch (err) {
      console.error('[Login] Google Error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - FleetFras</title>
      </Head>
      <main className="ff-auth-page">
        <div className="ff-auth-shell">
          <section className="hidden lg:block">
            <p className="ff-kicker">FleetFras</p>
            <h1 className="max-w-xl text-6xl font-semibold leading-[0.96] tracking-[-0.06em] text-slate-950">
              Manage your fleet with less noise.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
              A clean workspace for car listings, role-based dashboards, chats, and approvals.
            </p>
            <div className="mt-10 grid max-w-md grid-cols-2 gap-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-purple-100 bg-white/70 p-4">Secure sessions</div>
              <div className="rounded-2xl border border-purple-100 bg-white/70 p-4">Role dashboards</div>
            </div>
          </section>

          <section className="ff-auth-panel auth-form-container">
            <div className="mb-8">
              <p className="ff-kicker">Welcome back</p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Sign in to FleetFras</h2>
              <p className="mt-2 text-sm text-slate-500">Use your account details to continue.</p>
            </div>

            {error && (
              <div className="auth-form-error mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="auth-form-input auth-input-focus ff-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="auth-form-input auth-input-focus ff-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-slate-600" htmlFor="remember-me">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="auth-checkbox h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
                <a href="#" className="font-semibold text-purple-700 hover:text-purple-800">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-form-button ff-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="auth-form-button ff-button-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="mr-2 h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Sign in with Google
            </button>

            <p className="mt-8 text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-purple-700 hover:text-purple-800">
                Sign up
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
} 