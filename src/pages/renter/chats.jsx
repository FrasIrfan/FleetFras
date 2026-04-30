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
  const [userInfo, setUserInfo] = useState({});
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
      const chatList = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userMap = {};
      usersSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        userMap[docSnap.id] = {
          name: data.displayName || data.name || 'Purchaser',
          email: data.email || '',
        };
      });
      setUserInfo(userMap);
    };
    fetchChats();
    return () => unsub && unsub();
  }, [currentUser]);

  const getPurchaserLabel = (userId) => {
    const user = userInfo[userId];
    if (!user) return 'Purchaser';
    return user.email || user.name || 'Purchaser';
  };

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
    <div className="ff-page flex flex-col items-center">
      <div className="ff-shell flex min-h-[600px] max-w-5xl gap-8">
        {/* Sidebar */}
        <div className="w-72 border-r border-slate-200 pr-6">
          <h2 className="mb-4 text-lg font-bold text-purple-800">Chats for Your Posts</h2>
          {chats.length === 0 ? <p className="text-slate-400">No chats yet.</p> :
            chats.map(chat => (
              <div key={chat.id}
                className={`mb-3 cursor-pointer rounded-xl border p-3 transition-colors ${selectedChat?.id === chat.id ? 'border-purple-300 bg-purple-50' : 'bg-slate-50'}`}
                style={selectedChat?.id === chat.id ? undefined : { borderColor: 'var(--ff-border)' }}
                onClick={() => setSelectedChat(chat)}>
                <div className="font-semibold text-slate-950">Post: {posts[chat.postId]?.title || chat.postId}</div>
                <div className="break-all text-sm text-slate-600">Purchaser: {getPurchaserLabel(chat.userId)}</div>
                {selectedChat?.id === chat.id && <div className="mt-1 text-xs font-bold text-purple-700">Selected</div>}
              </div>
            ))
          }
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <h3 className="mb-2 text-lg font-bold text-slate-950">Chat for Post: {posts[selectedChat.postId]?.title || selectedChat.postId}</h3>
              <div className="mb-2 text-sm text-slate-600">{posts[selectedChat.postId]?.description}</div>
              <div className="mb-4 flex min-h-[300px] flex-1 flex-col justify-end overflow-y-auto rounded-lg border bg-slate-50 p-3 shadow-inner" style={{ borderColor: 'var(--ff-border)' }}>
                {messages.length === 0 ? <p className="mt-8 text-center text-slate-400">No messages yet.</p> :
                  messages.map((msg, idx) => (
                    <div key={idx} className={`mb-3 flex ${msg.sender === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%]">
                        <div className={`mb-1 text-xs ${msg.sender === currentUser.uid ? 'text-right text-purple-700' : 'text-left text-slate-500'}`}>{msg.sender === currentUser.uid ? 'You:' : getPurchaserLabel(selectedChat.userId)}</div>
                        <span className={`inline-block rounded-2xl px-4 py-2 font-medium shadow-md break-words transition-all ${msg.sender === currentUser.uid ? 'bg-purple-700 text-white rounded-br-none' : 'border border-slate-200 bg-white text-slate-900 rounded-bl-none'}`}>{msg.text}</span>
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
                  className="ff-input flex-1 px-4 py-3 text-base"
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                />
                <button
                  onClick={sendMessage}
                  className="ff-button-primary rounded-xl px-6 py-3 font-semibold"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="mt-24 text-center text-slate-400">Select a chat to view messages.</div>
          )}
        </div>
      </div>
    </div>
  );
} 