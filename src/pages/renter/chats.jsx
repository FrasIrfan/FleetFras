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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 flex flex-col items-center py-8 px-2 sm:px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-4 sm:p-8 flex gap-8 min-h-[600px]">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-200 pr-6">
          <h2 className="text-indigo-600 font-bold mb-4 text-lg">Chats for Your Posts</h2>
          {chats.length === 0 ? <p className="text-gray-400">No chats yet.</p> :
            chats.map(chat => (
              <div key={chat.id}
                className={`mb-3 cursor-pointer ${selectedChat?.id === chat.id ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-50 border-gray-100'} rounded-lg p-3 border transition-colors`}
                onClick={() => setSelectedChat(chat)}>
                <div className="font-semibold text-gray-900">Post: {posts[chat.postId]?.title || chat.postId}</div>
                <div className="text-gray-600 text-sm">Purchaser: {chat.userId}</div>
                {selectedChat?.id === chat.id && <div className="text-indigo-600 font-bold text-xs mt-1">Selected</div>}
              </div>
            ))
          }
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <h3 className="text-indigo-600 font-bold mb-2 text-lg">Chat for Post: {posts[selectedChat.postId]?.title || selectedChat.postId}</h3>
              <div className="mb-2 text-gray-600 text-sm">{posts[selectedChat.postId]?.description}</div>
              <div className="flex-1 flex flex-col justify-end overflow-y-auto mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-inner min-h-[300px]">
                {messages.length === 0 ? <p className="text-gray-400 text-center mt-8">No messages yet.</p> :
                  messages.map((msg, idx) => (
                    <div key={idx} className={`mb-3 flex ${msg.sender === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%]">
                        <div className={`text-xs mb-1 ${msg.sender === currentUser.uid ? 'text-indigo-500 text-right' : 'text-gray-500 text-left'}`}>{msg.sender === currentUser.uid ? 'You:' : 'Purchaser:'}</div>
                        <span className={`inline-block rounded-2xl px-4 py-2 font-medium shadow-md break-words transition-all ${msg.sender === currentUser.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-indigo-100 text-gray-900 rounded-bl-none'}`}>{msg.text}</span>
                      </div>
                    </div>
                  ))
                }
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
            </>
          ) : (
            <div className="text-gray-400 mt-24 text-center">Select a chat to view messages.</div>
          )}
        </div>
      </div>
    </div>
  );
} 