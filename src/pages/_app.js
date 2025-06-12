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
    <nav className="w-full bg-white border-b border-gray-200 px-2 py-2 md:px-8 flex flex-col md:flex-row items-center justify-between sticky top-0 z-50">
      <div
        className="font-bold text-indigo-700 text-xl cursor-pointer mb-2 md:mb-0"
        onClick={() => router.push('/')}
      >
        FleetFras
      </div>
      {currentUser && (
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex flex-col md:flex-row items-center gap-1 bg-gray-100 rounded-md px-3 py-1 border border-gray-200 text-gray-900 text-sm font-medium w-full md:w-auto">
            <span className="font-semibold">{currentUser.displayName || 'No Name'}</span>
            <span className="text-indigo-600 text-xs md:ml-2 break-all">{currentUser.email}</span>
          </div>
          <button
            className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm"
            onClick={() => router.push('/')}
          >
            Home
          </button>
          <button
            className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-sm"
            onClick={handleLogout}
          >
            Logout
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
