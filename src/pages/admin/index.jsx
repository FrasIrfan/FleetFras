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

      await updateDoc(doc(db, 'users', request.userId), { role: 'renter' });

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


  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  console.log('[AdminDashboard] currentUser:', currentUser);

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl md:max-w-3xl bg-white rounded-2xl shadow-xl p-4 md:p-8 mt-4">
        <h1 className="mb-2 text-xl md:text-2xl font-bold text-gray-900">Welcome to the Admin Dashboard!</h1>
        <p className="mb-6 text-gray-700">Your role: <span className="font-semibold">admin</span></p>
        <div className="mb-6">
          <button
            className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium w-full md:w-auto"
            onClick={() => router.push('/admin/posts')}
          >
            📝 Manage Posts
          </button>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Role Switch Requests</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50">
            {loading ? (
              <p className="p-4 text-center text-gray-500">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No role switch requests found.</p>
            ) : (
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, idx) => (
                    <tr key={req.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 break-all text-black">{req.email}</td>
                      <td className={`px-4 py-2 font-semibold ${req.status === 'approved' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-600' : 'text-orange-500'}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(req)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md mb-1 md:mb-0"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md"
                            >
                              Reject
                            </button>
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