import "@/styles/globals.css";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import '../../styles/auth.css';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  console.log('[Navbar] currentUser:', currentUser);
  const hideNavbar = ['/login', '/signup'].includes(router.pathname);
  if (!mounted || hideNavbar) return null;
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  return (
    <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b bg-white/90 px-4 py-3 backdrop-blur md:px-8" style={{ borderColor: 'var(--ff-border)' }}>
      <div className="flex items-center gap-2 md:gap-4">

        <button
          className="hidden rounded-full border p-2 text-slate-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 md:inline-flex"
          style={{ borderColor: 'var(--ff-border)' }}
          onClick={() => router.back()}
          title="Back"
        >

          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          className="hidden rounded-full border p-2 text-slate-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 md:inline-flex"
          style={{ borderColor: 'var(--ff-border)' }}
          onClick={() => window.history.forward()}
          title="Forward"
        >

          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <div
          className="ml-2 cursor-pointer text-xl font-semibold tracking-[-0.04em] text-slate-950 md:ml-4"
          onClick={() => router.push('/')}
        >
          Fleet<span className="text-purple-700">Fras</span>
        </div>
      </div>
      {currentUser && (
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden rounded-full border bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 sm:flex sm:flex-col sm:items-center sm:gap-1 md:flex-row" style={{ borderColor: 'var(--ff-border)' }}>
            <span className="font-semibold">{currentUser.displayName || 'No Name'}</span>
            <span className="break-all text-xs text-slate-500 md:ml-2">{currentUser.email}</span>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-full border p-2 text-purple-700 transition hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 md:border-0 md:bg-purple-600 md:text-white md:hover:bg-purple-700"
            style={{ borderColor: 'var(--ff-border)' }}
            onClick={() => router.push('/')}
            title="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4.5 10.5V19a1.5 1.5 0 001.5 1.5h3.75m6 0H18a1.5 1.5 0 001.5-1.5v-8.5M9 21V12h6v9" />
            </svg>
          </button>
          <button
            className="ml-1 inline-flex items-center justify-center rounded-full border p-2 text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 md:border-0 md:bg-red-600 md:text-white md:hover:bg-red-700"
            style={{ borderColor: 'var(--ff-border)' }}
            onClick={handleLogout}
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12h-9m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      )}
    </nav>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
