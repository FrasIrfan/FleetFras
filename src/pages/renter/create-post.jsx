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
    <div className="ff-page flex flex-col items-center">
      <div className="w-full max-w-lg mx-auto">
        <div className="ff-shell">
          <h1 className="ff-title mb-6 text-center">Create New Post</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block font-semibold text-slate-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="ff-input w-full px-4 py-3 text-base"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-700">Price (USD)</label>
              <div className="flex items-center">
                <span className="mr-2 text-lg font-bold text-purple-700">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  className="ff-input flex-1 px-4 py-3 text-base"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block font-semibold text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={4}
                className="ff-input w-full resize-vertical px-4 py-3 text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`ff-button-primary w-full px-6 py-3 font-semibold ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 