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
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-4 md:p-8 mt-4 flex flex-col md:flex-row gap-8 min-h-[600px]">

        <div className="w-full md:w-72 border-r border-gray-200 pr-0 md:pr-6 mb-6 md:mb-0">
          <h2 className="text-lg font-semibold text-indigo-700 mb-4">All Chats</h2>
          {chats.length === 0 ? <p className="text-gray-500">No chats yet.</p> :
            chats.map(chat => (
              <div key={chat.id} className={`mb-3 cursor-pointer rounded-lg p-3 border ${selectedChat?.id === chat.id ? 'bg-indigo-100 border-indigo-400' : 'bg-gray-50 border-gray-200'}`} onClick={() => setSelectedChat(chat)}>
                <div className="font-semibold text-gray-900">{userInfo[chat.userId]?.name || 'User'}</div>
                <div className="text-gray-600 text-xs break-all">{userInfo[chat.userId]?.email || chat.userId}</div>
              </div>
            ))
          }
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <h3 className="text-indigo-700 font-semibold mb-2">Chat with {selectedChat.userRole} ({selectedChat.userId})</h3>
              <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[300px]">
                {messages.length === 0 ? <p className="text-gray-500">No messages yet.</p> :
                  messages.map((msg, idx) => (
                    <div key={idx} className={`mb-2 flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <span className={`inline-block px-4 py-2 rounded-2xl font-medium max-w-[70%] break-words ${msg.sender === 'admin' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-gray-900'}`}>{msg.text}</span>
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
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-500 mt-20 text-center">Select a chat to view messages.</div>
          )}
        </div>
      </div>
    </div>
  );
} 