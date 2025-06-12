import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';

export default function PurchaserPostsPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const q = query(collection(db, 'posts'), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      let allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (currentUser) {
        allPosts = allPosts.filter(post => post.ownerId !== currentUser.uid);
      }
      setPosts(allPosts);

      const ownerIds = [...new Set(allPosts.map(post => post.ownerId))];
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userMap = {};
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        userMap[doc.id] = { name: data.displayName || 'No Name', email: data.email || '' };
      });
      setOwnerInfo(userMap);
      setLoading(false);
    };
    fetchPosts();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleChatWithRenter = async (post) => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', currentUser.uid),
      where('renterId', '==', post.ownerId),
      where('postId', '==', post.id)
    );
    const snapshot = await getDocs(q);
    let chatId;
    if (!snapshot.empty) {
      chatId = snapshot.docs[0].id;
    } else {
      const newChat = await addDoc(collection(db, 'chats'), {
        userId: currentUser.uid,
        renterId: post.ownerId,
        postId: post.id,
        messages: [],
        createdAt: new Date().toISOString(),
      });
      chatId = newChat.id;
    }
    router.push(`/purchaser/chats/${chatId}`);
  };

  const filteredPosts = posts.filter(post => {
    const price = Number(post.price);
    const min = minPrice !== '' ? Number(minPrice) : -Infinity;
    const max = maxPrice !== '' ? Number(maxPrice) : Infinity;
    return price >= min && price <= max;
  });
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ maxWidth: 900, margin: '2rem auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
         
        </div>
        <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ fontWeight: 500, color: '#222' }}>Price Range:</label>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            style={{ width: 100, padding: '0.5rem', borderRadius: 6, border: '1px solid #bbb', fontSize: '1rem', color: '#222' }}
          />
          <span style={{ color: '#888' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            style={{ width: 100, padding: '0.5rem', borderRadius: 6, border: '1px solid #bbb', fontSize: '1rem', color: '#222' }}
          />
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222' }}>
          <h1 style={{ marginBottom: '1.5rem', color: '#222' }}>Available Posts</h1>
          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length === 0 ? (
            <p>No approved posts found.</p>
          ) : (
            <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem' }}>
              {currentPosts.map(post => (
                <div key={post.id} style={{ flex: '1 1 280px', minWidth: 280, maxWidth: 340, background: '#f9fafb', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '1.1rem', marginBottom: 6 }}>
                      ${post.price}
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#222', marginBottom: 8 }}>{post.title}</h2>
                    <p style={{ color: '#444', marginBottom: 12 }}>{post.description}</p>
                    <div style={{ color: '#4f46e5', fontSize: 13, marginBottom: 6 }}>
                      Owner: {ownerInfo[post.ownerId]?.name || 'Unknown'} (<span style={{ color: '#6366f1' }}>{ownerInfo[post.ownerId]?.email || ''}</span>)
                    </div>
                  </div>
                  <button
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: '#4f46e5',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      fontSize: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(79,70,229,0.10)'
                    }}
                    title="Chat with Renter"
                    onClick={() => handleChatWithRenter(post)}
                  >
                    💬
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, gap: 12 }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.5rem 1.2rem', background: currentPage === 1 ? '#e5e7eb' : '#4f46e5', color: currentPage === 1 ? '#888' : '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ alignSelf: 'center', fontWeight: 500, color: '#222' }}>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '0.5rem 1.2rem', background: currentPage === totalPages ? '#e5e7eb' : '#4f46e5', color: currentPage === totalPages ? '#888' : '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 