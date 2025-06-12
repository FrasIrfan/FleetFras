import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function AdminPostsPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'posts'));
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const handleApprove = async (post) => {
    try {
      await updateDoc(doc(db, 'posts', post.id), { status: 'approved' });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'approved' } : p));
    } catch (err) {
      alert('Failed to approve post');
    }
  };

  const handleReject = async (post) => {
    try {
      await updateDoc(doc(db, 'posts', post.id), { status: 'rejected' });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'rejected' } : p));
    } catch (err) {
      alert('Failed to reject post');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ maxWidth: 1100, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222' }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#222' }}>Manage All Posts</h1>
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>No posts found.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem' }}>
            {posts.map(post => (
              <div key={post.id} style={{ flex: '1 1 320px', minWidth: 320, maxWidth: 380, background: '#f9fafb', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '1.1rem', marginBottom: 6 }}>
                    ${post.price}
                  </div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#222', marginBottom: 8 }}>{post.title}</h2>
                  <p style={{ color: '#444', marginBottom: 12 }}>{post.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 10, justifyContent: 'space-between' }}>
                  <span style={{
                    padding: '0.3rem 0.9rem',
                    borderRadius: 20,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    background: post.status === 'approved' ? '#e0fbe3' : post.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                    color: post.status === 'approved' ? '#16a34a' : post.status === 'rejected' ? '#dc2626' : '#b45309',
                    border: '1px solid',
                    borderColor: post.status === 'approved' ? '#bbf7d0' : post.status === 'rejected' ? '#fecaca' : '#fde68a',
                  }}>{post.status}</span>
                  {post.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleApprove(post)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500 }}>Approve</button>
                      <button onClick={() => handleReject(post)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 500 }}>Reject</button>
                    </div>
                  )}
                  <button
                    style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 8 }}
                    title="View Chats"
                    onClick={() => router.push('/admin/chats')}
                  >
                    💬
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 