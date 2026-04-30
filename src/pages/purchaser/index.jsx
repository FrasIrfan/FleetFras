import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

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
    if (!userData || !userData.role || userData.role.toLowerCase() !== 'purchaser') {
      return { redirect: { destination: '/login', permanent: false } };
    }
    return { props: {} };
  } catch (err) {
    console.error('SSR error:', err);
    return { redirect: { destination: '/login', permanent: false } };
  }
}

export default function PurchaserDashboardPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [requestStatus, setRequestStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('purchaser');

  useEffect(() => {
    const fetchRequest = async () => {
      if (!currentUser) return;
      setLoading(true);
      const q = query(
        collection(db, 'roleRequests'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const req = snapshot.docs[0].data();
        setRequestStatus(req.status);
      } else {
        setRequestStatus(null);
      }

      const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', currentUser.email)));
      if (!userDoc.empty) {
        setUserRole(userDoc.docs[0].data().role);
      }
      setLoading(false);
    };
    fetchRequest();
  }, [currentUser]);

  const handleRoleSwitchRequest = async () => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'roleRequests'), {
        userId: currentUser.uid,
        email: currentUser.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setRequestStatus('pending');

    } catch (err) {
      alert('Failed to submit request');

    }
  };

  const handleSwitchToRenter = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), { role: 'renter' });
    router.push('/renter');
  };


  return (
    <div className="ff-page">
      <div className="mx-auto max-w-5xl">
        <div className="ff-shell">
          <div className="ff-page-header">
            <div>
              <p className="ff-kicker">Purchaser workspace</p>
              <h1 className="ff-title">Find the right car faster.</h1>
              <p className="ff-subtitle mt-3">Your role: <span className="font-semibold text-slate-800">purchaser</span></p>
            </div>
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push('/purchaser/posts')}
              className="ff-card text-left hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">Browse</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">Available posts</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Review approved vehicle listings and start conversations with renters.</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-purple-700">Open listings</span>
            </button>
            <div className="ff-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">Role</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">Renter access</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Switch or request renter access using the current approval flow.</p>
            </div>
          </div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              className="ff-button-primary w-full sm:w-auto"
              onClick={() => router.push('/purchaser/posts')}
            >
              View Available Posts
            </button>
          </div>
          {userRole !== 'renter' && (
            <button
              className="ff-button-secondary mt-4 w-full sm:w-auto"
              onClick={handleSwitchToRenter}
            >
              Switch to Renter
            </button>
          )}
          {userRole !== 'renter' && (
          <div className="mt-8 rounded-2xl border bg-slate-50 p-5" style={{ borderColor: 'var(--ff-border)' }}>
            {loading ? (
              <p className="text-slate-600">Loading role switch status...</p>
            ) : requestStatus === 'pending' ? (
              <p className="text-slate-600">
                Your request to become a renter is <span className="font-medium">pending approval</span>.
              </p>
            ) : requestStatus === 'approved' ? (
              <p className="text-slate-600">
                Your request to become a renter has been <span className="font-medium">approved</span>.
              </p>
            ) : requestStatus === 'rejected' ? (
              <p className="text-slate-600">
                Your request to become a renter was <span className="font-medium">rejected</span>.
              </p>
            ) : (
              <button
                onClick={handleRoleSwitchRequest}
                className="ff-button-secondary w-full sm:w-auto"
              >
                Request to become a Renter
              </button>
            )}
          </div>
          )}
        </div>
      </div>
      <button className="ff-fab" onClick={() => router.push('/purchaser/chats')} title="Support Chat">💬</button>
    </div>
  );
} 