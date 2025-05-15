import React, { useMemo } from 'react';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSession } from '../../types';

interface ChatSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sessions: ChatSession[];
  currentSessionId: string | undefined;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  setIsOpen,
  sessions,
  currentSessionId,
  onNewSession,
  onSelectSession,
  isLoading
}) => {
  // Sort sessions by updatedAt descending
  const sortedSessions = useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [sessions]);

  // Format date for display
  const formatDate = (date: Date): string => {
    const now = new Date();
    const chatDate = new Date(date);

    if (now.toDateString() === chatDate.toDateString()) {
      return chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const diffDays = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return chatDate.toLocaleDateString([], { weekday: 'short' });
    }

    return chatDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="md:hidden fixed inset-0 bg-black/40 dark:bg-black/60 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col z-20 md:relative fixed inset-y-0 left-0"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3">
              <button
                onClick={onNewSession}
                className="w-full flex items-center justify-center space-x-2 btn btn-primary py-2"
              >
                <PlusCircle className="w-5 h-5" />
                <span>New Chat</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading chats...</p>
                </div>
              ) : sortedSessions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">No chat history</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {sortedSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        session.id === currentSessionId
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium truncate">
                        {session.title}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-xs truncate max-w-[8rem] text-gray-500 dark:text-gray-400">
                          {session.messages.length} messages
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(session.updatedAt)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
