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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 flex flex-col items-center py-8 px-2 sm:px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col h-[600px]">
        <h2 className="mb-4 text-2xl font-bold text-indigo-600 text-center tracking-tight drop-shadow-sm">Chat with Renter</h2>
        {post && (
          <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-inner animate-fade-in">
            <div className="font-bold text-indigo-600 text-lg mb-1">${post.price}</div>
            <div className="font-semibold text-gray-900 mb-1">{post.title}</div>
            <div className="text-gray-600 text-sm">{post.description}</div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-inner">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">No messages yet.</p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 flex transition-all duration-300 ease-in-out animate-fade-in ${msg.sender === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[70%]">
                  <div className={`text-xs mb-1 ${msg.sender === currentUser?.uid ? 'text-indigo-500 text-right' : 'text-gray-500 text-left'}`}>{msg.sender === currentUser?.uid ? 'You:' : 'Renter:'}</div>
                  <span
                    className={`inline-block rounded-2xl px-4 py-2 font-medium shadow-md break-words transition-all duration-300 ease-in-out ${
                      msg.sender === currentUser?.uid
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
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-white font-semibold shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-95"
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