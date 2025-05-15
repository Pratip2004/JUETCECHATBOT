import React, { useState, useRef, useEffect } from 'react';
import { useNavigate,useParams } from 'react-router-dom';
import { PlusCircle, Send, X, Paperclip, Download, Trash2, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatMessage from '../components/chat/ChatMessage';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';
import { ChatMessage as ChatMessageType, ChatSession, Subject, Semester, Year } from '../types';
import { startChat, multimodalChat } from '../services/api';
import { toast } from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<Semester | ''>('');
  const [selectedYear, setSelectedYear] = useState<Year | ''>('');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { sessionId } = useParams();
  const navigate = useNavigate();
  // Add new state to track if filters are locked
  const [areFiltersLocked, setAreFiltersLocked] = useState(false);

  // Updated subjects data with year and semester
  const subjects: Subject[] = [
    // Year 1, Semester 1
    { id: '1', name: 'Basic Electronics', code: 'ECE101', year: '1', semester: '1' },
    { id: '2', name: 'Digital Logic Design', code: 'ECE102', year: '1', semester: '1' },
    { id: '3', name: 'Programming Fundamentals', code: 'ECE103', year: '1', semester: '1' },
    
    // Year 1, Semester 2
    { id: '4', name: 'Circuit Theory', code: 'ECE104', year: '1', semester: '2' },
    { id: '5', name: 'Electronic Devices', code: 'ECE105', year: '1', semester: '2' },
    { id: '6', name: 'Data Structures', code: 'ECE106', year: '1', semester: '2' },
    
    // Year 2, Semester 1
    { id: '7', name: 'Digital Electronics', code: 'ECE201', year: '2', semester: '1' },
    { id: '8', name: 'Communication Systems', code: 'ECE202', year: '2', semester: '1' },
    { id: '9', name: 'Signal Processing', code: 'ECE203', year: '2', semester: '1' },
    
    // Year 2, Semester 2
    { id: '10', name: 'Microcontrollers', code: 'ECE204', year: '2', semester: '2' },
    { id: '11', name: 'Antenna Theory', code: 'ECE205', year: '2', semester: '2' },
    { id: '12', name: 'Control Systems', code: 'ECE206', year: '2', semester: '2' },
    
    // Year 3, Semester 1
    { id: '13', name: 'Microprocessor', code: 'ECE301', year: '3', semester: '1' },
    { id: '14', name: 'Analog_CMOS', code: 'ECE302', year: '3', semester: '1' },
    { id: '15', name: 'Digital_Communication', code: 'ECE303', year: '3', semester: '1' },
    { id: '16', name: 'Antena', code: 'ECE304', year: '3', semester: '1' },
    { id: '17', name: 'COA', code: 'ECE305', year: '3', semester: '1' },
    { id: '18', name: 'Control_Systems', code: 'ECE306', year: '3', semester: '1' },
    // Year 3, Semester 2
    { id: '19', name: 'Optical Communications', code: 'ECE307', year: '3', semester: '2' },
    { id: '20', name: 'Satellite Communications', code: 'ECE308', year: '3', semester: '2' },
    { id: '21', name: 'Embedded Systems', code: 'ECE309', year: '3', semester: '2' },
    
    // Year 4, Semester 1
    { id: '22', name: 'Advanced Digital Systems', code: 'ECE401', year: '4', semester: '1' },
    { id: '23', name: 'RF Engineering', code: 'ECE402', year: '4', semester: '1' },
    { id: '24', name: 'IoT Systems', code: 'ECE403', year: '4', semester: '1' },
    
    // Year 4, Semester 2
    { id: '25', name: 'Advanced Communication Systems', code: 'ECE404', year: '4', semester: '2' },
    { id: '26', name: 'Digital Image Processing', code: 'ECE405', year: '4', semester: '2' },
    { id: '27', name: 'Project Work', code: 'ECE406', year: '4', semester: '2' },
  ];

  const semesters: Semester[] = ['1', '2'];
  const years: Year[] = ['1', '2', '3', '4'];

  // Filter subjects based on selected year and semester
  const filteredSubjects = subjects.filter(subject => {
    if (!selectedYear && !selectedSemester) return false;
    if (selectedYear && !selectedSemester) return subject.year === selectedYear;
    if (!selectedYear && selectedSemester) return subject.semester === selectedSemester;
    return subject.year === selectedYear && subject.semester === selectedSemester;
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Add function to save locked state to localStorage
  const saveLockedState = (sessionId: string, isLocked: boolean) => {
    const lockedSessions = JSON.parse(localStorage.getItem('lockedSessions') || '{}');
    lockedSessions[sessionId] = isLocked;
    localStorage.setItem('lockedSessions', JSON.stringify(lockedSessions));
  };

  // Add function to get locked state from localStorage
  const getLockedState = (sessionId: string): boolean => {
    const lockedSessions = JSON.parse(localStorage.getItem('lockedSessions') || '{}');
    return lockedSessions[sessionId] || false;
  };

  // Update createNewSession to clear locked state
  const createNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
  const newSession: ChatSession = {
    id: newSessionId,
    title: 'New Conversation',
    subject: '',
    semester: '' as Semester,
    year: '' as Year,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: []
  };

  setSessions(prev => [newSession, ...prev]);
  setCurrentSession(newSession);

  // Navigate to new route
  navigate(`/chat/${newSessionId}`);

  // Reset filters
  setSelectedYear('');
  setSelectedSemester('');
  setSelectedSubject('');
  setAreFiltersLocked(false);

  // Save initial locked state if needed
  localStorage.setItem(`locked_${newSessionId}`, JSON.stringify(false));
  };

  // Update switchSession to handle filter lock
  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      // Set filters based on session
      setSelectedSubject(session.subject || '');
      setSelectedSemester(session.semester || '');
      setSelectedYear(session.year || '');
      
      // Get locked state from localStorage
      const isLocked = getLockedState(sessionId);
      setAreFiltersLocked(isLocked);
      navigate(`/chat/${sessionId}`);
    }
  };

  // Handle file attachment button click
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...fileArray]);
    }
  };

  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle input changes
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Reset all input fields
  const resetInputs = () => {
    setPrompt('');
    setAttachments([]);
    setSelectedSubject('');
    setSelectedSemester('');
    setSelectedYear('');
  };

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value as Year | '';
    setSelectedYear(newYear);
    // Reset subject if it doesn't match the new year
    if (selectedSubject) {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (subject && subject.year !== newYear) {
        setSelectedSubject('');
      }
    }
  };

  // Handle semester change
  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSemester = e.target.value as Semester | '';
    setSelectedSemester(newSemester);
    // Reset subject if it doesn't match the new semester
    if (selectedSubject) {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (subject && subject.semester !== newSemester) {
        setSelectedSubject('');
      }
    }
  };

  // Handle subject change
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = e.target.value;
    console.log('Selected subject ID:', subjectId);
    const selectedSubjectData = subjects.find(s => s.id === subjectId);
    console.log('Selected subject data:', selectedSubjectData);
    console.log('Submitting with subject:', selectedSubjectData);
    setSelectedSubject(subjectId);
  };

  // Update handleSubmit to save locked state
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() && attachments.length === 0) return;
    if (!currentSession) {
      createNewSession();
      return;
    }

    // Lock filters after first message and save to localStorage
    if (currentSession.messages.length === 0) {
      setAreFiltersLocked(true);
      saveLockedState(currentSession.id, true);
    }

    // Get the selected subject data
    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
    console.log('Submitting with subject:', selectedSubjectData);
    
    // Add user message
    const userMessage: ChatMessageType = {
      id: `msg_${Date.now()}`,
      content: prompt,
      role: 'user',
      timestamp: new Date(),
      attachments: attachments.map(file => ({
        id: `att_${Date.now()}_${file.name}`,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      }))
    };
    
    const updatedMessages = [...currentSession.messages, userMessage];
    
    // Update current session
    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
      updatedAt: new Date(),
      subject: selectedSubject || currentSession.subject,
      semester: selectedSemester || currentSession.semester,
      year: selectedYear || currentSession.year,
      title: prompt.split('\n')[0].substring(0, 30) + (prompt.length > 30 ? '...' : '')
    };
    
    // Update sessions state
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
    
    setCurrentSession(updatedSession);
    setPrompt('');
    setAttachments([]);
    setIsProcessing(true);

    try {
      let response;
      
      if (attachments.length > 0) {
        // Handle multimodal chat with file
        response = await multimodalChat(
          prompt,
          currentSession.id,
          selectedYear || '',
          selectedSemester || '',
          selectedSubjectData?.name || '', // Send subject name instead of ID
          attachments[0]
        );
      } else {
        // Handle regular chat
        response = await startChat(
          prompt,
          currentSession.id,
          selectedYear || '',
          selectedSemester || '',
          selectedSubjectData?.name || '' // Send subject name instead of ID
        );
      }

      const aiMessage: ChatMessageType = {
        id: `msg_${Date.now()}`,
        content: response.answer,
        role: 'assistant',
        timestamp: new Date(),
        images: response.images
      };
      
      const updatedWithAiMessage = {
        ...updatedSession,
        messages: [...updatedMessages, aiMessage],
        updatedAt: new Date()
      };
      
      setSessions(prev => 
        prev.map(s => s.id === currentSession.id ? updatedWithAiMessage : s)
      );
      
      setCurrentSession(updatedWithAiMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update fetchChatHistory to restore locked states
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        setIsLoadingHistory(true);
        const response = await api.get('/search_chats', {
          params: { query: '' }
        });

        if (!response.data) throw new Error('Failed to fetch chat history');

        const data = response.data;
        const sessionMap = new Map<string, ChatSession>();

        data.matches.forEach((chat: any) => {
          if (!sessionMap.has(chat.session_id)) {
            sessionMap.set(chat.session_id, {
              id: chat.session_id,
              title: chat.question.substring(0, 30) + (chat.question.length > 30 ? '...' : ''),
              subject: chat.subject,
              semester: chat.semester,
              year: chat.year,
              createdAt: new Date(),
              updatedAt: new Date(),
              messages: []
            });
          }

          const session = sessionMap.get(chat.session_id)!;

          session.messages.push({
            id: `msg_${Date.now()}_user`,
            content: chat.question,
            role: 'user',
            timestamp: new Date(),
            attachments: chat.file_used ? [{
              id: `att_${Date.now()}_${chat.file_used}`,
              name: chat.file_used,
              type: 'file',
              url: ''
            }] : undefined
          });

          session.messages.push({
            id: `msg_${Date.now()}_ai`,
            content: chat.answer,
            role: 'assistant',
            timestamp: new Date(),
            images: chat.images
          });
        });

        const chatSessions = Array.from(sessionMap.values())
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        setSessions(chatSessions);

        let sessionToLoad = chatSessions.find(s => s.id === sessionId);

        if (!sessionToLoad && chatSessions.length > 0) {
          sessionToLoad = chatSessions[0];
          navigate(`/chat/${sessionToLoad.id}`, { replace: true });
        }

        if (sessionToLoad) {
          setCurrentSession(sessionToLoad);
          setSelectedYear(sessionToLoad.year || '');
          setSelectedSemester(sessionToLoad.semester || '');
          setSelectedSubject(sessionToLoad.subject || '');
          setAreFiltersLocked(getLockedState(sessionToLoad.id));
        }

      } catch (err) {
        console.error('Error fetching history', err);
        toast.error('Failed to load chat history');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchChatHistory();
  }, [user, sessionId]);
  // Update clearChat to maintain locked state
  const clearChat = () => {
    if (!currentSession) return;
    
    const clearedSession = {
      ...currentSession,
      messages: [],
      updatedAt: new Date()
    };
    
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? clearedSession : s)
    );
    
    setCurrentSession(clearedSession);
    // Maintain the locked state
    setAreFiltersLocked(getLockedState(currentSession.id));
  };

  // Handle export chat
  const exportChat = () => {
    if (!currentSession) return;
    
    const chatContent = currentSession.messages
      .map(msg => `[${msg.role}] ${new Date(msg.timestamp).toLocaleString()}\n${msg.content}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed bottom-4 left-4 z-20">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="btn btn-primary rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSession?.id}
        onNewSession={createNewSession}
        onSelectSession={switchSession}
        isLoading={isLoadingHistory}
      />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {isLoadingHistory ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading chat history...</p>
            </div>
          </div>
        ) : !currentSession ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center max-w-md"
            >
              <div className="mb-6 mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                <PlusCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Start a New Conversation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ask questions about electronics, telecom concepts, or upload documents for analysis.
              </p>
              <button
                onClick={createNewSession}
                className="btn btn-primary px-6 py-3"
              >
                New Chat Session
              </button>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {currentSession.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {currentSession.subject && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                        {subjects.find(s => s.id === currentSession.subject)?.name || currentSession.subject}
                      </span>
                    )}
                    {currentSession.semester && (
                      <span className="text-xs bg-secondary-100 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-300 px-2 py-1 rounded-full">
                        Semester {currentSession.semester}
                      </span>
                    )}
                    {currentSession.year && (
                      <span className="text-xs bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-300 px-2 py-1 rounded-full">
                        Year {currentSession.year}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={clearChat}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Clear chat"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={exportChat}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Download chat"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {currentSession.messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4 mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No messages yet. Start by typing a question below.
                    </p>
                  </div>
                ) : (
                  currentSession.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                )}
                {isProcessing && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 dark:bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="wave-bars">
                        <div className="wave-bar h-2 bg-white"></div>
                        <div className="wave-bar h-3 bg-white"></div>
                        <div className="wave-bar h-4 bg-white"></div>
                        <div className="wave-bar h-3 bg-white"></div>
                        <div className="wave-bar h-2 bg-white"></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
            
            {/* Input area */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4">
              <div className="max-w-3xl mx-auto">
                {/* Filters */}
                <div className="mb-3 flex flex-wrap gap-2">
                  <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    className={`text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 ${
                      areFiltersLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={areFiltersLocked}
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedSemester}
                    onChange={handleSemesterChange}
                    className={`text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 ${
                      areFiltersLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!selectedYear || areFiltersLocked}
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((semester) => (
                      <option key={semester} value={semester}>Semester {semester}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedSubject}
                    onChange={handleSubjectChange}
                    className={`text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 ${
                      areFiltersLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!selectedYear || !selectedSemester || areFiltersLocked}
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>

                  {areFiltersLocked && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Filters are locked for this session
                    </div>
                  )}
                </div>
                
                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg pl-3 pr-1 py-1">
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Input form */}
                <form onSubmit={handleSubmit} className="relative">
                  <textarea
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Ask about circuits, signals, or any topic in electronics..."
                    className="input py-3 pr-28 resize-none h-16 max-h-32"
                    rows={1}
                  />
                  
                  <div className="absolute bottom-3 right-3 flex space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      accept="image/*,.pdf"
                    />
                    <button
                      type="button"
                      onClick={handleAttachmentClick}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || (!prompt.trim() && attachments.length === 0)}
                      className={`p-2 rounded-md ${
                        isProcessing || (!prompt.trim() && attachments.length === 0)
                          ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;