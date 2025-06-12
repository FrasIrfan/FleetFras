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
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ maxWidth: 500, margin: '2rem auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222' }}>
          <h1 style={{ marginBottom: '1.5rem', color: '#222' }}>Create New Post</h1>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#444', fontWeight: 500 }}>Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #bbb', fontSize: '1rem', color: '#222', background: '#f9fafb' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#444', fontWeight: 500 }}>Price (USD)</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', color: '#4f46e5', marginRight: 8 }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 6, border: '1px solid #bbb', fontSize: '1rem', color: '#222', background: '#f9fafb' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#444', fontWeight: 500 }}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={4}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #bbb', fontSize: '1rem', color: '#222', background: '#f9fafb', resize: 'vertical' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 