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
      setChats(chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSelectedChat(null);
      setMessages([]);
    };
    fetchChats();
  }, [showChatsForPost]);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 py-8 px-2 sm:px-4">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl bg-white shadow-2xl p-6 sm:p-10">
          <h1 className="mb-6 text-2xl sm:text-3xl font-bold text-indigo-700 text-center tracking-tight drop-shadow">My Posts</h1>
          {loading ? (
            <p className="text-gray-600 text-center">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-400 text-center">No posts found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {posts.map(post => (
                <div key={post.id} className="flex flex-col justify-between bg-gray-50 rounded-xl border border-gray-200 shadow-md p-6 relative">
                  <div>
                    <div className="font-bold text-indigo-600 text-lg mb-1">${post.price}</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
                    <p className="text-gray-600 mb-3">{post.description}</p>
                    <div className="text-indigo-600 text-xs mb-2">
                      Owner: {currentUser?.displayName || 'No Name'} (<span className="text-indigo-400">{currentUser?.email || ''}</span>)
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className={`px-4 py-1 rounded-full font-semibold text-xs border mr-2 ${post.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : post.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{post.status}</span>
                  </div>
                  <button
                    className="mt-4 rounded-lg bg-indigo-600 text-white px-4 py-2 font-medium shadow hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    onClick={() => setShowChatsForPost(post.id)}
                  >
                    View Chats
                  </button>
                  {showChatsForPost === post.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
                      <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[320px] max-w-lg w-full max-h-[80vh] overflow-auto relative">
                        <button className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-1 font-bold text-gray-700" onClick={() => setShowChatsForPost(null)}>X</button>
                        <h3 className="text-indigo-600 font-bold mb-4">Chats for: {post.title}</h3>
                        {chats.length === 0 ? <p className="text-gray-400">No chats for this post yet.</p> : (
                          <div className="flex gap-4">
                            <div className="min-w-[100px]">
                              {chats.map(chat => (
                                <div key={chat.id} className={`mb-2 cursor-pointer ${selectedChat?.id === chat.id ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-50 border-gray-100'} rounded-lg p-2 border transition-colors`} onClick={() => setSelectedChat(chat)}>
                                  Purchaser: {chat.userId}
                                </div>
                              ))}
                            </div>
                            <div className="flex-1 flex flex-col">
                              {selectedChat ? (
                                <>
                                  <div className="flex-1 flex flex-col justify-end overflow-y-auto mb-3 bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-inner min-h-[150px] max-h-[250px]">
                                    {messages.length === 0 ? <p className="text-gray-400 text-center mt-8">No messages yet.</p> :
                                      messages.map((msg, idx) => (
                                        <div key={idx} className={`mb-3 flex ${msg.sender === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                                          <div className="max-w-[70%]">
                                            <div className={`text-xs mb-1 ${msg.sender === currentUser.uid ? 'text-indigo-500 text-right' : 'text-gray-500 text-left'}`}>{msg.sender === currentUser.uid ? 'You:' : 'Purchaser:'}</div>
                                            <span className={`inline-block rounded-2xl px-4 py-2 font-medium shadow-md break-words transition-all ${msg.sender === currentUser.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-indigo-100 text-gray-900 rounded-bl-none'}`}>{msg.text}</span>
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
                                      className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm bg-white"
                                      onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                                    />
                                    <button
                                      onClick={sendMessage}
                                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-white font-semibold shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    >
                                      Send
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-gray-400 mt-10 text-center">Select a chat to view messages.</div>
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