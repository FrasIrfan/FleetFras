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

  const getPostOwnerId = (post) => post.ownerId || post.renterId || post.userId || null;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const q = query(collection(db, 'posts'), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      let allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (currentUser) {
        allPosts = allPosts.filter(post => getPostOwnerId(post) !== currentUser.uid);
      }
      setPosts(allPosts);

      const ownerIds = [...new Set(allPosts.map(getPostOwnerId).filter(Boolean))];
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
    const renterId = getPostOwnerId(post);
    if (!currentUser?.uid || !post?.id || !renterId) {
      alert('Unable to start chat for this post because owner information is missing.');
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', currentUser.uid),
      where('renterId', '==', renterId),
      where('postId', '==', post.id)
    );
    const snapshot = await getDocs(q);
    let chatId;
    if (!snapshot.empty) {
      chatId = snapshot.docs[0].id;
    } else {
      const newChat = await addDoc(collection(db, 'chats'), {
        userId: currentUser.uid,
        renterId,
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
    <div className="ff-page">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-6" style={{ borderColor: 'var(--ff-border)' }}>
          <label className="text-sm font-semibold text-slate-700 sm:text-base">Price Range:</label>
          <div className="flex items-center gap-2 sm:gap-4 text-black">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="ff-input w-24 sm:w-28"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="ff-input w-24 sm:w-28"
            />
          </div>
        </div>

        <div className="ff-shell">
          <h1 className="ff-title mb-6">Available Posts</h1>
          
          {loading ? (
            <p className="text-slate-600">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-slate-600">No approved posts found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {currentPosts.map(post => (
                  (() => {
                    const ownerId = getPostOwnerId(post);
                    const canStartChat = Boolean(currentUser?.uid && post.id && ownerId);
                    return (
                  <div
                    key={post.id}
                    className="ff-card relative flex flex-col justify-between transition-shadow hover:shadow-md sm:p-6"
                  >
                    <div>
                      <div className="mb-2 text-lg font-bold text-purple-700">
                        ${post.price}
                      </div>
                      <h2 className="mb-2 text-xl font-semibold text-slate-950">{post.title}</h2>
                      <p className="mb-4 text-sm text-slate-600 sm:text-base">{post.description}</p>
                      <div className="text-sm text-purple-700">
                        Owner: {ownerInfo[ownerId]?.name || 'Unknown'}{' '}
                        <span className="text-slate-500">
                          ({ownerInfo[ownerId]?.email || ''})
                        </span>
                      </div>
                    </div>

                    <button
                      className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition-transform focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${canStartChat ? 'bg-purple-600 hover:scale-105 hover:bg-purple-700' : 'cursor-not-allowed bg-slate-300'}`}
                      title={canStartChat ? 'Chat with Renter' : 'Owner information missing'}
                      disabled={!canStartChat}
                      onClick={() => handleChatWithRenter(post)}
                    >
                      💬
                    </button>
                  </div>
                    );
                  })()
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                      : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-black">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                      : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                  }`}
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