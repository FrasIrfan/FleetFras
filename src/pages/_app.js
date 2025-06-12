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
    <nav style={{
      width: '100%',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 2000
    }}>
      <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: 20, cursor: 'pointer' }} onClick={() => router.push('/')}>FleetFras</div>
      {currentUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: '#222', fontWeight: 500, fontSize: 15, background: '#f3f4f6', borderRadius: 6, padding: '0.3rem 0.8rem', border: '1px solid #e5e7eb' }}>
            {currentUser.displayName || 'No Name'}<br/>
            <span style={{ color: '#4f46e5', fontWeight: 400, fontSize: 13 }}>{currentUser.email}</span>
          </div>
          <button
            style={{ padding: '0.5rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
            onClick={() => router.push('/')}
          >
            Home
          </button>
          <button
            style={{ padding: '0.5rem 1.2rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
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
