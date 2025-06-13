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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 flex flex-col items-center py-8 px-2 sm:px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col h-[600px]">
        <h2 className="mb-4 text-2xl font-bold text-indigo-600 text-center tracking-tight drop-shadow-sm">Support Chat</h2>
        <div className="flex-1 flex flex-col justify-end overflow-y-auto mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-inner">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">No messages yet.</p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 flex ${msg.sender === 'purchaser' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[70%]">
                  <div className={`text-xs mb-1 ${msg.sender === 'purchaser' ? 'text-indigo-500 text-right' : 'text-gray-500 text-left'}`}>{msg.sender === 'purchaser' ? 'You:' : 'Admin:'}</div>
                  <span
                    className={`inline-block rounded-2xl px-4 py-2 font-medium shadow-md break-words transition-all ${
                      msg.sender === 'purchaser'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-indigo-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
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
      </div>
    </div>
  );
} 