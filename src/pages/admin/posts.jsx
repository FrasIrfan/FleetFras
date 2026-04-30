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
    <div className="ff-page">
      <div className="ff-shell mt-2 md:mt-4">
        <h1 className="ff-title mb-6">Manage All Posts</h1>
        {loading ? (
          <p className="p-4 text-center text-slate-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="p-4 text-center text-slate-500">No posts found.</p>
        ) : (
          <div className="mt-4 flex flex-col flex-wrap gap-4 md:flex-row md:gap-6">
            {posts.map(post => (
              <div key={post.id} className="ff-card flex min-w-[260px] max-w-sm flex-1 flex-col justify-between">
                <div>
                  <div className="mb-2 text-lg font-bold text-purple-700">${post.price}</div>
                  <h2 className="mb-2 text-base font-semibold text-slate-950">{post.title}</h2>
                  <p className="mb-3 break-words text-slate-600">{post.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center mt-2 justify-between gap-2">
                  <span className={`ff-status-chip text-sm ${post.status === 'approved' ? 'border-green-200 bg-green-50 text-green-700' : post.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' : 'border-yellow-200 bg-yellow-50 text-orange-600'}`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                  {post.status === 'pending' && (
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button onClick={() => handleApprove(post)} className="ff-button-primary px-3 py-1">Approve</button>
                      <button onClick={() => handleReject(post)} className="ff-button-danger px-3 py-1">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 