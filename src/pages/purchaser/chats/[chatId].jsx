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
    <div className="ff-page flex flex-col items-center">
      <div className="ff-shell-narrow flex h-[600px] max-w-md flex-col">
        <h2 className="mb-4 text-center text-2xl font-semibold text-slate-900">Chat with Renter</h2>
        {post && (
          <div className="animate-fade-in mb-4 rounded-lg border bg-slate-50 p-4 shadow-inner" style={{ borderColor: 'var(--ff-border)' }}>
            <div className="mb-1 text-lg font-bold text-purple-700">${post.price}</div>
            <div className="mb-1 font-semibold text-slate-950">{post.title}</div>
            <div className="text-sm text-slate-600">{post.description}</div>
          </div>
        )}
        <div className="mb-4 flex-1 overflow-y-auto rounded-lg border bg-slate-50 p-3 shadow-inner" style={{ borderColor: 'var(--ff-border)' }}>
          {messages.length === 0 ? (
            <p className="mt-8 text-center text-slate-400">No messages yet.</p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 flex transition-all duration-300 ease-in-out animate-fade-in ${msg.sender === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[70%]">
                  <div className={`mb-1 text-xs ${msg.sender === currentUser?.uid ? 'text-right text-purple-700' : 'text-left text-slate-500'}`}>{msg.sender === currentUser?.uid ? 'You:' : 'Renter:'}</div>
                  <span
                    className={`inline-block rounded-2xl px-4 py-2 font-medium shadow-md break-words transition-all duration-300 ease-in-out ${
                      msg.sender === currentUser?.uid
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
        <div className="mt-2 flex gap-2 text-black">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="ff-input flex-1 px-4 py-3 text-base"
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          />
          <button
            onClick={sendMessage}
            className="ff-button-primary rounded-xl px-6 py-3 font-semibold active:scale-95"
          >
            Send
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s;
        }
      `}</style>
    </div>
  );
} 