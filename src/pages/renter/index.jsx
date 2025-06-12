import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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

  const handleSwitchToPurchaser = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), { role: 'purchaser' });
    router.push('/purchaser');
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ maxWidth: 600, margin: '2rem auto' }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222' }}>
          <h1 style={{ marginBottom: '0.5rem', color: '#222' }}>Welcome to the Renter Dashboard!</h1>
          <p style={{ marginBottom: '2rem', color: '#444' }}>Your role: <strong>renter</strong></p>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              onClick={() => router.push('/renter/create-post')}
            >
              ➕ Create New Post
            </button>
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              onClick={() => router.push('/renter/my-posts')}
            >
              📄 View My Posts
            </button>
          </div>
          <button
            style={{ marginTop: 16, padding: '0.5rem 1.2rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
            onClick={handleSwitchToPurchaser}
          >
            Switch back to Purchaser
          </button>
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
          onClick={() => router.push('/renter/support-chat')}
          title="Support Chat"
        >
          💬
        </button>
      </div>
    </div>
  );
} 