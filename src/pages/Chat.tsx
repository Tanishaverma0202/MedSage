import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MoreVertical, Folder, Plus, ChevronLeft, Mic, Square, Lock, Unlock, Clock, Calendar, Edit2, Trash2, Archive, X, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MedSageLogo } from '@/components/MedSageLogo';

// Backend API is used with AI service (Ollama)

// --- Formatted Message Component ---
function FormattedMessage({ content }: { content: string }) {
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines but add spacing
      if (!line.trim()) {
        elements.push(<div key={key++} className="h-2" />);
        continue;
      }

      // Headers (### or ## or #)
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-base font-bold text-slate-800 mt-4 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-teal-500" />
            {line.replace(/^### /, '')}
          </h3>
        );
        continue;
      }
      
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-lg font-bold text-slate-800 mt-4 mb-2">
            {line.replace(/^## /, '')}
          </h2>
        );
        continue;
      }

      // Bullet lists
      if (line.startsWith('* ')) {
        const items: string[] = [];
        let j = i;
        while (j < lines.length && lines[j].startsWith('* ')) {
          items.push(lines[j].replace(/^\* /, ''));
          j++;
        }
        elements.push(
          <ul key={key++} className="space-y-2 my-3">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <ArrowRight className="w-3 h-3 text-teal-500 mt-1 shrink-0" />
                <span>{formatBoldText(item)}</span>
              </li>
            ))}
          </ul>
        );
        i = j - 1;
        continue;
      }

      // Regular paragraphs
      elements.push(
        <p key={key++} className="text-sm text-slate-700 leading-relaxed mb-2">
          {formatBoldText(line)}
        </p>
      );
    }

    return elements;
  };

  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return <div className="space-y-1">{parseContent(content)}</div>;
}

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  audioData?: string;
};

type ChatSession = {
  id: string;
  title: string;
  mode: 'General' | 'Nutrition' | 'Workout' | 'Mental Health' | 'Hormones';
  messages: Message[];
  createdAt: string;
  isArchived?: boolean;
};

export function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [loadedSessionIds, setLoadedSessionIds] = useState<Set<string>>(new Set());
  const [isInitializing, setIsInitializing] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Menu & Edit State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [detailsSessionId, setDetailsSessionId] = useState<string | null>(null);

  // Archive State
  const [viewingArchive, setViewingArchive] = useState(false);
  const [showArchivePasscode, setShowArchivePasscode] = useState(false);
  const [isArchiveUnlocked, setIsArchiveUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isTyping]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await fetch('/api/v1/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            const historySessions: ChatSession[] = data.data.map((c: any) => ({
              id: c._id,
              title: c.title || 'Conversation',
              mode: c.focusArea === 'general' ? 'General' : 
                    c.focusArea === 'nutrition' ? 'Nutrition' : 
                    c.focusArea === 'workout' ? 'Workout' : 'Mental Health',
              createdAt: c.createdAt,
              messages: [], // We'll load them lazily
              isArchived: c.isArchived
            }));
            setSessions(historySessions);
            if (historySessions.length > 0) {
              setActiveSessionId(historySessions[0].id);
            }
          } else {
            // Setup default
            createNewChat('General');
          }
        }
      } catch (e) {
        console.error('Failed to load history', e);
      } finally {
        setIsInitializing(false);
      }
    };
    
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSessionId || activeSessionId.startsWith('new-') || loadedSessionIds.has(activeSessionId)) return;
    
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`/api/v1/chat/messages?conversationId=${activeSessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.messages) {
             const msgs = data.data.messages.map((m: any) => ({
               id: m._id,
               role: m.role,
               content: m.content
             }));
             
             if (msgs.length === 0) {
               msgs.push({ id: Date.now().toString(), role: 'model', content: `Hello! How can I help you today?` });
             }
             
             setSessions(prev => prev.map(s => 
               s.id === activeSessionId ? { ...s, messages: msgs } : s
             ));
             setLoadedSessionIds(prev => new Set(prev).add(activeSessionId));
          }
        }
      } catch(e) {
        console.error('Failed to load messages', e);
      }
    };
    
    fetchMessages();
  }, [activeSessionId, loadedSessionIds]);

  const handleSend = async () => {
    if (!input.trim() || !activeSession) return;

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, messages: [...s.messages, newUserMsg] }
        : s
    ));
    setInput('');
    setIsTyping(true);
    let targetSessionId = activeSessionId;

    try {
      // Call backend API with AI service (Ollama)
      console.log('🔍 Sending message to AI...', { activeSessionId, input });
      
      // If it's a new unsaved session, create a real one first
      if (activeSessionId.startsWith('new-')) {
        const createRes = await fetch('/api/v1/chat/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            title: activeSession.title,
            focusArea: (activeSession.mode || 'general').toLowerCase().replace(' ', '-')
          })
        });
        
        if (createRes.ok) {
          const createData = await createRes.json();
          targetSessionId = createData.data._id || createData.data.id;
          
          // Update state with real ID
          setSessions(prev => prev.map(s => 
            s.id === activeSessionId ? { ...s, id: targetSessionId } : s
          ));
          setActiveSessionId(targetSessionId);
        }
      }

      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      // Retry mechanism for intermittent errors
      while (retryCount <= maxRetries) {
        try {
          response = await fetch(`/api/v1/chat/conversations/${targetSessionId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
              content: input,
              context: {
                focusArea: (activeSession.mode || 'general').toLowerCase()
              }
            })
          });
          
          // If successful, break the retry loop
          if (response.ok) {
            break;
          }
          
          // If it's a 500 error, retry
          if (response.status === 500 && retryCount < maxRetries) {
            console.log(`🔄 500 error detected, retrying... (${retryCount + 1}/${maxRetries + 1})`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            continue;
          }
          
          // For other errors, don't retry
          break;
          
        } catch (fetchError) {
          console.error('❌ Fetch error:', fetchError);
          if (retryCount < maxRetries) {
            console.log(`🔄 Fetch error, retrying... (${retryCount + 1}/${maxRetries + 1})`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          throw fetchError;
        }
      }

      console.log('📊 AI Response status:', response.status);
      console.log('📊 AI Response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        console.error('❌ AI API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('📄 Error response body:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ AI Response received:', result);
      
      let aiContent = result.data?.assistantMessage?.content || result.data?.content || '';
      const updatedTitle = result.data?.conversation?.title;

      // Resilience check: If AI returns {} or empty string, provide a friendly fallback
      if (!aiContent || aiContent.trim() === '{}' || aiContent.trim() === '[]') {
        console.warn('⚠️ AI returned empty or malformed content, using fallback.');
        aiContent = "I'm processing your request but having trouble generating a specific response right now. Please try rephrasing your question or check back in a moment!";
      }
      
      const aiMsg: Message = { 
        id: result.data?.assistantMessage?._id || (Date.now() + 1).toString(), 
        role: 'model', 
        content: aiContent 
      };

      setSessions(prev => prev.map(s => 
        (s.id === targetSessionId || s.id === activeSessionId)
          ? { 
              ...s, 
              title: updatedTitle || s.title,
              messages: [...s.messages, aiMsg] 
            }
          : s
      ));
      
      console.log('✅ AI message added to chat');
    } catch (error) {
      console.error('❌ Error calling AI:', error);
      
      let errorMessage = 'I apologize, but I am currently unable to connect to my AI engine. Please ensure Ollama is running locally with `ollama serve`, or try again later.';
      
      if (error instanceof Error && error.message.includes('401')) {
        errorMessage = 'Your session has expired or you are not logged in. Please refresh the page and log in again.';
      }

      // Fallback message when API fails
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: errorMessage 
      };
      setSessions(prev => prev.map(s => 
        (s.id === targetSessionId || s.id === activeSessionId)
          ? { ...s, messages: [...s.messages, errorMsg] }
          : s
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const createNewChat = (mode: ChatSession['mode']) => {
    const newSession: ChatSession = {
      id: `new-${Date.now()}`,
      title: `New ${mode} Chat`,
      mode,
      createdAt: new Date().toISOString(),
      messages: [{ id: Date.now().toString(), role: 'model', content: `Hi! I'm ready to help you with your ${mode.toLowerCase()} goals.` }]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setViewingArchive(false);
  };

  const handleRenameSession = async (id: string) => {
    if (!editTitle.trim()) return;
    
    // Optimistic update
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle } : s));
    setEditingSessionId(null);
    setMenuOpenId(null);

    try {
      const token = localStorage.getItem('token');
      if (!token || id.startsWith('new-')) return;

      await fetch(`/api/v1/chat/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle })
      });
    } catch (e) {
      console.error('Failed to rename session', e);
    }
  };

  const handleDeleteSession = async (id: string) => {
    // Optimistic update
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      const nextSession = sessions.find(s => s.id !== id && !s.isArchived);
      setActiveSessionId(nextSession?.id || '');
    }
    setMenuOpenId(null);

    try {
      const token = localStorage.getItem('token');
      if (!token || id.startsWith('new-')) return;

      await fetch(`/api/v1/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error('Failed to delete session', e);
    }
  };

  const handleToggleArchive = async (id: string) => {
    const isArchiving = !sessions.find(s => s.id === id)?.isArchived;

    // Optimistic update
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isArchived: !s.isArchived } : s));
    if (activeSessionId === id && !viewingArchive) {
      const nextSession = sessions.find(s => s.id !== id && !s.isArchived);
      setActiveSessionId(nextSession?.id || '');
    }
    setMenuOpenId(null);

    try {
      const token = localStorage.getItem('token');
      if (!token || id.startsWith('new-')) return;

      if (isArchiving) {
        await fetch(`/api/v1/chat/conversations/${id}/archive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      // Note: Backend might need unarchive endpoint if we want to support toggle back
    } catch (e) {
      console.error('Failed to archive session', e);
    }
  };

  const handleUnlockArchive = () => {
    if (passcode === '1234') {
      setIsArchiveUnlocked(true);
      setShowArchivePasscode(false);
      setPasscode('');
      setViewingArchive(true);
      const firstArchived = sessions.find(s => s.isArchived);
      if (firstArchived) setActiveSessionId(firstArchived.id);
    } else {
      alert('Incorrect passcode. Hint: 1234');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await handleSendAudio(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = async (base64Audio: string) => {
    if (!activeSession) return;

    const newUserMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: '🎤 Voice Note',
      audioData: base64Audio 
    };
    
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, messages: [...s.messages, newUserMsg] }
        : s
    ));
    setIsTyping(true);

    try {
      // Call backend API with Ollama fallback for audio
      const response = await fetch(`/api/v1/chat/conversations/${activeSessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          content: '🎤 Voice Note received',
          context: {
            focusArea: (activeSession.mode || 'general').toLowerCase(),
            audioData: base64Audio
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      const newAiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: result.data?.assistantMessage?.content || result.data?.content || 'I am sorry, I could not process that audio.' 
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, newAiMsg] }
          : s
      ));
    } catch (error) {
      console.error('Error calling AI with audio:', error);
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: 'Sorry, I encountered an error processing your voice note.' 
      };
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, errorMsg] }
          : s
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const displayedSessions = sessions.filter(s => viewingArchive ? s.isArchived : !s.isArchived);

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[600px] bg-white/30 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden relative transition-all duration-500">
      
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/40 bg-white/20 backdrop-blur-xl flex flex-col transition-all"
          >
            <div className="p-5 border-b border-white/40 flex justify-between items-center bg-white/10">
              <h2 className="font-bold text-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Folder className="w-4 h-4 text-white" />
                </div>
                <span className="tracking-tight text-lg">{viewingArchive ? 'Archive' : 'Insights'}</span>
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    if (viewingArchive) {
                      setViewingArchive(false);
                      const firstNormal = sessions.find(s => !s.isArchived);
                      if (firstNormal) setActiveSessionId(firstNormal.id);
                    } else {
                      if (isArchiveUnlocked) {
                        setViewingArchive(true);
                        const firstArchived = sessions.find(s => s.isArchived);
                        if (firstArchived) setActiveSessionId(firstArchived.id);
                      } else {
                        setShowArchivePasscode(true);
                      }
                    }
                  }} 
                  className={cn("p-1.5 rounded-lg transition-colors", viewingArchive ? "bg-purple-100 text-purple-600" : "hover:bg-white/50 text-slate-600")}
                  title={viewingArchive ? "Back to Conversations" : "Open Archive"}
                >
                  {viewingArchive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
                {!viewingArchive && (
                  <button onClick={() => createNewChat('General')} className="p-1.5 hover:bg-white/50 rounded-lg text-slate-600 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
              {displayedSessions.length === 0 && (
                <div className="text-center p-4 text-slate-500 text-sm">
                  No {viewingArchive ? 'archived ' : ''}conversations found.
                </div>
              )}
              {displayedSessions.map(session => {
                const lastMessage = session.messages[session.messages.length - 1];
                const lastMessagePreview = lastMessage 
                  ? (lastMessage.role === 'user' ? 'You: ' : 'AI: ') + lastMessage.content.slice(0, 40) + (lastMessage.content.length > 40 ? '...' : '')
                  : 'No messages yet';
                const messageCount = session.messages.length;
                
                return (
                  <div 
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={cn(
                      "p-3 rounded-xl transition-all border group relative cursor-pointer",
                      activeSessionId === session.id 
                        ? "bg-white/80 border-teal-200 shadow-sm" 
                        : "bg-transparent border-transparent hover:bg-white/40 hover:border-white/60"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRenameSession(session.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameSession(session.id)}
                          autoFocus
                          className="text-sm font-medium text-slate-800 bg-white border border-teal-300 rounded px-1 w-full mr-2 outline-none"
                        />
                      ) : (
                        <h3 className="text-sm font-semibold text-slate-800 truncate pr-4">{session.title}</h3>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === session.id ? null : session.id); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Last message preview */}
                    <p className="text-xs text-slate-500 truncate mb-2">{lastMessagePreview}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        session.mode === 'General' ? "bg-slate-100 text-slate-600" :
                        session.mode === 'Nutrition' ? "bg-emerald-100 text-emerald-600" :
                        session.mode === 'Workout' ? "bg-orange-100 text-orange-600" :
                        "bg-purple-100 text-purple-600"
                      )}>
                        {session.mode}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        {messageCount} {messageCount === 1 ? 'msg' : 'msgs'}
                      </span>
                    </div>

                    {/* 3-Dots Menu */}
                    {menuOpenId === session.id && (
                      <div className="absolute top-8 right-2 bg-white border border-slate-200 shadow-lg rounded-xl py-1 z-20 w-36">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditTitle(session.title); setMenuOpenId(null); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-3 h-3" /> Rename
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDetailsSessionId(session.id); setMenuOpenId(null); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Clock className="w-3 h-3" /> Details
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleArchive(session.id); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Archive className="w-3 h-3" /> {session.isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-20 border-b border-white/40 bg-white/20 backdrop-blur-md flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2.5 hover:bg-white/60 rounded-2xl text-slate-600 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", !showSidebar && "rotate-180")} />
            </button>
            <div className="flex flex-col">
              <h2 className="font-bold text-slate-900 tracking-tight text-lg">{activeSession?.title || 'Expert Health Consultation'}</h2>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{activeSession?.mode} Specialist Online</p>
              </div>
            </div>
          </div>
          
          {/* Professional 3D-effect Avatar Container */}
          <div className="relative group cursor-help">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl border-2 border-emerald-50 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-teal-400/20 to-emerald-400/20 animate-spin-slow" />
               <MedSageLogo variant="icon" className="w-8 h-8" />
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSession?.messages.map((msg, idx) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-lg transition-transform hover:scale-105",
                msg.role === 'user' 
                  ? "bg-white border border-slate-100 text-slate-600" 
                  : "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <MedSageLogo variant="icon" className="w-6 h-6 text-white" />}
              </div>
              <div className={cn(
                "px-6 py-4 rounded-3xl text-[15px] leading-relaxed relative",
                msg.role === 'user' 
                  ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-tr-none shadow-xl shadow-teal-600/10 font-medium" 
                  : "bg-white border border-slate-100/50 text-slate-800 rounded-tl-none shadow-[0_10px_40px_rgba(0,0,0,0.03)]"
              )}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="prose-slate">
                    <FormattedMessage content={msg.content} />
                  </div>
                )}
                <div 
                   className={cn(
                     "absolute bottom-[-18px] text-[10px] uppercase tracking-widest font-bold text-slate-300",
                     msg.role === 'user' ? "right-2" : "left-2"
                   )}
                >
                   {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 max-w-[80%]"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-400 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <MedSageLogo variant="icon" className="w-4 h-4 text-white" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white text-slate-800 rounded-tl-sm border border-slate-100 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/30 border-t border-white/50 shrink-0">
          <div className="relative max-w-4xl mx-auto flex items-center gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "p-3 rounded-full flex items-center justify-center transition-colors shrink-0",
                isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/80 text-slate-600 hover:bg-white"
              )}
              title={isRecording ? "Stop Recording" : "Record Voice Note"}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? "Recording..." : `Ask MedSage about your ${activeSession?.mode.toLowerCase()}...`}
                className="w-full bg-white/80 backdrop-blur-md border border-white/80 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-slate-700 placeholder:text-slate-400 transition-all"
                disabled={isTyping || !activeSession || isRecording}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping || !activeSession || isRecording}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Archive Passcode Modal */}
      <AnimatePresence>
        {showArchivePasscode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button onClick={() => setShowArchivePasscode(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Archive Locker</h3>
              <p className="text-sm text-center text-slate-500 mb-6">Enter passcode to view hidden conversations.</p>
              <input 
                type="password" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlockArchive()}
                placeholder="Enter Passcode (1234)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-center tracking-[0.5em] font-mono text-lg mb-4"
                maxLength={4}
                autoFocus
              />
              <button 
                onClick={handleUnlockArchive}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors"
              >
                Unlock
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Session Details Modal */}
      <AnimatePresence>
        {detailsSessionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button onClick={() => setDetailsSessionId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-slate-800 mb-6">Conversation Details</h3>
              {sessions.find(s => s.id === detailsSessionId) && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</p>
                    <p className="text-slate-800 font-medium">{sessions.find(s => s.id === detailsSessionId)?.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mode</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block bg-slate-100 text-slate-600">
                      {sessions.find(s => s.id === detailsSessionId)?.mode}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Created At</p>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(sessions.find(s => s.id === detailsSessionId)?.createdAt || '').toLocaleDateString()}
                      <span className="text-slate-300">|</span>
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(sessions.find(s => s.id === detailsSessionId)?.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Messages</p>
                    <p className="text-slate-800 font-medium">{sessions.find(s => s.id === detailsSessionId)?.messages.length} messages</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
