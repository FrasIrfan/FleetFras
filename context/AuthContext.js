import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      console.log('[AuthContext] onAuthStateChanged user:', user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {

  }, [currentUser, loading]);

  const logout = async () => {
    // Call API to clear session cookie
    console.log('[AuthContext] Logging out...');
    await fetch('/api/sessionLogout', { method: 'POST' });
    await signOut(auth);
    console.log('[AuthContext] Signed out from Firebase Auth');
  };

  const value = {
    currentUser,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
