'use client';
import { useEffect, useState, useRef } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot, query } from 'firebase/firestore';

export default function AdminChatsPage() {
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userInfo, setUserInfo] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const unsub = onSnapshot(collection(db, 'chats'), async (snapshot) => {
      let chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      chatList.sort((a, b) => {
        const aTime = (a.messages && a.messages.length > 0)
          ? a.messages[a.messages.length - 1].timestamp
          : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = (b.messages && b.messages.length > 0)
          ? b.messages[b.messages.length - 1].timestamp
          : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bTime - aTime;
      });
      setChats(chatList);

      const userIds = [...new Set(chatList.map(chat => chat.userId).filter(Boolean))];
      if (userIds.length > 0) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userMap = {};
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          userMap[doc.id] = { name: data.displayName || data.name || 'No Name', email: data.email || '' };
        });
        setUserInfo(userMap);
      }
    });
    return () => unsub();
  }, [mounted]);

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
    const newMsg = { sender: 'admin', text: input, timestamp: Date.now() };
    const chatRef = doc(db, 'chats', selectedChat.id);
    await updateDoc(chatRef, { messages: [...messages, newMsg] });
    setInput('');
  };

  if (!mounted) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 900, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '2rem', color: '#222', display: 'flex', gap: 32, minHeight: 600 }}>
        <div style={{ width: 280, borderRight: '1px solid #eee', paddingRight: 24 }}>
          <h2 style={{ color: '#4f46e5', marginBottom: 16 }}>All Chats</h2>
          {chats.length === 0 ? <p style={{ color: '#888' }}>No chats yet.</p> :
            chats.map(chat => (
              <div key={chat.id} style={{ marginBottom: 12, cursor: 'pointer', background: selectedChat?.id === chat.id ? '#e0e7ff' : '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #eee' }} onClick={() => setSelectedChat(chat)}>
                <div style={{ fontWeight: 600, color: '#222' }}>
                  {userInfo[chat.userId]?.name || 'User'}
                </div>
                <div style={{ color: '#444', fontSize: 14 }}>{userInfo[chat.userId]?.email || chat.userId}</div>
              </div>
            ))
          }
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedChat ? (
            <>
              <h3 style={{ color: '#4f46e5', marginBottom: 8 }}>Chat with {selectedChat.userRole} ({selectedChat.userId})</h3>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, background: '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #eee' }}>
                {messages.length === 0 ? <p style={{ color: '#888' }}>No messages yet.</p> :
                  messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: 10, textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
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
            </>
          ) : (
            <div style={{ color: '#888', marginTop: 100, textAlign: 'center' }}>Select a chat to view messages.</div>
          )}
        </div>
      </div>
    </div>
  );
} 