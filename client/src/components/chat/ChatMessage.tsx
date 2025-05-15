import React, { useState } from 'react';
import { 
  Copy, Check, X, ExternalLink, Cpu, User, 
  BookOpen, Calculator, Lightbulb, Image as ImageIcon,
  List, AlertCircle, HelpCircle, CheckCircle, AlertTriangle,
  Brain, Zap, Target, Bookmark, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '../../types';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface ImageObject {
  image_url: string;
  filename?: string;
  page?: number;
  document?: string;
}

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  console.log(message)
  const [isCopied, setIsCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  // Function to format points in text
  const formatPoints = (text: string) => {
    // First, handle block equations that span multiple lines
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: true });
      } catch (e) {
        console.error('LaTeX rendering error:', e);
        return tex;
      }
    });

    return text.split('\n').map((line, index) => {
      // Handle inline LaTeX expressions
      line = line.replace(/\\\((.*?)\\\)/g, (_, tex) => {
        try {
          return katex.renderToString(tex.trim(), { displayMode: false });
        } catch (e) {
          console.error('LaTeX rendering error:', e);
          return tex;
        }
      });

      // Handle bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <div className="mt-1.5">
              <CheckCircle className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            </div>
            <div 
              className="text-gray-700 dark:text-gray-300" 
              dangerouslySetInnerHTML={{ __html: line.replace(/^[•-]\s*/, '') }} 
            />
          </div>
        );
      }
      
      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <div className="mt-1.5">
              <CheckCircle className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            </div>
            <div 
              className="text-gray-700 dark:text-gray-300" 
              dangerouslySetInnerHTML={{ __html: line }} 
            />
          </div>
        );
      }
      
      // Regular text with proper spacing
      return (
        <div 
          key={index} 
          className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: line }} 
        />
      );
    });
  };

  // Function to format the answer content with sections
  const formatAnswerContent = (content: string) => {
    const sections = content.split(/(?=### )/);
    
    const sectionIcons: { [key: string]: React.ReactNode } = {
      'Description': <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />,
      'Derivation': <Calculator className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />,
      'Example': <Lightbulb className="w-5 h-5 text-accent-600 dark:text-accent-400" />,
      'Key Points': <List className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      'Important': <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      'Note': <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      'Warning': <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      'Formula': <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
      'Application': <Target className="w-5 h-5 text-green-600 dark:text-green-400" />,
      'Theory': <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      'Practice': <Bookmark className="w-5 h-5 text-pink-600 dark:text-pink-400" />,
      'Summary': <List className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      'Conclusion': <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    };

    return sections.map((section, index) => {
      // Extract section title
      const match = section.match(/### ([^\n]+)/);
      if (match) {
        const [_, title] = match;
        const icon = sectionIcons[title] || <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
        const content = section.replace(/### [^\n]+\n/, '').trim();
        
        return (
          <div key={index} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              {icon}
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            </div>
            <div className="pl-7 space-y-2">
              {formatPoints(content)}
            </div>
          </div>
        );
      }
      return <div key={index} className="mb-4">{formatPoints(section.trim())}</div>;
    });
  };

  return (
    <>
      <motion.div
        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-full md:max-w-[85%]`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-primary-100 dark:bg-primary-900' 
                : 'bg-accent-100 dark:bg-accent-900'
            }`}>
              {isUser ? (
                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              ) : (
                <Cpu className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              )}
            </div>
          </div>

          {/* Message content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            {/* Message bubble */}
            <div className={`p-4 rounded-lg ${
              isUser 
                ? 'bg-primary-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
            }`}>
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="rounded-lg overflow-hidden border dark:border-gray-700">
                      {attachment.type.startsWith('image/') ? (
                        <img 
                          src={attachment.url} 
                          alt={attachment.name} 
                          className="max-w-full object-cover h-32"
                        />
                      ) : (
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 flex items-center justify-between">
                          <span className="truncate text-xs mr-2">{attachment.name}</span>
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Text content with sections */}
              <div className="whitespace-pre-wrap">
                {isUser ? (
                  message.content
                ) : (
                  formatAnswerContent(message.content)
                )}
              </div>

              {/* Images from AI response */}
              {!isUser && message.images && message.images.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Related Images</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {message.images.map((image: string | ImageObject, index) => {
                      const imageUrl = typeof image === 'string' ? image : image.image_url;
                      const imageAlt = typeof image === 'string' ? `Generated image ${index + 1}` : image.filename || `Generated image ${index + 1}`;
                      
                      return (
                        <div key={index} className="rounded-lg overflow-hidden border dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity">
                          <img 
                            src={imageUrl} 
                            alt={imageAlt}
                            className="w-full h-auto object-cover"
                            onClick={() => setSelectedImage(imageUrl)}
                            onError={(e) => {
                              console.error(`Failed to load image:`, image);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log(`Successfully loaded image:`, image);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Message metadata */}
            <div className={`mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}>
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              
              {!isUser && (
                <button
                  onClick={copyToClipboard}
                  className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMessage;