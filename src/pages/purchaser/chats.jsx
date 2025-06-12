import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';

export default function PurchaserChatPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    let unsub;
    const fetchChat = async () => {
      const q = query(collection(db, 'chats'), where('userId', '==', currentUser.uid), where('userRole', '==', 'purchaser'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const chatDoc = snapshot.docs[0];
        setChatId(chatDoc.id);
        unsub = onSnapshot(doc(db, 'chats', chatDoc.id), (docSnap) => {
          setMessages(docSnap.data()?.messages || []);
        });
      } else {
        const newChat = await addDoc(collection(db, 'chats'), {
          userId: currentUser.uid,
          userRole: 'purchaser',
          messages: [],
        });
        setChatId(newChat.id);
        unsub = onSnapshot(doc(db, 'chats', newChat.id), (docSnap) => {
          setMessages(docSnap.data()?.messages || []);
        });
      }
    };
    fetchChat();
    return () => unsub && unsub();
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId) return;
    const newMsg = { sender: 'purchaser', text: input, timestamp: Date.now() };
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, { messages: [...messages, newMsg] });
    setInput('');
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222', display: 'flex', flexDirection: 'column', height: 600 }}>
        <h2 style={{ marginBottom: 16, color: '#4f46e5' }}>Support Chat</h2>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, background: '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #eee' }}>
          {messages.length === 0 ? <p style={{ color: '#888' }}>No messages yet.</p> :
            messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 10, textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2, textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                  {msg.sender === 'admin' ? 'Admin:' : 'You:'}
                </div>
                <span style={{
                  display: 'inline-block',
                  background: msg.sender === 'admin' ? '#4f46e5' : '#e0e7ff',
                  color: msg.sender === 'admin' ? '#fff' : '#222',
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