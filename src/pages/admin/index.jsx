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
    <div className="ff-page">
      <div className="ff-shell mt-2 md:mt-4">
        <div className="ff-page-header">
          <div>
            <p className="ff-kicker">Admin workspace</p>
            <h1 className="ff-title">Review activity with clarity.</h1>
            <p className="ff-subtitle mt-3">Your role: <span className="font-semibold text-slate-800">admin</span></p>
          </div>
          <div>
            <button
              className="ff-button-primary w-full md:w-auto"
              onClick={() => router.push('/admin/posts')}
            >
              Manage Posts
            </button>
          </div>
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="ff-card">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">Requests</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">Role Switches</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Approve or reject renter access requests from purchasers.</p>
          </div>
          <div className="ff-card">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">Content</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">Post Review</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Keep marketplace listings clean through approval actions.</p>
          </div>
        </div>
        <div className="mb-6 hidden">
          <button
            className="ff-button-primary w-full md:w-auto"
            onClick={() => router.push('/admin/posts')}
          >
            📝 Manage Posts
          </button>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Role Switch Requests</h2>
          <div className="overflow-x-auto rounded-lg border bg-slate-50" style={{ borderColor: 'var(--ff-border)' }}>
            {loading ? (
              <p className="p-4 text-center text-slate-500">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="p-4 text-center text-slate-500">No role switch requests found.</p>
            ) : (
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-4 py-2 font-semibold text-slate-700">Email</th>
                    <th className="px-4 py-2 font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-2 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, idx) => (
                    <tr key={req.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-2 break-all text-black">{req.email}</td>
                      <td className={`px-4 py-2 font-semibold ${req.status === 'approved' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-600' : 'text-orange-500'}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(req)} className="ff-button-primary mb-1 px-3 py-1 md:mb-0">
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req)}
                              className="ff-button-danger px-3 py-1"
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
      <div>
        <button
          className="ff-fab"
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