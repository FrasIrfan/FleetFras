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
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white p-4 shadow-md sm:p-6 md:p-8">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
            Welcome to the Purchaser Dashboard!
          </h1>
          <p className="mb-6 text-gray-600">
            Your role: <span className="font-medium">purchaser</span>
          </p>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto sm:text-base"
              onClick={() => router.push('/purchaser/posts')}
            >
              🔍 View Available Posts
            </button>
          </div>
          {userRole === 'purchaser' && (
            <button
              className="mt-4 w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto sm:text-base"
              onClick={handleSwitchToRenter}
            >
              Switch to Renter
            </button>
          )}
          <div className="mt-8">
            {loading ? (
              <p className="text-gray-600">Loading role switch status...</p>
            ) : requestStatus === 'pending' ? (
              <p className="text-gray-600">
                Your request to become a renter is <span className="font-medium">pending approval</span>.
              </p>
            ) : requestStatus === 'approved' ? (
              <p className="text-gray-600">
                Your request to become a renter has been <span className="font-medium">approved</span>.
              </p>
            ) : requestStatus === 'rejected' ? (
              <p className="text-gray-600">
                Your request to become a renter was <span className="font-medium">rejected</span>.
              </p>
            ) : (
              <button
                onClick={handleRoleSwitchRequest}
                className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto sm:text-base"
              >
                Request to become a Renter
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-8 sm:right-8">
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:h-16 sm:w-16 sm:text-3xl"
          onClick={() => router.push('/purchaser/chats')}
          title="Support Chat"
        >
          💬
        </button>
      </div>
    </div>
  );
} 