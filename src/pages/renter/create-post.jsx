import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { db } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function CreatePostPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title,
        description,
        price: Number(price),
        ownerId: currentUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      router.push('/renter/my-posts');
    } catch (err) {
      alert('Failed to create post');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 flex flex-col items-center py-8 px-2 sm:px-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="rounded-2xl bg-white shadow-2xl p-6 sm:p-10">
          <h1 className="mb-6 text-2xl sm:text-3xl font-bold text-indigo-700 text-center tracking-tight drop-shadow">Create New Post</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-gray-700 font-semibold">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-semibold">Price (USD)</label>
              <div className="flex items-center">
                <span className="text-lg text-indigo-600 font-bold mr-2">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-semibold">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm resize-vertical"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-white font-semibold shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 