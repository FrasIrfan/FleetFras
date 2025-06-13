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
    <nav className="w-full bg-white border-b border-gray-200 px-2 py-2 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">

        <button
          className="hidden md:inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
          onClick={() => router.back()}
          title="Back"
        >

          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          className="hidden md:inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
          onClick={() => window.history.forward()}
          title="Forward"
        >

          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <div
          className="font-bold text-indigo-700 text-xl cursor-pointer ml-2 md:ml-4"
          onClick={() => router.push('/')}
        >
          FleetFras
        </div>
      </div>
      {currentUser && (
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex flex-col md:flex-row items-center gap-1 bg-gray-100 rounded-md px-3 py-1 border border-gray-200 text-gray-900 text-sm font-medium">
            <span className="font-semibold">{currentUser.displayName || 'No Name'}</span>
            <span className="text-indigo-600 text-xs md:ml-2 break-all">{currentUser.email}</span>
          </div>
          <button
            className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 md:bg-indigo-600 md:hover:bg-indigo-700 md:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onClick={() => router.push('/')}
            title="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4.5 10.5V19a1.5 1.5 0 001.5 1.5h3.75m6 0H18a1.5 1.5 0 001.5-1.5v-8.5M9 21V12h6v9" />
            </svg>
          </button>
          <button
            className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 md:bg-red-600 md:hover:bg-red-700 md:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ml-1"
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
