import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';

export default function RenterChatsPage() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [posts, setPosts] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    let unsub;
    const fetchChats = async () => {
      const postsSnapshot = await getDocs(query(collection(db, 'posts'), where('ownerId', '==', currentUser.uid)));
      const postMap = {};
      const postIds = [];
      postsSnapshot.docs.forEach(docSnap => {
        postMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        postIds.push(docSnap.id);
      });
      setPosts(postMap);
      if (postIds.length === 0) {
        setChats([]);
        return;
      }
      const chatsSnapshot = await getDocs(query(collection(db, 'chats'), where('postId', 'in', postIds)));
      setChats(chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchChats();
    return () => unsub && unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedChat) return;
    const unsub = onSnapshot(doc(db, 'chats', selectedChat.id), (docSnap) => {
      setMessages(docSnap.data()?.messages || []);
    });
    return () => unsub();
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedChat) return;
    const newMsg = { sender: currentUser.uid, text: input, timestamp: Date.now() };
    const chatRef = doc(db, 'chats', selectedChat.id);
    await updateDoc(chatRef, { messages: [...messages, newMsg] });
    setInput('');
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 900, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222', display: 'flex', gap: 32, minHeight: 600 }}>
        <div style={{ width: 280, borderRight: '1px solid #eee', paddingRight: 24 }}>
          <h2 style={{ color: '#4f46e5', marginBottom: 16 }}>Chats for Your Posts</h2>
          {chats.length === 0 ? <p style={{ color: '#888' }}>No chats yet.</p> :
            chats.map(chat => (
              <div key={chat.id} style={{ marginBottom: 12, cursor: 'pointer', background: selectedChat?.id === chat.id ? '#e0e7ff' : '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #eee' }}
                onClick={() => {
                  setSelectedChat(chat);
                }}>
                <div style={{ fontWeight: 600, color: '#222' }}>Post: {posts[chat.postId]?.title || chat.postId}</div>
                <div style={{ color: '#444', fontSize: 14 }}>Purchaser: {chat.userId}</div>
                {selectedChat?.id === chat.id && <div style={{ color: '#4f46e5', fontWeight: 700, fontSize: 12, marginTop: 4 }}>Selected</div>}
              </div>
            ))
          }
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedChat ? (
            <>
              <h3 style={{ color: '#4f46e5', marginBottom: 8 }}>Chat for Post: {posts[selectedChat.postId]?.title || selectedChat.postId}</h3>
              <div style={{ marginBottom: 8, color: '#444', fontSize: 15 }}>{posts[selectedChat.postId]?.description}</div>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, background: '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #eee', minHeight: 300 }}>
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
                <div ref={messagesEndRef} />
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
            <div style={{ color: '#888', marginTop: 100, textAlign: 'center' }}>Select a chat to view messages.</div>
          )}
        </div>
      </div>
    </div>
  );
} 