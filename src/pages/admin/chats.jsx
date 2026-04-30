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
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="ff-page">
      <div className="ff-shell mt-2 flex min-h-[600px] flex-col gap-8 md:mt-4 md:flex-row">

        <div className="mb-6 w-full border-r border-slate-200 pr-0 md:mb-0 md:w-72 md:pr-6">
          <h2 className="mb-4 text-lg font-semibold text-purple-800">All Chats</h2>
          {chats.length === 0 ? <p className="text-slate-500">No chats yet.</p> :
            chats.map(chat => (
              <div key={chat.id} className={`mb-3 cursor-pointer rounded-xl border p-3 ${selectedChat?.id === chat.id ? 'border-purple-300 bg-purple-50' : 'bg-slate-50'}`} style={selectedChat?.id === chat.id ? undefined : { borderColor: 'var(--ff-border)' }} onClick={() => setSelectedChat(chat)}>
                <div className="font-semibold text-slate-950">{userInfo[chat.userId]?.name || 'User'}</div>
                <div className="break-all text-xs text-slate-500">{userInfo[chat.userId]?.email || chat.userId}</div>
              </div>
            ))
          }
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <h3 className="mb-2 font-semibold text-slate-950">Chat with {selectedChat.userRole} ({selectedChat.userId})</h3>
              <div className="mb-4 min-h-[300px] flex-1 overflow-y-auto rounded-lg border bg-slate-50 p-4" style={{ borderColor: 'var(--ff-border)' }}>
                {messages.length === 0 ? <p className="text-slate-500">No messages yet.</p> :
                  messages.map((msg, idx) => (
                    <div key={idx} className={`mb-2 flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <span className={`inline-block max-w-[70%] break-words rounded-2xl px-4 py-2 font-medium ${msg.sender === 'admin' ? 'bg-purple-700 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>{msg.text}</span>
                    </div>
                  ))
                }
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="ff-input flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                />
                <button
                  onClick={sendMessage}
                  className="ff-button-primary px-6"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="mt-20 text-center text-slate-500">Select a chat to view messages.</div>
          )}
        </div>
      </div>
    </div>
  );
} 