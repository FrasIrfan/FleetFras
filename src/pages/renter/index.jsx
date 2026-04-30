import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

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
    if (!userData || !userData.role || userData.role.toLowerCase() !== 'renter') {
      return { redirect: { destination: '/login', permanent: false } };
    }
    return { props: {} };
  } catch (err) {
    console.error('SSR error:', err);
    return { redirect: { destination: '/login', permanent: false } };
  }
}

export default function RenterDashboardPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState('renter');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) return;
      setLoading(true);
      const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', currentUser.email)));
      if (!userDoc.empty) {
        setUserRole(userDoc.docs[0].data().role);
      }
      setLoading(false);
    };
    fetchUserRole();
  }, [currentUser]);

  const handleSwitchToPurchaser = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), { role: 'purchaser' });
    router.push('/purchaser');
  };

  return (
    <div className="ff-page">
      <div className="mx-auto max-w-5xl">
        <div className="ff-shell">
          <div className="ff-page-header">
            <div>
              <p className="ff-kicker">Renter workspace</p>
              <h1 className="ff-title">Manage your listings clearly.</h1>
              <p className="ff-subtitle mt-3">Your role: <span className="font-semibold text-slate-800">renter</span></p>
            </div>
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="ff-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">Inventory</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">My Posts</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Review listing status and continue conversations from your posts.</p>
            </div>
            <div className="ff-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">Create</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">New Listing</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Submit a vehicle listing for admin approval.</p>
            </div>
          </div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              className="ff-button-primary w-full sm:w-auto"
              onClick={() => router.push('/renter/my-posts')}
            >
              My Posts
            </button>
            <button
              className="ff-button-secondary w-full sm:w-auto"
              onClick={() => router.push('/renter/create-post')}
            >
              Create Post
            </button>
          </div>
          {userRole === 'renter' && (
            <button
              className="ff-button-secondary mt-4 w-full sm:w-auto"
              onClick={handleSwitchToPurchaser}
            >
              Switch to Purchaser
            </button>
          )}
        </div>
      </div>
      <button className="ff-fab" onClick={() => router.push('/renter/support-chat')} title="Support Chat">💬</button>
    </div>
  );
} 