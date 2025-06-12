import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    if (adminOnly && currentUser) {
      // Fetch user role from Firestore or context if available
      // For now, assume role is stored in currentUser.role (custom claims or context)
      // You may need to fetch from Firestore if not present
      // Example: if (currentUser.role !== 'admin')
      // For now, just log
      // TODO: Implement actual admin check
    }
  }, [currentUser, loading, adminOnly, router]);

  if (loading) return <div>Loading...</div>;
  // Optionally, you can add more logic for adminOnly here
  return currentUser ? children : null;
}
