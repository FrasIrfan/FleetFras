import { useAuth } from '../../../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../../lib/firebase';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';

export default function PurchaserChatWithRenterPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { chatId } = router.query;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState(null);
  const [post, setPost] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, 'chats', chatId), async (docSnap) => {
      const chatData = docSnap.data();
      setChat(chatData);
      setMessages(chatData?.messages || []);

      if (chatData?.postId && !post) {
        const postSnap = await getDoc(doc(db, 'posts', chatData.postId));
        setPost(postSnap.exists() ? { id: postSnap.id, ...postSnap.data() } : null);
      }
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId || !currentUser) return;
    const newMsg = { sender: currentUser.uid, text: input, timestamp: Date.now() };
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, { messages: [...messages, newMsg] });
    setInput('');
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222', display: 'flex', flexDirection: 'column', height: 600 }}>
        <h2 style={{ marginBottom: 16, color: '#4f46e5' }}>Chat with Renter</h2>
        {post && (
          <div style={{ marginBottom: 16, background: '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #eee' }}>
            <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: '1.1rem' }}>${post.price}</div>
            <div style={{ fontWeight: 600 }}>{post.title}</div>
            <div style={{ color: '#444', fontSize: 14 }}>{post.description}</div>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, background: '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #eee' }}>
          {messages.length === 0 ? <p style={{ color: '#888' }}>No messages yet.</p> :
            messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 10, textAlign: msg.sender === currentUser?.uid ? 'right' : 'left' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2, textAlign: msg.sender === currentUser?.uid ? 'right' : 'left' }}>
                  {msg.sender === currentUser?.uid ? 'You:' : 'Renter:'}
                </div>
                <span style={{
                  display: 'inline-block',
                  background: msg.sender === currentUser?.uid ? '#4f46e5' : '#e0e7ff',
                  color: msg.sender === currentUser?.uid ? '#fff' : '#222',
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
      </div>
    </div>
  );
} 