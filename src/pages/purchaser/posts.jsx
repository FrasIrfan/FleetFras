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
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-6">
          <label className="text-sm font-medium text-gray-700 sm:text-base text-black">Price Range:</label>
          <div className="flex items-center gap-2 sm:gap-4 text-black">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-28"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-28"
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-md sm:p-6 md:p-8">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900 sm:text-3xl">Available Posts</h1>
          
          {loading ? (
            <p className="text-gray-600">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-600">No approved posts found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {currentPosts.map(post => (
                  <div
                    key={post.id}
                    className="relative flex flex-col justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                  >
                    <div>
                      <div className="mb-2 text-lg font-bold text-indigo-600">
                        ${post.price}
                      </div>
                      <h2 className="mb-2 text-xl font-semibold text-gray-900">{post.title}</h2>
                      <p className="mb-4 text-sm text-gray-600 sm:text-base">{post.description}</p>
                      <div className="text-sm text-indigo-600">
                        Owner: {ownerInfo[post.ownerId]?.name || 'Unknown'}{' '}
                        <span className="text-indigo-500">
                          ({ownerInfo[post.ownerId]?.email || ''})
                        </span>
                      </div>
                    </div>

                    <button
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition-transform hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      title="Chat with Renter"
                      onClick={() => handleChatWithRenter(post)}
                    >
                      💬
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
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
                      ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
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