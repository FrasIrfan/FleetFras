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
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ maxWidth: 900, margin: '2rem auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222' }}>
          <h1 style={{ marginBottom: '1.5rem', color: '#222' }}>My Posts</h1>
          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem' }}>
              {posts.map(post => (
                <div key={post.id} style={{ flex: '1 1 280px', minWidth: 280, maxWidth: 340, background: '#f9fafb', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '1.1rem', marginBottom: 6 }}>
                      ${post.price}
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#222', marginBottom: 8 }}>{post.title}</h2>
                    <p style={{ color: '#444', marginBottom: 12 }}>{post.description}</p>
                    <div style={{ color: '#4f46e5', fontSize: 13, marginBottom: 6 }}>
                      Owner: {currentUser?.displayName || 'No Name'} (<span style={{ color: '#6366f1' }}>{currentUser?.email || ''}</span>)
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
                    <span style={{
                      padding: '0.3rem 0.9rem',
                      borderRadius: 20,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      background: post.status === 'approved' ? '#e0fbe3' : post.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                      color: post.status === 'approved' ? '#16a34a' : post.status === 'rejected' ? '#dc2626' : '#b45309',
                      border: '1px solid',
                      borderColor: post.status === 'approved' ? '#bbf7d0' : post.status === 'rejected' ? '#fecaca' : '#fde68a',
                    }}>{post.status}</span>
                  </div>
                  <button
                    style={{ marginTop: 12, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', fontWeight: 500, cursor: 'pointer' }}
                    onClick={() => setShowChatsForPost(post.id)}
                  >
                    View Chats
                  </button>
                  {showChatsForPost === post.id && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', padding: '2rem', minWidth: 400, maxWidth: 600, width: '100%', maxHeight: 600, overflow: 'auto', position: 'relative' }}>
                        <button style={{ position: 'absolute', top: 12, right: 12, background: '#eee', border: 'none', borderRadius: 6, padding: '0.3rem 0.8rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowChatsForPost(null)}>X</button>
                        <h3 style={{ color: '#4f46e5', marginBottom: 12 }}>Chats for: {post.title}</h3>
                        {chats.length === 0 ? <p style={{ color: '#888' }}>No chats for this post yet.</p> : (
                          <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ minWidth: 120 }}>
                              {chats.map(chat => (
                                <div key={chat.id} style={{ marginBottom: 10, cursor: 'pointer', background: selectedChat?.id === chat.id ? '#e0e7ff' : '#f9fafb', borderRadius: 8, padding: 8, border: '1px solid #eee' }} onClick={() => setSelectedChat(chat)}>
                                  Purchaser: {chat.userId}
                                </div>
                              ))}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              {selectedChat ? (
                                <>
                                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, background: '#f9fafb', borderRadius: 8, padding: 10, border: '1px solid #eee', minHeight: 200, maxHeight: 250 }}>
                                    {messages.length === 0 ? <p style={{ color: '#888' }}>No messages yet.</p> :
                                      messages.map((msg, idx) => (
                                        <div key={idx} style={{ marginBottom: 10, textAlign: msg.sender === currentUser.uid ? 'right' : 'left' }}>
                                          <div style={{ fontSize: 12, color: '#888', marginBottom: 2, textAlign: msg.sender === currentUser.uid ? 'right' : 'left' }}>
                                            {msg.sender === currentUser.uid ? 'You:' : 'Purchaser:'}
                                          </div>
                                          <span style={{
                                            display: 'inline-block',
                                            background: msg.sender === currentUser.uid ? '#4f46e5' : '#e0e7ff',
                                            color: msg.sender === currentUser.uid ? '#fff' : '#222',
                                            borderRadius: 16,
                                            padding: '0.5rem 1rem',
                                            fontWeight: 500,
                                            maxWidth: '70%',
                                            wordBreak: 'break-word',
                                          }}>{msg.text}</span>
                                        </div>
                                      ))
                                    }
                                  </div>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                      type="text"
                                      value={input}
                                      onChange={e => setInput(e.target.value)}
                                      placeholder="Type your message..."
                                      style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid #bbb', fontSize: '1rem' }}
                                      onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                                    />
                                    <button
                                      onClick={sendMessage}
                                      style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      Send
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div style={{ color: '#888', marginTop: 40, textAlign: 'center' }}>Select a chat to view messages.</div>
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