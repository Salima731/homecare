import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, MoreVertical, 
  Paperclip, Smile, Phone, Video,
  ChevronLeft, CheckCheck, User,
  MessageSquare
} from 'lucide-react';
import { 
  useGetConversationsQuery, 
  useGetMessagesQuery, 
  useSendMessageMutation 
} from '../../../features/messages/messageApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../features/auth/authSlice';

const Messages = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef(null);

  const { data: convResponse, isLoading: convLoading } = useGetConversationsQuery(undefined, {
    pollingInterval: 3000,
  });
  const conversations = convResponse?.data || [];

  const { data: msgResponse, isLoading: msgLoading } = useGetMessagesQuery(selectedUser?._id, {
    skip: !selectedUser?._id,
    pollingInterval: 3000, // Simple polling for demo, ideally use Socket.io
  });
  const messages = msgResponse?.data || [];

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser) return;

    try {
      await sendMessage({
        recipientId: selectedUser._id,
        content: messageText
      }).unwrap();
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (convLoading) return <LoadingSpinner />;

  return (
    <div className="h-[calc(100vh-12rem)] flex overflow-hidden border border-[var(--border-main)] bg-[var(--bg-card)] rounded-3xl shadow-2xl p-0">
      {/* Sidebar - Conversations */}
      <div className={`w-full md:w-80 border-r border-[var(--border-main)] flex flex-col bg-[var(--bg-card)] ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-[var(--border-main)] space-y-4">
          <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight uppercase tracking-widest text-xs">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="input pl-10 py-2.5 text-xs w-full bg-[var(--bg-main)] border-[var(--border-main)] focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <button
                key={conv.user._id}
                onClick={() => setSelectedUser(conv.user)}
                className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-[var(--bg-main)] border-l-4 ${
                  selectedUser?._id === conv.user._id ? 'bg-primary-500/5 border-primary-500' : 'border-transparent'
                }`}
              >
                <div className="relative">
                  <img 
                    src={conv.user.avatar || `https://ui-avatars.com/api/?name=${conv.user.name}&background=random`} 
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[var(--bg-card)] shadow-lg"
                    alt={conv.user.name}
                  />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[var(--bg-card)] animate-pulse">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-[var(--text-main)] truncate text-sm">{conv.user.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter mt-1">
                      {format(new Date(conv.lastMessage.createdAt), 'HH:mm')}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate font-bold mt-0.5">
                    {conv.lastMessage.sender === currentUser._id ? 'You: ' : ''}
                    {conv.lastMessage.content}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-[var(--border-main)]">
                <MessageSquare className="text-[var(--text-muted)] opacity-20" size={24} />
              </div>
              <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">No messages</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 font-bold uppercase tracking-widest">Conversations appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[var(--bg-main)]/30 ${!selectedUser ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-main)] flex items-center justify-between shadow-xl z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-2 text-[var(--text-muted)] hover:bg-[var(--bg-main)] rounded-xl"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative">
                  <img 
                    src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`} 
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-primary-500/20 shadow-md"
                    alt={selectedUser.name}
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--bg-card)] rounded-full"></span>
                </div>
                <div>
                  <p className="font-black text-[var(--text-main)] text-sm tracking-tight">{selectedUser.name}</p>
                  <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-0.5">Online Now</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-500/10 rounded-2xl transition-all active:scale-90">
                  <Phone size={18} />
                </button>
                <button className="p-2.5 text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-500/10 rounded-2xl transition-all active:scale-90">
                  <Video size={18} />
                </button>
                <button className="p-2.5 text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-500/10 rounded-2xl transition-all active:scale-90">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar bg-[var(--bg-main)]/10">
              {messages.map((msg, idx) => {
                const isOwn = msg.sender._id === currentUser._id;
                return (
                  <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isOwn && (
                        <img 
                          src={msg.sender.avatar || `https://ui-avatars.com/api/?name=${msg.sender.name}`} 
                          className="w-8 h-8 rounded-xl mt-auto shadow-md"
                          alt="Sender"
                        />
                      )}
                      <div className="space-y-1.5">
                        <div className={`p-4 rounded-3xl shadow-lg ${
                          isOwn 
                            ? 'bg-primary-600 text-white rounded-br-none shadow-primary-600/20' 
                            : 'bg-[var(--bg-card)] text-[var(--text-main)] rounded-bl-none border border-[var(--border-main)]'
                        }`}>
                          <p className="text-sm leading-relaxed font-bold">{msg.content}</p>
                        </div>
                        <div className={`flex items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </p>
                          {isOwn && <CheckCheck size={14} className={msg.isRead ? 'text-blue-500' : 'text-[var(--text-muted)] opacity-40'} />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-main)]">
              <form onSubmit={handleSend} className="flex items-center gap-3 bg-[var(--bg-main)]/50 p-2 rounded-2xl border border-[var(--border-main)] focus-within:border-primary-500/50 transition-all">
                <div className="flex gap-1">
                  <button type="button" className="p-2.5 text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-500/10 rounded-xl transition-all active:scale-90">
                    <Paperclip size={20} />
                  </button>
                  <button type="button" className="p-2.5 text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-500/10 rounded-xl transition-all active:scale-90">
                    <Smile size={20} />
                  </button>
                </div>
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-black text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-40"
                />
                <button 
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-xl shadow-primary-600/20 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center p-12 max-w-sm">
            <div className="w-28 h-28 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-main)] flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
              <MessageSquare className="text-primary-600 animate-bounce" size={48} />
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary-600 rounded-2xl shadow-xl flex items-center justify-center ring-4 ring-[var(--bg-main)]">
                <User className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight mb-3">Your Conversations</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-black uppercase tracking-widest opacity-60">
              Select a chat from the sidebar to start messaging. You can message caregivers and agencies directly regarding your bookings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
