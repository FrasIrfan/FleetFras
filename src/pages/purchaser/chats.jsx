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
    <div className="ff-page flex flex-col items-center">
      <div className="ff-shell flex min-h-[720px] max-w-3xl flex-col p-0">
        <div className="border-b px-6 py-6 sm:px-8" style={{ borderColor: 'var(--ff-border)' }}>
          <p className="ff-kicker mb-2">Support</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Support Chat</h2>
          <p className="mt-2 text-sm text-slate-500">Send a message to the FleetFras admin team.</p>
        </div>
        <div className="flex flex-1 flex-col bg-slate-50/70 p-4 sm:p-6">
          <div className="mb-4 flex flex-1 flex-col justify-end overflow-y-auto rounded-[24px] border bg-white p-5 shadow-inner" style={{ borderColor: 'var(--ff-border)' }}>
          {messages.length === 0 ? (
            <div className="mx-auto my-auto max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-xl">💬</div>
              <p className="text-lg font-semibold text-slate-800">No messages yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Start the conversation and your messages will appear here.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 flex ${msg.sender === 'purchaser' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[70%]">
                  <div className={`mb-1 text-xs ${msg.sender === 'purchaser' ? 'text-right text-purple-700' : 'text-left text-slate-500'}`}>{msg.sender === 'purchaser' ? 'You:' : 'Admin:'}</div>
                  <span
                    className={`inline-block rounded-3xl px-4 py-3 text-sm font-medium shadow-sm break-words transition-all ${
                      msg.sender === 'purchaser'
                        ? 'bg-purple-700 text-white rounded-br-none'
                        : 'border border-slate-200 bg-white text-slate-900 rounded-bl-none'
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
        <div className="flex gap-3 rounded-[24px] border bg-white p-3 text-black shadow-sm" style={{ borderColor: 'var(--ff-border)' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="ff-input flex-1 border-0 bg-slate-50 px-4 py-3 text-base focus:ring-0"
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          />
          <button
            onClick={sendMessage}
            className="ff-button-primary rounded-2xl px-6 py-3 font-semibold"
          >
            Send
          </button>
        </div>
        </div>
      </div>
    </div>
  );
} 