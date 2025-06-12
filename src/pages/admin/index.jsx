import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function AdminDashboardPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'roleRequests'));
      const reqs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setRequests(reqs);
      setLoading(false);
      console.log('[AdminDashboard] Fetched role requests:', reqs);
    };
    fetchRequests();
  }, []);

  const handleApprove = async (request) => {
    try {
      // Update user role in users collection
      await updateDoc(doc(db, 'users', request.userId), { role: 'renter' });
      // Update request status
      await updateDoc(doc(db, 'roleRequests', request.id), { status: 'approved' });
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'approved' } : r));
      console.log('[AdminDashboard] Approved request:', request);
    } catch (err) {
      alert('Failed to approve request');
      console.error('[AdminDashboard] Error approving request:', err);
    }
  };

  const handleReject = async (request) => {
    try {
      await updateDoc(doc(db, 'roleRequests', request.id), { status: 'rejected' });
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'rejected' } : r));
      console.log('[AdminDashboard] Rejected request:', request);
    } catch (err) {
      alert('Failed to reject request');
      console.error('[AdminDashboard] Error rejecting request:', err);
    }
  };

  // Add header with Home and Logout
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  console.log('[AdminDashboard] currentUser:', currentUser);

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6', position: 'relative' }}>
      <div style={{ maxWidth: 800, margin: '2rem auto' }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
          padding: '2rem',
          color: '#222'
        }}>
          <h1 style={{ marginBottom: '0.5rem', color: '#222' }}>Welcome to the Admin Dashboard!</h1>
          <p style={{ marginBottom: '2rem', color: '#444' }}>Your role: <strong>admin</strong></p>
          <div style={{ marginBottom: '2rem' }}>
            <button
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
              onClick={() => router.push('/admin/posts')}
            >
              📝 Manage Posts
            </button>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#222' }}>Role Switch Requests</h2>
            <div style={{
              background: '#f9fafb',
              borderRadius: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              marginTop: 8
            }}>
              {loading ? (
                <p>Loading requests...</p>
              ) : requests.length === 0 ? (
                <p>No role switch requests found.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', color: '#222', fontWeight: 600 }}>Email</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', color: '#222', fontWeight: 600 }}>Status</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', color: '#222', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, idx) => (
                      <tr key={req.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f3f4f6', transition: 'background 0.2s' }}>
                        <td style={{ border: '1px solid #e5e7eb', padding: '0.75rem', color: '#444' }}>{req.email}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '0.75rem', color: req.status === 'approved' ? '#16a34a' : req.status === 'rejected' ? '#dc2626' : '#b45309', fontWeight: 600, textTransform: 'capitalize' }}>{req.status}</td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '0.75rem' }}>
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(req)} style={{ marginRight: '0.5rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500 }}>Approve</button>
                              <button onClick={() => handleReject(req)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500 }}>Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 1000
      }}>
        <button
          style={{
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 60,
            height: 60,
            fontSize: 28,
            boxShadow: '0 4px 16px rgba(79,70,229,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}
          onClick={() => {
            console.log('[AdminDashboard] Floating chat button clicked');
            router.push('/admin/chats').catch((err) => {
              console.error('Router push error:', err);
              window.location.href = '/admin/chats';
            });
          }}
          title="Admin Chats"
        >
          💬
        </button>
      </div>
      
    </div>
  );
}

export async function getServerSideProps(context) {
  let nookies = require('nookies');
  if (nookies.default) nookies = nookies.default;
  const admin = require('../../../lib/admin');
  try {
    const cookies = nookies.get(context);
    const session = cookies.session || '';
    if (!session) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    const decoded = await admin.getAuth().verifySessionCookie(session, true);
    const db = admin.getFirestore();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data();
    // Debug logging
    console.log('SSR: UID:', decoded.uid, 'userData:', userData);
    if (!userData || !userData.role || userData.role.toLowerCase() !== 'admin') {
      return { redirect: { destination: '/login', permanent: false } };
    }
    return { props: {} };
  } catch (err) {
    console.error('SSR error:', err);
    return { redirect: { destination: '/login', permanent: false } };
  }
} 