import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function MyPostsPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatsForPost, setShowChatsForPost] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      if (!currentUser) return;
      setLoading(true);
      const q = query(collection(db, 'posts'), where('ownerId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchPosts();
  }, [currentUser]);

  useEffect(() => {
    if (!showChatsForPost) return;
    const fetchChats = async () => {
      const chatsSnapshot = await getDocs(query(collection(db, 'chats'), where('postId', '==', showChatsForPost)));
      const chatList = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userMap = {};
      usersSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        userMap[docSnap.id] = {
          name: data.displayName || data.name || 'Purchaser',
          email: data.email || '',
        };
      });
      setUserInfo(userMap);
      setSelectedChat(null);
      setMessages([]);
    };
    fetchChats();
  }, [showChatsForPost]);

  const getPurchaserLabel = (userId) => {
    const user = userInfo[userId];
    if (!user) return 'Purchaser';
    return user.email || user.name || 'Purchaser';
  };

  useEffect(() => {
    if (!selectedChat) return;
    const unsub = onSnapshot(doc(db, 'chats', selectedChat.id), (docSnap) => {
      setMessages(docSnap.data()?.messages || []);
    });
    return () => unsub();
  }, [selectedChat]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedChat) return;
    const newMsg = { sender: currentUser.uid, text: input, timestamp: Date.now() };
    const chatRef = doc(db, 'chats', selectedChat.id);
    await updateDoc(chatRef, { messages: [...messages, newMsg] });
    setInput('');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="ff-page">
      <div className="max-w-5xl mx-auto">
        <div className="ff-shell">
          <h1 className="ff-title mb-6 text-center">My Posts</h1>
          {loading ? (
            <p className="text-center text-slate-600">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-slate-400">No posts found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {posts.map(post => (
                <div key={post.id} className="ff-card relative flex flex-col justify-between p-6">
                  <div>
                    <div className="mb-1 text-lg font-bold text-purple-700">${post.price}</div>
                    <h2 className="mb-2 text-xl font-semibold text-slate-950">{post.title}</h2>
                    <p className="mb-3 text-slate-600">{post.description}</p>
                    <div className="mb-2 text-xs text-purple-700">
                      Owner: {currentUser?.displayName || 'No Name'} (<span className="text-slate-500">{currentUser?.email || ''}</span>)
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className={`ff-status-chip mr-2 px-4 py-1 ${post.status === 'approved' ? 'border-green-200 bg-green-100 text-green-700' : post.status === 'rejected' ? 'border-red-200 bg-red-100 text-red-700' : 'border-yellow-200 bg-yellow-100 text-yellow-700'}`}>{post.status}</span>
                  </div>
                  <button
                    className="ff-button-primary mt-4"
                    onClick={() => setShowChatsForPost(post.id)}
                  >
                    View Chats
                  </button>
                  {showChatsForPost === post.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
                      <div className="relative max-h-[80vh] w-full min-w-[320px] max-w-lg overflow-auto rounded-2xl border bg-white p-6 shadow-2xl" style={{ borderColor: 'var(--ff-border)' }}>
                        <button className="absolute right-3 top-3 rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700 hover:bg-slate-200" onClick={() => setShowChatsForPost(null)}>X</button>
                        <h3 className="mb-4 font-bold text-purple-800">Chats for: {post.title}</h3>
                        {chats.length === 0 ? <p className="text-slate-400">No chats for this post yet.</p> : (
                          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.9fr)]">
                            <div className="min-w-0">
                              {chats.map(chat => (
                                <div key={chat.id} className={`mb-2 cursor-pointer ${selectedChat?.id === chat.id ? 'border-purple-300 bg-purple-50' : 'border-slate-100 bg-slate-50'} rounded-lg border p-2 transition-colors`} onClick={() => setSelectedChat(chat)}>
                                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">Purchaser</div>
                                  <div className="mt-1 break-all text-sm font-medium text-slate-800">{getPurchaserLabel(chat.userId)}</div>
                                </div>
                              ))}
                            </div>
                            <div className="flex-1 flex flex-col">
                              {selectedChat ? (
                                <>
                                  <div className="mb-3 flex max-h-[250px] min-h-[150px] flex-1 flex-col justify-end overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 shadow-inner">
                                    {messages.length === 0 ? <p className="mt-8 text-center text-slate-400">No messages yet.</p> :
                                      messages.map((msg, idx) => (
                                        <div key={idx} className={`mb-3 flex ${msg.sender === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                                          <div className="max-w-[70%]">
                                            <div className={`mb-1 text-xs ${msg.sender === currentUser.uid ? 'text-right text-purple-700' : 'text-left text-slate-500'}`}>{msg.sender === currentUser.uid ? 'You:' : getPurchaserLabel(selectedChat.userId)}</div>
                                            <span className={`inline-block rounded-2xl px-4 py-2 font-medium shadow-md break-words transition-all ${msg.sender === currentUser.uid ? 'bg-purple-700 text-white rounded-br-none' : 'border border-slate-200 bg-white text-slate-900 rounded-bl-none'}`}>{msg.text}</span>
                                          </div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                  <div className="flex gap-2 mt-2 text-black">
                                    <input
                                      type="text"
                                      value={input}
                                      onChange={e => setInput(e.target.value)}
                                      placeholder="Type your message..."
                                      className="ff-input flex-1 px-4 py-3 text-base"
                                      onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                                    />
                                    <button
                                      onClick={sendMessage}
                                      className="ff-button-primary rounded-xl px-6 py-3 font-semibold"
                                    >
                                      Send
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="mt-10 text-center text-slate-400">Select a chat to view messages.</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 