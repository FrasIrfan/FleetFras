import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, signInWithGoogle } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'purchaser'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: formData.role,
        createdAt: new Date().toISOString(),
      });
      
      router.push('/login');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - FleetFras</title>
      </Head>
      <main className="ff-auth-page">
        <div className="ff-auth-shell">
          <section className="hidden lg:block">
            <p className="ff-kicker">Start clean</p>
            <h1 className="max-w-xl text-6xl font-semibold leading-[0.96] tracking-[-0.06em] text-slate-950">
              Create a calmer car workflow.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
              Join FleetFras to manage listings, requests, chats, and role-specific workspaces in one place.
            </p>
            <div className="mt-10 rounded-[28px] border border-slate-200 bg-white/70 p-5 text-sm text-slate-600">
              Your dashboard is shaped by the account type you choose during signup.
            </div>
          </section>

          <section className="ff-auth-panel auth-form-container">
            <div className="mb-8">
              <p className="ff-kicker">Create account</p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Join FleetFras</h2>
              <p className="mt-2 text-sm text-slate-500">Choose your role and set up access.</p>
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
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="auth-form-input auth-input-focus ff-input"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-800">
                    Confirm
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="auth-form-input auth-input-focus ff-input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-800">
                  Account type
                </label>
                <select
                  id="role"
                  name="role"
                  className="auth-select ff-input"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="purchaser">Car Purchaser</option>
                  <option value="seller">Car Seller</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-form-button ff-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="auth-form-button ff-button-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="mr-2 h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Sign up with Google
            </button>

            <p className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-purple-700 hover:text-purple-800">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
} 