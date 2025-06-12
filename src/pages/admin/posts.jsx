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
    <div className="min-h-screen bg-gray-100 p-2 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-4 md:p-8 mt-4">
        <h1 className="mb-6 text-xl md:text-2xl font-bold text-gray-900">Manage All Posts</h1>
        {loading ? (
          <p className="p-4 text-center text-gray-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No posts found.</p>
        ) : (
          <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-6 mt-4">
            {posts.map(post => (
              <div key={post.id} className="flex-1 min-w-[260px] max-w-sm bg-gray-50 rounded-xl shadow-md border border-gray-200 p-4 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-indigo-700 text-lg mb-2">${post.price}</div>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">{post.title}</h2>
                  <p className="text-gray-700 mb-3 break-words">{post.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center mt-2 justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full font-semibold text-sm border ${post.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : post.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-orange-600 border-yellow-200'}`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                  {post.status === 'pending' && (
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button onClick={() => handleApprove(post)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 font-medium">Approve</button>
                      <button onClick={() => handleReject(post)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1 font-medium">Reject</button>
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